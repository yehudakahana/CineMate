import { useState } from 'react'
import { Link } from 'react-router-dom'
import { type Movie, useSaved } from '../data'

export function Poster({ movie, className = '' }: { movie: Movie; className?: string }) {
  const [bad, setBad] = useState(false)
  if (!movie.poster || bad) {
    return (
      <div className={`poster fallback ${className}`} role="img" aria-label={`אין פוסטר ל${movie.title}`}>
        <span>{movie.title}</span>
        <small>{movie.year || ''}</small>
      </div>
    )
  }
  return <img className={`poster ${className}`} src={movie.poster} alt={`פוסטר: ${movie.title}`} loading="lazy" onError={() => setBad(true)} />
}

export function SaveButton({ id, label = false }: { id: string; label?: boolean }) {
  const { has, toggle } = useSaved()
  const on = has(id)
  return (
    <button
      type="button" className={`save ${on ? 'on' : ''} ${label ? 'with-label' : ''}`}
      aria-pressed={on} aria-label={on ? 'הסרה מהשמורים' : 'שמירה'}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(id) }}
    >
      <span aria-hidden="true">{on ? '♥' : '♡'}</span>{label && <span>{on ? 'שמור' : 'שמירה'}</span>}
    </button>
  )
}

export function MovieCard({ movie, score, reasons, compareFrom }: { movie: Movie; score?: number; reasons?: string[]; compareFrom?: string }) {
  return (
    <article className="card">
      <Link to={`/movie/${movie.id}`} className="card-link" aria-label={`${movie.title}, ${movie.year}`}>
        <div className="poster-wrap">
          <Poster movie={movie} />
          {score !== undefined && <span className="score" title="ציון הדמיון לפי השיטה, לא דירוג איכות">{Math.round(score)}% דומה</span>}
        </div>
        <h3>{movie.title}</h3>
        <p className="meta">{movie.year} · {movie.director}</p>
      </Link>
      <SaveButton id={movie.id} />
      {reasons && reasons.length > 0 && (
        <ul className="reasons">{reasons.map((r) => <li key={r}>{r}</li>)}</ul>
      )}
      {compareFrom && (
        <Link className="btn small ghost cmp" to={`/compare/${compareFrom}/${movie.id}`}>השוואה לסרט שבחרתם</Link>
      )}
    </article>
  )
}

export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card"><div className="sk sk-poster" /><div className="sk sk-line" /><div className="sk sk-line short" /></div>
      ))}
    </div>
  )
}

export function Bar({ value, max, color = 'var(--gold)' }: { value: number; max: number; color?: string }) {
  const p = Math.round(((value - 1) / (max - 1)) * 100)
  return <div className="bar"><i style={{ width: `${Math.max(4, p)}%`, background: color }} /></div>
}
