import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { normalizeText, useData, useSaved } from '../data'

export default function Header() {
  const nav = useNavigate()
  const { movies, directors, status } = useData()
  const { ids } = useSaved()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLFormElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const sugg = useMemo(() => {
    const n = normalizeText(q)
    if (n.length < 1 || status !== 'ready') return { m: [], d: [] }
    return {
      m: movies.filter((x) => x.search.includes(n)).slice(0, 6),
      d: directors.filter((x) => normalizeText(`${x.name} ${x.nameEn}`).includes(n)).slice(0, 3),
    }
  }, [q, movies, directors, status])

  const go = (e: React.FormEvent) => {
    e.preventDefault()
    if (q.trim()) { setOpen(false); nav(`/search?q=${encodeURIComponent(q.trim())}`) }
  }

  return (
    <header className="top">
      <div className="wrap top-in">
        <Link to="/" className="logo" aria-label="דף הבית">🎬 סרט לפי הטעם</Link>
        <form className="search" ref={box} onSubmit={go} role="search">
          <input
            type="search" value={q} placeholder="חיפוש סרט או במאי, בעברית או באנגלית"
            aria-label="חיפוש סרט או במאי"
            onChange={(e) => { setQ(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
          />
          {open && (sugg.m.length > 0 || sugg.d.length > 0) && (
            <div className="sugg">
              {sugg.m.map((m) => (
                <Link key={m.id} to={`/movie/${m.id}`} onClick={() => { setOpen(false); setQ('') }}>
                  <span>{m.title}</span><small>{m.year}</small>
                </Link>
              ))}
              {sugg.d.map((d) => (
                <Link key={d.key} to={`/director/${d.key}`} onClick={() => { setOpen(false); setQ('') }}>
                  <span>🎥 {d.name}</span><small>במאי</small>
                </Link>
              ))}
              <button type="submit" className="sugg-all">לכל התוצאות</button>
            </div>
          )}
        </form>
        <nav className="nav" aria-label="ניווט ראשי">
          <NavLink to="/" end><span className="ni" aria-hidden="true">🧭</span><span>גלו</span></NavLink>
          <NavLink to="/find"><span className="ni" aria-hidden="true">✨</span><span>מה מתאים לי</span></NavLink>
          <NavLink to="/saved"><span className="ni" aria-hidden="true">♡</span><span>שמורים</span>{ids.length > 0 && <b className="badge">{ids.length}</b>}</NavLink>
          <NavLink to="/about"><span className="ni" aria-hidden="true">ℹ️</span><span>איך זה עובד</span></NavLink>
        </nav>
      </div>
    </header>
  )
}
