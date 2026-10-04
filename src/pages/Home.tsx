import { useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useData } from '../data'
import { MovieCard } from '../components/Cards'
import Picker from '../components/Picker'

const PAGE = 48
const DECADES = [2020, 2010, 2000, 1990, 1980, 1970]
const decLabel = (d: number) => `שנות ה-${String(d).slice(2)}`

export default function Home() {
  const { movies } = useData()
  const nav = useNavigate()
  const [sp, setSp] = useSearchParams()
  const dec = Number(sp.get('dec')) || 0
  const sort = sp.get('sort') || 'new'
  const shown = Number(sp.get('n')) || PAGE

  const list = useMemo(() => {
    let l = dec ? movies.filter((m) => m.year >= dec && m.year < dec + 10) : movies.slice()
    if (sort === 'old') l.sort((a, b) => a.year - b.year)
    else if (sort === 'name') l.sort((a, b) => a.title.localeCompare(b.title, 'he'))
    else l.sort((a, b) => b.year - a.year)
    return l
  }, [movies, dec, sort])

  const set = (k: string, v: string | null) => {
    const n = new URLSearchParams(sp)
    if (v) n.set(k, v); else n.delete(k)
    if (k !== 'n') n.delete('n')
    setSp(n, { replace: true })
  }

  return (
    <>
      <section className="hero">
        <h1>מצאו את הסרט הבא שלכם</h1>
        <p className="lead">לא לפי ז'אנר, אלא לפי התחושה של הסרט. {movies.length.toLocaleString('he')} סרטים, כל אחד עם הסבר למה הוא דומה לאחרים.</p>
        <div className="two">
          <div className="panel big-choice">
            <h2>אהבתם סרט? נמצא דומים לו</h2>
            <p>הקלידו שם של סרט שאהבתם, בעברית או באנגלית.</p>
            <Picker placeholder="למשל: הסנדק, או Parasite" onPick={(m) => nav(`/movie/${m.id}`)} />
          </div>
          <Link to="/find" className="panel big-choice link-panel">
            <h2>איזה סרט מתאים לכם עכשיו?</h2>
            <p>בחרו מצב רוח, למשל "קליל וחם" או "משהו שיישאיר אותי חושב", ונציע סרטים.</p>
            <span className="btn primary">בואו נבחר מצב רוח</span>
          </Link>
        </div>
      </section>

      <section>
        <div className="row-head">
          <h2>כל הסרטים</h2>
          <div className="controls">
            <label>עשור
              <select value={dec || ''} onChange={(e) => set('dec', e.target.value || null)}>
                <option value="">הכל</option>
                {DECADES.map((d) => <option key={d} value={d}>{decLabel(d)}</option>)}
              </select>
            </label>
            <label>סדר
              <select value={sort} onChange={(e) => set('sort', e.target.value === 'new' ? null : e.target.value)}>
                <option value="new">מהחדש לישן</option>
                <option value="old">מהישן לחדש</option>
                <option value="name">לפי שם</option>
              </select>
            </label>
          </div>
        </div>
        <p className="muted">{list.length.toLocaleString('he')} סרטים</p>
        <div className="grid">{list.slice(0, shown).map((m) => <MovieCard key={m.id} movie={m} />)}</div>
        {shown < list.length && (
          <div className="center"><button className="btn" onClick={() => set('n', String(shown + PAGE))}>הצגת עוד סרטים</button></div>
        )}
      </section>
    </>
  )
}
