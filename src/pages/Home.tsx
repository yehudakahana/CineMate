import { useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useData, useLoved, useSaved } from '../data'
import { useLang } from '../i18n'
import { MovieCard } from '../components/Cards'
import Picker from '../components/Picker'
import ForYou from '../components/ForYou'

const PAGE = 48
const DECADES = [2020, 2010, 2000, 1990, 1980, 1970]

export default function Home() {
  const { movies, byId } = useData()
  const { ids } = useSaved()
  const loved = useLoved()
  // ההמלצות מבוססות על "אהבתי". מי שעוד לא סימן כלום מקבל המלצות לפי השמורים
  const source = loved.ids.length ? 'loved' : 'saved'
  const liked = useMemo(() => (source === 'loved' ? loved.ids : ids).map((i) => byId.get(i)!).filter(Boolean), [source, loved.ids, ids, byId])
  const exclude = useMemo(() => new Set([...ids, ...loved.ids]), [ids, loved.ids])
  const { lang, t, num, title } = useLang()
  const decLabel = (d: number) => t(`שנות ה-${String(d).slice(2)}`, `${d}s`)
  const nav = useNavigate()
  const [sp, setSp] = useSearchParams()
  const dec = Number(sp.get('dec')) || 0
  const sort = sp.get('sort') || 'new'
  const shown = Number(sp.get('n')) || PAGE

  const list = useMemo(() => {
    let l = dec ? movies.filter((m) => m.year >= dec && m.year < dec + 10) : movies.slice()
    if (sort === 'old') l.sort((a, b) => a.year - b.year)
    else if (sort === 'name') l.sort((a, b) => title(a).localeCompare(title(b), lang))
    else l.sort((a, b) => b.year - a.year)
    return l
  }, [movies, dec, sort, lang, title])

  const set = (k: string, v: string | null) => {
    const n = new URLSearchParams(sp)
    if (v) n.set(k, v); else n.delete(k)
    if (k !== 'n') n.delete('n')
    setSp(n, { replace: true })
  }

  return (
    <>
      <section className="hero">
        <h1>{t('מצאו את הסרט הבא שלכם', 'Find your next movie')}</h1>
        <p className="lead">{t(
          `לא לפי ז'אנר, אלא לפי התחושה של הסרט. ${num(movies.length)} סרטים, כל אחד עם הסבר למה הוא דומה לאחרים.`,
          `Not by genre, but by how a movie feels. ${num(movies.length)} movies, each with an explanation of why it's similar to others.`,
        )}</p>
        <div className="two">
          <div className="panel big-choice">
            <h2>{t('אהבתם סרט? נמצא דומים לו', 'Loved a movie? Find similar ones')}</h2>
            <p>{t('הקלידו שם של סרט שאהבתם, בעברית או באנגלית.', 'Type the name of a movie you loved, in English or Hebrew.')}</p>
            <Picker placeholder={t('למשל: הסנדק, או Parasite', 'e.g. The Godfather or Parasite')} onPick={(m) => nav(`/movie/${m.id}`)} />
          </div>
          <Link to="/find" className="panel big-choice link-panel">
            <h2>{t('איזה סרט מתאים לכם עכשיו?', 'What are you in the mood for?')}</h2>
            <p>{t('בחרו מצב רוח, למשל "קליל וחם" או "משהו שיישאיר אותי חושב", ונציע סרטים.', `Pick a mood, like "light and warm" or "something to think about", and we'll suggest movies.`)}</p>
            <span className="btn primary">{t('בואו נבחר מצב רוח', 'Pick a mood')}</span>
          </Link>
        </div>
      </section>

      {liked.length > 0 && <ForYou liked={liked} source={source} exclude={exclude} compact />}

      <section>
        <div className="row-head">
          <h2>{t('כל הסרטים', 'All movies')}</h2>
          <div className="controls">
            <label>{t('עשור', 'Decade')}
              <select value={dec || ''} onChange={(e) => set('dec', e.target.value || null)}>
                <option value="">{t('הכל', 'All')}</option>
                {DECADES.map((d) => <option key={d} value={d}>{decLabel(d)}</option>)}
              </select>
            </label>
            <label>{t('סדר', 'Sort')}
              <select value={sort} onChange={(e) => set('sort', e.target.value === 'new' ? null : e.target.value)}>
                <option value="new">{t('מהחדש לישן', 'Newest first')}</option>
                <option value="old">{t('מהישן לחדש', 'Oldest first')}</option>
                <option value="name">{t('לפי שם', 'By name')}</option>
              </select>
            </label>
          </div>
        </div>
        <p className="muted">{num(list.length)} {t('סרטים', 'movies')}</p>
        <div className="grid">{list.slice(0, shown).map((m) => <MovieCard key={m.id} movie={m} />)}</div>
        {shown < list.length && (
          <div className="center"><button className="btn" onClick={() => set('n', String(shown + PAGE))}>{t('הצגת עוד סרטים', 'Show more movies')}</button></div>
        )}
      </section>
    </>
  )
}
