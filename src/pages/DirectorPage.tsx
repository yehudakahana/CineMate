import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useData } from '../data'
import { useStats } from '../hooks'
import { METRICS, levelWord, norm } from '../metrics'
import { Bar, MovieCard } from '../components/Cards'

export default function DirectorPage() {
  const { key } = useParams()
  const { directorByKey } = useData()
  const stats = useStats()
  const [imgBad, setImgBad] = useState(false)
  const d = key ? directorByKey.get(key) : undefined
  if (!d) return <div className="notice big"><h2>הבמאי לא נמצא</h2><Link className="btn primary" to="/">חזרה לדף הבית</Link></div>

  const n = d.movies.length
  const avg = METRICS.map((_, i) => d.movies.reduce((s, m) => s + m.values[i], 0) / n)
  const dev = METRICS.map((m, i) => ({ m, i, v: avg[i], diff: (avg[i] - stats.mean[i]) / stats.std[i] }))
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)).slice(0, 4)

  return (
    <>
      <section className="dir-head">
        {d.image && !imgBad
          ? <img className="avatar" src={d.image} alt={`תמונה של ${d.name}`} onError={() => setImgBad(true)} />
          : <div className="avatar fb" aria-hidden="true">{d.name.slice(0, 1)}</div>}
        <div>
          <h1>{d.name}</h1>
          {d.nameEn && d.nameEn !== d.name && <p className="en">{d.nameEn}</p>}
          <p className="muted">{n} {n === 1 ? 'סרט' : 'סרטים'} במאגר. הפרופיל מבוסס רק על הסרטים שנמצאים כאן, לא על כל הקריירה.</p>
          {d.wikiUrl && <a href={d.wikiUrl} target="_blank" rel="noreferrer">ויקיפדיה</a>}
        </div>
      </section>
      <section className="panel">
        <h2>מה מיוחד בסגנון שלו</h2>
        <p className="muted">התכונות שבהן הסרטים שלו הכי שונים מהסרט הממוצע במאגר.</p>
        <div className="profile">
          {dev.map(({ m, i, v, diff }) => (
            <div key={m.key} className="metric">
              <div className="metric-top"><span>{m.name}</span><b>{diff > 0 ? `יותר: ${m.high}` : `יותר: ${m.low}`}</b></div>
              <Bar value={v} max={m.max} />
              <div className="ends"><span>{m.low}</span><span>{m.high}</span></div>
              <small className="muted">בממוצע: {levelWord(m, Math.round(v))}. הממוצע הכללי: {levelWord(m, Math.round(stats.mean[i]))}.{norm(m, v) < 0 ? '' : ''}</small>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2>הסרטים שלו במאגר</h2>
        <div className="grid">{d.movies.map((m) => <MovieCard key={m.id} movie={m} />)}</div>
      </section>
    </>
  )
}
