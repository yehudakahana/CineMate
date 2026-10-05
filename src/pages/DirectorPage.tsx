import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useData } from '../data'
import { useLang } from '../i18n'
import { useStats } from '../hooks'
import { METRICS, levelWord } from '../metrics'
import { Bar, MovieCard } from '../components/Cards'

export default function DirectorPage() {
  const { key } = useParams()
  const { directorByKey } = useData()
  const stats = useStats()
  const [imgBad, setImgBad] = useState(false)
  const { lang, t, num, directorName } = useLang()
  const d = key ? directorByKey.get(key) : undefined
  if (!d) return <div className="notice big"><h2>{t('הבמאי לא נמצא', 'Director not found')}</h2><Link className="btn primary" to="/">{t('חזרה לדף הבית', 'Back to home')}</Link></div>

  const n = d.movies.length
  const avg = METRICS.map((_, i) => d.movies.reduce((s, m) => s + m.values[i], 0) / n)
  const dev = METRICS.map((m, i) => ({ m, i, v: avg[i], diff: (avg[i] - stats.mean[i]) / stats.std[i] }))
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)).slice(0, 4)

  const name = directorName(d)
  const other = lang === 'he' ? d.nameEn : d.name
  return (
    <>
      <section className="dir-head">
        {d.image && !imgBad
          ? <img className="avatar" src={d.image} alt={t(`תמונה של ${name}`, `Photo of ${name}`)} onError={() => setImgBad(true)} />
          : <div className="avatar fb" aria-hidden="true">{name.slice(0, 1)}</div>}
        <div>
          <h1>{name}</h1>
          {other && other !== name && (lang === 'he' ? <p className="en">{other}</p> : <p className="muted"><bdi lang="he">{other}</bdi></p>)}
          <p className="muted">{t(
            `${num(n)} ${n === 1 ? 'סרט' : 'סרטים'} במאגר. הפרופיל מבוסס רק על הסרטים שנמצאים כאן, לא על כל הקריירה.`,
            `${num(n)} ${n === 1 ? 'movie' : 'movies'} in the database. The profile is based only on the movies here, not the whole career.`,
          )}</p>
          {d.wikiUrl && <a href={d.wikiUrl} target="_blank" rel="noreferrer">{t('ויקיפדיה', 'Wikipedia')}</a>}
        </div>
      </section>
      <section className="panel">
        <h2>{t('מה מיוחד בסגנון שלו', 'What makes the style distinct')}</h2>
        <p className="muted">{t('התכונות שבהן הסרטים שלו הכי שונים מהסרט הממוצע במאגר.', 'The traits where these movies differ most from the average movie in the database.')}</p>
        <div className="profile">
          {dev.map(({ m, i, v, diff }) => (
            <div key={m.key} className="metric">
              <div className="metric-top"><span>{m.name[lang]}</span><b>{t('יותר', 'More')}: {diff > 0 ? m.high[lang] : m.low[lang]}</b></div>
              <Bar value={v} max={m.max} />
              <div className="ends"><span>{m.low[lang]}</span><span>{m.high[lang]}</span></div>
              <small className="muted">{t('בממוצע', 'On average')}: {levelWord(m, Math.round(v), lang)}. {t('הממוצע הכללי', 'Overall average')}: {levelWord(m, Math.round(stats.mean[i]), lang)}.</small>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2>{t('הסרטים שלו במאגר', 'Movies in the database')}</h2>
        <div className="grid">{d.movies.map((m) => <MovieCard key={m.id} movie={m} />)}</div>
      </section>
    </>
  )
}
