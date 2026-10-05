import { useState } from 'react'
import { Link } from 'react-router-dom'
import { type Movie, useSaved } from '../data'
import { useLang } from '../i18n'

export function Poster({ movie, className = '' }: { movie: Movie; className?: string }) {
  const [bad, setBad] = useState(false)
  const { t, title } = useLang()
  if (!movie.poster || bad) {
    return (
      <div className={`poster fallback ${className}`} role="img" aria-label={t(`אין פוסטר ל${title(movie)}`, `No poster for ${title(movie)}`)}>
        <span>{title(movie)}</span>
        <small>{movie.year || ''}</small>
      </div>
    )
  }
  return <img className={`poster ${className}`} src={movie.poster} alt={t(`פוסטר: ${title(movie)}`, `Poster: ${title(movie)}`)} loading="lazy" onError={() => setBad(true)} />
}

export function SaveButton({ id, label = false }: { id: string; label?: boolean }) {
  const { has, toggle } = useSaved()
  const on = has(id)
  const { t } = useLang()
  return (
    <button
      type="button" className={`save ${on ? 'on' : ''} ${label ? 'with-label' : ''}`}
      aria-pressed={on} aria-label={on ? t('הסרה מהשמורים', 'Remove from saved') : t('שמירה', 'Save')}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(id) }}
    >
      <span aria-hidden="true">{on ? '♥' : '♡'}</span>{label && <span>{on ? t('שמור', 'Saved') : t('שמירה', 'Save')}</span>}
    </button>
  )
}

export function MovieCard({ movie, score, reasons, compareFrom }: { movie: Movie; score?: number; reasons?: string[]; compareFrom?: string }) {
  const { t, num, title, director } = useLang()
  return (
    <article className="card">
      <Link to={`/movie/${movie.id}`} className="card-link" aria-label={`${title(movie)}, ${movie.year}`}>
        <div className="poster-wrap">
          <Poster movie={movie} />
          {score !== undefined && <span className="score" title={t('ציון הדמיון לפי השיטה, לא דירוג איכות', 'Similarity score from the method, not a quality rating')}>{num(Math.round(score))}% {t('דומה', 'match')}</span>}
        </div>
        <h3>{title(movie)}</h3>
        <p className="meta">{movie.year} · {director(movie)}</p>
      </Link>
      <SaveButton id={movie.id} />
      {reasons && reasons.length > 0 && (
        <ul className="reasons">{reasons.map((r) => <li key={r}>{r}</li>)}</ul>
      )}
      {compareFrom && (
        <Link className="btn small ghost cmp" to={`/compare/${compareFrom}/${movie.id}`}>{t('השוואה לסרט שבחרתם', 'Compare with your movie')}</Link>
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
