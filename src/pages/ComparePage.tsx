import { Link, useParams } from 'react-router-dom'
import { useData } from '../data'
import { METRICS, GROUPS, levelWord, norm } from '../metrics'
import { Bar, Poster } from '../components/Cards'

export default function ComparePage() {
  const { a, b } = useParams()
  const { byId } = useData()
  const A = a ? byId.get(a) : undefined
  const B = b ? byId.get(b) : undefined
  if (!A || !B) return <div className="notice big"><h2>אחד הסרטים לא נמצא</h2><Link className="btn primary" to="/">חזרה לדף הבית</Link></div>

  const rows = METRICS.map((m, i) => {
    const d = Math.abs(norm(m, A.values[i]) - norm(m, B.values[i]))
    return { m, i, d, kind: d < 0.12 ? 'same' : d < 0.34 ? 'near' : 'far' }
  })
  const alike = rows.filter((r) => r.kind !== 'far').length
  const label = { same: 'כמעט זהים', near: 'קרובים', far: 'שונים' }

  return (
    <>
      <p><Link to={`/movie/${A.id}`}>← חזרה ל"{A.title}"</Link></p>
      <section className="cmp-head">
        <div><Link to={`/movie/${A.id}`}><Poster movie={A} /></Link><h2>{A.title}</h2><p className="muted">{A.year} · {A.director}</p></div>
        <div className="cmp-mid"><span>דומים ב</span><b>{alike} מתוך 12</b><span>תכונות</span></div>
        <div><Link to={`/movie/${B.id}`}><Poster movie={B} /></Link><h2>{B.title}</h2><p className="muted">{B.year} · {B.director}</p></div>
      </section>
      <p className="center"><Link className="btn" to={`/compare/${B.id}/${A.id}`}>החלפת צדדים</Link></p>
      {GROUPS.map((g) => (
        <section key={g} className="panel">
          <h3>{g}</h3>
          {rows.filter((r) => r.m.group === g).map((r) => (
            <div key={r.m.key} className={`cmp-row ${r.kind}`}>
              <div className="cmp-name"><b>{r.m.name}</b><span className={`tag ${r.kind}`}>{label[r.kind as keyof typeof label]}</span></div>
              <div className="cmp-bars">
                <div><small>{A.title}: {levelWord(r.m, A.values[r.i])}</small><Bar value={A.values[r.i]} max={r.m.max} color="var(--gold)" /></div>
                <div><small>{B.title}: {levelWord(r.m, B.values[r.i])}</small><Bar value={B.values[r.i]} max={r.m.max} color="var(--teal)" /></div>
              </div>
              <div className="ends"><span>{r.m.low}</span><span>{r.m.high}</span></div>
            </div>
          ))}
        </section>
      ))}
    </>
  )
}
