import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useData, useSaved } from '../data'
import { MovieCard } from '../components/Cards'

export default function SavedPage() {
  const { byId } = useData()
  const { ids, addMany } = useSaved()
  const [sp] = useSearchParams()
  const [copied, setCopied] = useState(false)
  const shared = sp.get('ids')?.split(',').filter((x) => byId.has(x)) || null
  const list = (shared ?? ids).map((i) => byId.get(i)!).filter(Boolean)
  const url = `${window.location.origin}/saved?ids=${ids.join(',')}`

  return (
    <section>
      <h1>{shared ? 'רשימה ששיתפו איתכם' : 'הסרטים השמורים שלי'}</h1>
      {shared && <p><button className="btn primary" onClick={() => addMany(shared)}>שמירת כל הסרטים אצלי</button></p>}
      {!shared && ids.length > 0 && (
        <p>
          <button className="btn" onClick={() => { navigator.clipboard?.writeText(url); setCopied(true) }}>{copied ? 'הקישור הועתק' : 'העתקת קישור לשיתוף הרשימה'}</button>
        </p>
      )}
      {!shared && <p className="muted">הרשימה נשמרת בדפדפן הזה בלבד.</p>}
      {list.length === 0 && <div className="notice"><p>עדיין אין כאן סרטים. לחצו על הלב ♡ בכל סרט כדי לשמור אותו.</p><Link className="btn primary" to="/">לגלות סרטים</Link></div>}
      <div className="grid">{list.map((m) => <MovieCard key={m.id} movie={m} />)}</div>
    </section>
  )
}
