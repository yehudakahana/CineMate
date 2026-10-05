import { useMemo, useState } from 'react'
import { normalizeText, useData, type Movie } from '../data'
import { useLang } from '../i18n'

export default function Picker({ placeholder, onPick, exclude, autoFocus }: { placeholder: string; onPick: (m: Movie) => void; exclude?: string; autoFocus?: boolean }) {
  const { movies } = useData()
  const { t, title, director } = useLang()
  const [q, setQ] = useState('')
  const res = useMemo(() => {
    const n = normalizeText(q)
    if (!n) return []
    return movies.filter((m) => m.id !== exclude && m.search.includes(n)).slice(0, 6)
  }, [q, movies, exclude])
  return (
    <div className="picker">
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} aria-label={placeholder} autoFocus={autoFocus} />
      {res.length > 0 && (
        <ul className="picker-list">
          {res.map((m) => (
            <li key={m.id}><button type="button" onClick={() => onPick(m)}><b>{title(m)}</b><small>{m.year} · {director(m)}</small></button></li>
          ))}
        </ul>
      )}
      {q && res.length === 0 && <p className="muted">{t('לא נמצא סרט בשם הזה במאגר.', 'No movie by that name in the database.')}</p>}
    </div>
  )
}
