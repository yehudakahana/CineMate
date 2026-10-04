import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { normalizeText, useData } from '../data'
import { MovieCard } from '../components/Cards'

export default function SearchPage() {
  const { movies, directors } = useData()
  const [sp] = useSearchParams()
  const q = sp.get('q') || ''
  const n = normalizeText(q)
  const mv = useMemo(() => (n ? movies.filter((m) => m.search.includes(n)) : []), [n, movies])
  const dr = useMemo(() => (n ? directors.filter((d) => normalizeText(`${d.name} ${d.nameEn}`).includes(n)) : []), [n, directors])
  return (
    <section>
      <h1>תוצאות חיפוש: "{q}"</h1>
      {dr.length > 0 && (
        <>
          <h2>במאים</h2>
          <div className="chips">{dr.map((d) => <Link key={d.key} className="chip" to={`/director/${d.key}`}>🎥 {d.name} <small>({d.movies.length})</small></Link>)}</div>
        </>
      )}
      <h2>סרטים ({mv.length})</h2>
      {mv.length === 0 && dr.length === 0 && <p className="notice">לא נמצאו תוצאות. נסו שם אחר או כתיבה באנגלית.</p>}
      <div className="grid">{mv.map((m) => <MovieCard key={m.id} movie={m} />)}</div>
    </section>
  )
}
