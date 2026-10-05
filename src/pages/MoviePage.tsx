import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useData } from '../data'
import { useStats } from '../hooks'
import { METRICS, GROUPS, levelWord, norm } from '../metrics'
import { DEFAULT_WEIGHTS, findSimilar, parseWeights, reasonsFor, weightsToParam } from '../similarity'
import { Bar, MovieCard, Poster, SaveButton } from '../components/Cards'
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
  const movie = id ? byId.get(id) : undefined

  const maxV = Number(sp.get('vi')) || 5
  const maxS = Number(sp.get('se')) || 5
  const dec = Number(sp.get('dec')) || 0
  const shown = Number(sp.get('n')) || PAGE
  const weights = useMemo(() => parseWeights(sp.get('w')), [sp])
  const allZero = weights.every((x) => x <= 0)

  const results = useMemo(() => {
    if (!movie) return []
    const vi = METRICS.findIndex((m) => m.key === 'violence_level')
    const se = METRICS.findIndex((m) => m.key === 'sexuality_level')
    return findSimilar(movie, movies, stats, weights).filter(
      (r) => r.movie.values[vi] <= maxV && r.movie.values[se] <= maxS && (!dec || (r.movie.year >= dec && r.movie.year < dec + 10)),
    )
  }, [movie, movies, stats, weights, maxV, maxS, dec])

  if (!movie) return <div className="notice big"><h2>הסרט לא נמצא</h2><Link className="btn primary" to="/">חזרה לדף הבית</Link></div>

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
  const filtersOn = maxV < 5 || maxS < 5 || dec > 0 || !!sp.get('w')

  // התכונות הבולטות ביותר של הסרט
  const top = METRICS.map((m, i) => ({ m, v: movie.values[i], e: Math.abs(norm(m, movie.values[i]) - 0.5) }))
    .sort((a, b) => b.e - a.e).slice(0, 4)

  return (
    <>
      <section className="movie-head">
        <Poster movie={movie} className="big" />
        <div className="movie-info">
          <h1>{movie.title}</h1>
          <p className="en">{movie.titleEn} {movie.year ? `· ${movie.year}` : ''}</p>
          <p>במאי: <Link to={`/director/${movie.directorKey}`}>{movie.director}</Link></p>
          <p className="feel"><b>איך הסרט מרגיש:</b> {top.map((t) => levelWord(t.m, t.v)).join(' · ')}</p>
          <div className="actions">
            <SaveButton id={movie.id} label />
            <button className="btn" onClick={() => setPick((p) => !p)} aria-expanded={pick}>השוואה לסרט אחר</button>
            <button className="btn ghost" onClick={() => { navigator.clipboard?.writeText(window.location.href) }}>העתקת קישור</button>
            <button className="btn tg" onClick={async () => setTg((await openTelegramWithTitle(movie.title)) ? 'copied' : 'manual')}>פתח בטלגרם</button>
          </div>
          {tg && (
            <p className="notice small" role="status">
              {tg === 'copied' ? <>השם <b>{movie.title}</b> הועתק. הדביקו אותו בשורת החיפוש בטלגרם.</> : <>העתיקו את השם <b className="sel">{movie.title}</b> והדביקו אותו בשורת החיפוש בטלגרם.</>}
              {' '}טלגרם לא נפתח? <a href="https://web.telegram.org/" target="_blank" rel="noreferrer">טלגרם ווב</a>
            </p>
          )}
          {pick && (
            <div className="panel">
              <Picker placeholder="לאיזה סרט להשוות?" exclude={movie.id} autoFocus onPick={(m) => nav(`/compare/${movie.id}/${m.id}`)} />
            </div>
          )}
          {movie.warning && <p className="notice small">⚠️ {movie.warning}</p>}
          {movie.description && <p className="desc" dir="ltr">{movie.description}</p>}
          {movie.description && <p className="muted small">התקציר באנגלית, כפי שהוא במאגר.</p>}
          <p className="links">
            {movie.wikiUrl && <a href={movie.wikiUrl} target="_blank" rel="noreferrer">ויקיפדיה</a>}
            {movie.imdbId && <a href={`https://www.imdb.com/title/${movie.imdbId}/`} target="_blank" rel="noreferrer">IMDb</a>}
            {movie.imdbId && <a href={`https://letterboxd.com/imdb/${movie.imdbId}/`} target="_blank" rel="noreferrer">Letterboxd</a>}
          </p>
        </div>
      </section>

      <section className="panel">
        <h2>הפרופיל של הסרט</h2>
        <div className="profile">
          {GROUPS.map((g) => (
            <div key={g}>
              <h3>{g}</h3>
              {METRICS.map((m, i) => m.group === g && (
                <div key={m.key} className="metric">
                  <div className="metric-top"><span>{m.name}</span><b>{levelWord(m, movie.values[i])}</b></div>
                  <Bar value={movie.values[i]} max={m.max} />
                  <div className="ends"><span>{m.low}</span><span>{m.high}</span></div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>סרטים שמרגישים כמו "{movie.title}"</h2>
        <div className="filters panel">
          <label>אלימות
            <select value={maxV} onChange={(e) => set('vi', e.target.value === '5' ? null : e.target.value)}>
              <option value="5">בלי הגבלה</option><option value="3">בלי אלימות חזקה</option><option value="2">כמעט בלי אלימות</option>
            </select>
          </label>
          <label>תוכן מיני
            <select value={maxS} onChange={(e) => set('se', e.target.value === '5' ? null : e.target.value)}>
              <option value="5">בלי הגבלה</option><option value="3">בלי תוכן מפורש</option><option value="2">כמעט בלי תוכן מיני</option>
            </select>
          </label>
          <label>עשור
            <select value={dec || ''} onChange={(e) => set('dec', e.target.value || null)}>
              <option value="">הכל</option>
              {DECADES.map((d) => <option key={d} value={d}>שנות ה-{String(d).slice(2)}</option>)}
            </select>
          </label>
          <button className="btn ghost" onClick={() => setAdv((a) => !a)} aria-expanded={adv}>אפשרויות מתקדמות</button>
          {filtersOn && <button className="btn ghost" onClick={() => setSp({}, { replace: true })}>ניקוי הכל</button>}
        </div>
        {adv && (
          <div className="panel adv">
            <p>כמה כל תכונה משפיעה על ההתאמה. 0 אומר להתעלם ממנה, 2.5 אומר שהיא חשובה מאוד.</p>
            <div className="adv-grid">
              {METRICS.map((m, i) => (
                <label key={m.key} className="slider">
                  <span>{m.name} <b>{weights[i]}</b></span>
                  <input type="range" min={0} max={2.5} step={0.1} value={weights[i]} onChange={(e) => setW(i, Number(e.target.value))} />
                </label>
              ))}
            </div>
            <button className="btn ghost" onClick={() => set('w', null)}>איפוס לברירת המחדל</button>
            {allZero && <p className="notice small">כל התכונות על 0, לכן משתמשים בהגדרות הרגילות.</p>}
          </div>
        )}
        <p className="muted">{results.filter((r) => r.score >= 75).length.toLocaleString('he')} סרטים דומים באמת · הכל ממוין מהדומה ביותר. "% דומה" הוא ציון של השיטה, לא סיכוי שתאהבו ולא דירוג איכות.</p>
        {results.length === 0 && <p className="notice">אין סרטים שעונים על הסינון. נסו להסיר חלק ממנו.</p>}
        <div className="grid">
          {results.slice(0, shown).map((r) => (
            <MovieCard key={r.movie.id} movie={r.movie} score={r.score} reasons={reasonsFor(movie, r.movie, weights === DEFAULT_WEIGHTS ? DEFAULT_WEIGHTS : weights)} compareFrom={movie.id} />
          ))}
        </div>
        {shown < results.length && <div className="center"><button className="btn" onClick={() => set('n', String(shown + PAGE))}>הצגת עוד</button></div>}
      </section>
    </>
  )
}
