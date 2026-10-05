import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useData } from '../data'
import { useLang } from '../i18n'
import { useStats } from '../hooks'
import { METRICS, GROUPS, NUDGES, NUDGE_BY_ID, levelWord, norm, type Nudge } from '../metrics'
import { DEFAULT_WEIGHTS, NUDGE_MIN, findSimilar, parseWeights, reasonsFor, weightsToParam } from '../similarity'
import { Bar, LoveButton, MovieCard, Poster, SaveButton } from '../components/Cards'
import Picker from '../components/Picker'

const PAGE = 24
const DECADES = [2020, 2010, 2000, 1990, 1980, 1970]

// Telegram has no reliable "search for X" link, so copy the title and just open the app;
// the user pastes it into Telegram's search bar.
async function openTelegramWithTitle(title: string): Promise<boolean> {
  let copied = false
  try { await navigator.clipboard.writeText(title); copied = true } catch { /* shown in the note instead */ }
  window.location.href = 'tg://'
  return copied
}

export default function MoviePage() {
  const { id } = useParams()
  const { byId, movies } = useData()
  const stats = useStats()
  const nav = useNavigate()
  const [sp, setSp] = useSearchParams()
  const [pick, setPick] = useState(false)
  const [adv, setAdv] = useState(false)
  const [tg, setTg] = useState<'copied' | 'manual' | null>(null)
  const { lang, t, num, title, director } = useLang()
  const movie = id ? byId.get(id) : undefined

  const maxV = Number(sp.get('vi')) || 5
  const maxS = Number(sp.get('se')) || 5
  const dec = Number(sp.get('dec')) || 0
  const shown = Number(sp.get('n')) || PAGE
  const weights = useMemo(() => parseWeights(sp.get('w')), [sp])
  const allZero = weights.every((x) => x <= 0)
  const nudges = useMemo(() => (sp.get('but') || '').split(',').map((x) => NUDGE_BY_ID[x]).filter(Boolean), [sp])

  const results = useMemo(() => {
    if (!movie) return []
    const vi = METRICS.findIndex((m) => m.key === 'violence_level')
    const se = METRICS.findIndex((m) => m.key === 'sexuality_level')
    return findSimilar(movie, movies, stats, weights, nudges).filter(
      (r) => r.movie.values[vi] <= maxV && r.movie.values[se] <= maxS && (!dec || (r.movie.year >= dec && r.movie.year < dec + 10)),
    )
  }, [movie, movies, stats, weights, nudges, maxV, maxS, dec])

  if (!movie) return <div className="notice big"><h2>{t('הסרט לא נמצא', 'Movie not found')}</h2><Link className="btn primary" to="/">{t('חזרה לדף הבית', 'Back to home')}</Link></div>

  const set = (k: string, v: string | null) => {
    const n = new URLSearchParams(sp)
    if (v) n.set(k, v); else n.delete(k)
    if (k !== 'n') n.delete('n')
    setSp(n, { replace: true })
  }
  const setW = (i: number, v: number) => {
    const w = [...weights]; w[i] = v
    set('w', weightsToParam(w))
  }
  const filtersOn = maxV < 5 || maxS < 5 || dec > 0 || !!sp.get('w') || nudges.length > 0
  // לחיצה מוסיפה או מסירה. הכיוון ההפוך של אותה תכונה יורד
  const toggleNudge = (n: Nudge) => {
    const on = nudges.includes(n)
    const next = on ? nudges.filter((x) => x !== n) : [...nudges.filter((x) => x.key !== n.key), n]
    set('but', next.length ? next.map((x) => x.id).join(',') : null)
  }
  // אי אפשר "קליל יותר" לסרט שכבר כמעט הכי קליל: צריך כמה סרטים בכיוון הזה
  const canNudge = (n: Nudge) => {
    const i = METRICS.findIndex((m) => m.key === n.key)
    const zb = stats.z.get(movie.id)![i]
    let count = 0
    for (const z of stats.z.values()) if ((z[i] - zb) * n.dir >= NUDGE_MIN && ++count >= 6) return true
    return false
  }
  const butText = nudges.map((n) => n.label[lang]).join(lang === 'he' ? ' ו' : ' and ')

  // התכונות הבולטות ביותר של הסרט
  const top = METRICS.map((m, i) => ({ m, v: movie.values[i], e: Math.abs(norm(m, movie.values[i]) - 0.5) }))
    .sort((a, b) => b.e - a.e).slice(0, 4)
  const name = title(movie)
  // השם בשפה השנייה, מתחת לכותרת
  const otherTitle = lang === 'he' ? movie.titleEn : movie.title !== name ? movie.title : ''
  const synopsis = lang === 'he' ? movie.descriptionHe || movie.description : movie.description
  const synopsisIsHe = lang === 'he' && !!movie.descriptionHe
  const warning = movie.warning === 'links'
    ? t('חלק מהקישורים החיצוניים לסרט הזה לא אמינים במאגר ולכן לא מוצגים.', "Some external links for this movie are unreliable in the database, so they aren't shown.")
    : movie.warning === 'mixed'
      ? t('במאגר המקורי חלק מפרטי הסרט הזה שייכים לסרט אחר, ולכן הוסתרו התקציר והקישורים. ציוני האופי והפוסטר נראים תקינים.', 'In the original database some details of this movie belong to another movie, so the synopsis and links are hidden. The scores and poster look correct.')
      : null

  return (
    <>
      <section className="movie-head">
        <Poster movie={movie} className="big" />
        <div className="movie-info">
          <h1>{name}</h1>
          {lang === 'he'
            ? <p className="en">{otherTitle} {movie.year ? `· ${movie.year}` : ''}</p>
            : <p className="muted">{movie.year || ''}{movie.year && otherTitle ? ' · ' : ''}{otherTitle && <bdi lang="he">{otherTitle}</bdi>}</p>}
          <p>{t('במאי', 'Director')}: <Link to={`/director/${movie.directorKey}`}>{director(movie)}</Link></p>
          <p className="feel"><b>{t('איך הסרט מרגיש', 'How it feels')}:</b> {top.map((x) => levelWord(x.m, x.v, lang)).join(' · ')}</p>
          <div className="actions">
            <SaveButton id={movie.id} label />
            <LoveButton id={movie.id} label />
            <button className="btn" onClick={() => setPick((p) => !p)} aria-expanded={pick}>{t('השוואה לסרט אחר', 'Compare with another movie')}</button>
            <button className="btn ghost" onClick={() => { navigator.clipboard?.writeText(window.location.href) }}>{t('העתקת קישור', 'Copy link')}</button>
            <button className="btn tg" onClick={async () => setTg((await openTelegramWithTitle(name)) ? 'copied' : 'manual')}>{t('פתח בטלגרם', 'Open in Telegram')}</button>
          </div>
          {tg && (
            <p className="notice small" role="status">
              {tg === 'copied'
                ? (lang === 'he' ? <>השם <b>{name}</b> הועתק. הדביקו אותו בשורת החיפוש בטלגרם.</> : <>Copied <b>{name}</b>. Paste it into Telegram's search bar.</>)
                : (lang === 'he' ? <>העתיקו את השם <b className="sel">{name}</b> והדביקו אותו בשורת החיפוש בטלגרם.</> : <>Copy <b className="sel">{name}</b> and paste it into Telegram's search bar.</>)}
              {' '}{t('טלגרם לא נפתח?', "Telegram didn't open?")} <a href="https://web.telegram.org/" target="_blank" rel="noreferrer">{t('טלגרם ווב', 'Telegram Web')}</a>
            </p>
          )}
          {pick && (
            <div className="panel">
              <Picker placeholder={t('לאיזה סרט להשוות?', 'Which movie to compare with?')} exclude={movie.id} autoFocus onPick={(m) => nav(`/compare/${movie.id}/${m.id}`)} />
            </div>
          )}
          {warning && <p className="notice small">⚠️ {warning}</p>}
          {synopsis && <p className="desc" dir={synopsisIsHe ? 'rtl' : 'ltr'}>{synopsis}</p>}
          {synopsis && lang === 'he' && !synopsisIsHe && <p className="muted small">אין עדיין תקציר בעברית, מוצג התקציר באנגלית.</p>}
          <p className="links">
            {movie.wikiUrl && <a href={movie.wikiUrl} target="_blank" rel="noreferrer">{t('ויקיפדיה', 'Wikipedia')}</a>}
            {movie.imdbId && <a href={`https://www.imdb.com/title/${movie.imdbId}/`} target="_blank" rel="noreferrer">IMDb</a>}
            {movie.imdbId && <a href={`https://letterboxd.com/imdb/${movie.imdbId}/`} target="_blank" rel="noreferrer">Letterboxd</a>}
          </p>
        </div>
      </section>

      <section className="panel">
        <h2>{t('הפרופיל של הסרט', 'Movie profile')}</h2>
        <div className="profile">
          {GROUPS.map((g, gi) => (
            <div key={gi}>
              <h3>{g[lang]}</h3>
              {METRICS.map((m, i) => m.group === gi && (
                <div key={m.key} className="metric">
                  <div className="metric-top"><span>{m.name[lang]}</span><b>{levelWord(m, movie.values[i], lang)}</b></div>
                  <Bar value={movie.values[i]} max={m.max} />
                  <div className="ends"><span>{m.low[lang]}</span><span>{m.high[lang]}</span></div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>
          {nudges.length
            ? t(`סרטים כמו "${name}", אבל ${butText}`, `Like "${name}", but ${butText}`)
            : t(`סרטים שמרגישים כמו "${name}"`, `Movies that feel like "${name}"`)}
        </h2>
        <div className="but-row" role="group" aria-label={t('כמו הסרט הזה, אבל...', 'Like this, but...')}>
          <span className="but-lead">{t('כמו הסרט הזה, אבל…', 'Like this, but…')}</span>
          {NUDGES.map((n) => {
            const on = nudges.includes(n)
            const ok = on || canNudge(n)
            return (
              <button
                key={n.id} type="button" className={`chip but ${on ? 'on' : ''}`} aria-pressed={on} disabled={!ok}
                title={ok ? undefined : t('הסרט כבר בקצה של התכונה הזו', 'This movie is already at the end of this scale')}
                onClick={() => toggleNudge(n)}
              >
                {n.label[lang]}
              </button>
            )
          })}
        </div>
        <div className="filters panel">
          <label>{t('אלימות', 'Violence')}
            <select value={maxV} onChange={(e) => set('vi', e.target.value === '5' ? null : e.target.value)}>
              <option value="5">{t('בלי הגבלה', 'No limit')}</option><option value="3">{t('בלי אלימות חזקה', 'No strong violence')}</option><option value="2">{t('כמעט בלי אלימות', 'Almost no violence')}</option>
            </select>
          </label>
          <label>{t('תוכן מיני', 'Sexual content')}
            <select value={maxS} onChange={(e) => set('se', e.target.value === '5' ? null : e.target.value)}>
              <option value="5">{t('בלי הגבלה', 'No limit')}</option><option value="3">{t('בלי תוכן מפורש', 'Nothing explicit')}</option><option value="2">{t('כמעט בלי תוכן מיני', 'Almost no sexual content')}</option>
            </select>
          </label>
          <label>{t('עשור', 'Decade')}
            <select value={dec || ''} onChange={(e) => set('dec', e.target.value || null)}>
              <option value="">{t('הכל', 'All')}</option>
              {DECADES.map((d) => <option key={d} value={d}>{t(`שנות ה-${String(d).slice(2)}`, `${d}s`)}</option>)}
            </select>
          </label>
          <button className="btn ghost" onClick={() => setAdv((a) => !a)} aria-expanded={adv}>{t('אפשרויות מתקדמות', 'Advanced options')}</button>
          {filtersOn && <button className="btn ghost" onClick={() => setSp({}, { replace: true })}>{t('ניקוי הכל', 'Clear all')}</button>}
        </div>
        {adv && (
          <div className="panel adv">
            <p>{t('כמה כל תכונה משפיעה על ההתאמה. 0 אומר להתעלם ממנה, 2.5 אומר שהיא חשובה מאוד.', 'How much each trait affects the match. 0 ignores it, 2.5 makes it very important.')}</p>
            <div className="adv-grid">
              {METRICS.map((m, i) => (
                <label key={m.key} className="slider">
                  <span>{m.name[lang]} <b>{weights[i]}</b></span>
                  <input type="range" min={0} max={2.5} step={0.1} value={weights[i]} onChange={(e) => setW(i, Number(e.target.value))} />
                </label>
              ))}
            </div>
            <button className="btn ghost" onClick={() => set('w', null)}>{t('איפוס לברירת המחדל', 'Reset to defaults')}</button>
            {allZero && <p className="notice small">{t('כל התכונות על 0, לכן משתמשים בהגדרות הרגילות.', 'All traits are at 0, so the default settings are used.')}</p>}
          </div>
        )}
        <p className="muted">{num(results.filter((r) => r.score >= 75).length)} {t(
          'סרטים דומים באמת · הכל ממוין מהדומה ביותר. "% דומה" הוא ציון של השיטה, לא סיכוי שתאהבו ולא דירוג איכות.',
          "truly similar movies · sorted from most similar. \"% match\" is the method's score, not the chance you'll like it or a quality rating.",
        )}</p>
        {results.length === 0 && <p className="notice">{t('אין סרטים שעונים על הסינון. נסו להסיר חלק ממנו.', 'No movies match these filters. Try removing some.')}</p>}
        <div className="grid">
          {results.slice(0, shown).map((r) => (
            <MovieCard key={r.movie.id} movie={r.movie} score={r.score} reasons={reasonsFor(movie, r.movie, weights === DEFAULT_WEIGHTS ? DEFAULT_WEIGHTS : weights, lang)} compareFrom={movie.id} />
          ))}
        </div>
        {shown < results.length && <div className="center"><button className="btn" onClick={() => set('n', String(shown + PAGE))}>{t('הצגת עוד', 'Show more')}</button></div>}
      </section>
    </>
  )
}
