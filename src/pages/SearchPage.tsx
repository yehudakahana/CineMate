import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { normalizeText, useData } from '../data'
import { useLang } from '../i18n'
import { MovieCard } from '../components/Cards'

export default function SearchPage() {
  const { movies, directors } = useData()
  const [sp] = useSearchParams()
  const { t, directorName } = useLang()
  const q = sp.get('q') || ''
  const n = normalizeText(q)
  const mv = useMemo(() => (n ? movies.filter((m) => m.search.includes(n)) : []), [n, movies])
  const dr = useMemo(() => (n ? directors.filter((d) => normalizeText(`${d.name} ${d.nameEn}`).includes(n)) : []), [n, directors])
  return (
    <section>
      <h1>{t('תוצאות חיפוש', 'Search results')}: "{q}"</h1>
      {dr.length > 0 && (
        <>
          <h2>{t('במאים', 'Directors')}</h2>
          <div className="chips">{dr.map((d) => <Link key={d.key} className="chip" to={`/director/${d.key}`}>🎥 {directorName(d)} <small>({d.movies.length})</small></Link>)}</div>
        </>
      )}
      <h2>{t('סרטים', 'Movies')} ({mv.length})</h2>
      {mv.length === 0 && dr.length === 0 && <p className="notice">{t('לא נמצאו תוצאות. נסו שם אחר או כתיבה באנגלית.', 'No results. Try another name or spelling it in Hebrew.')}</p>}
      <div className="grid">{mv.map((m) => <MovieCard key={m.id} movie={m} />)}</div>
    </section>
  )
}
