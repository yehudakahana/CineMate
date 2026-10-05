import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useData, useSaved } from '../data'
import { useLang } from '../i18n'
import { MovieCard } from '../components/Cards'

export default function SavedPage() {
  const { byId } = useData()
  const { ids, addMany } = useSaved()
  const [sp] = useSearchParams()
  const [copied, setCopied] = useState(false)
  const { t } = useLang()
  const shared = sp.get('ids')?.split(',').filter((x) => byId.has(x)) || null
  const list = (shared ?? ids).map((i) => byId.get(i)!).filter(Boolean)
  const url = `${window.location.origin}/saved?ids=${ids.join(',')}`

  return (
    <section>
      <h1>{shared ? t('רשימה ששיתפו איתכם', 'A list shared with you') : t('הסרטים השמורים שלי', 'My saved movies')}</h1>
      {shared && <p><button className="btn primary" onClick={() => addMany(shared)}>{t('שמירת כל הסרטים אצלי', 'Save all these movies')}</button></p>}
      {!shared && ids.length > 0 && (
        <p>
          <button className="btn" onClick={() => { navigator.clipboard?.writeText(url); setCopied(true) }}>{copied ? t('הקישור הועתק', 'Link copied') : t('העתקת קישור לשיתוף הרשימה', 'Copy a link to share the list')}</button>
        </p>
      )}
      {!shared && <p className="muted">{t('הרשימה נשמרת בדפדפן הזה בלבד.', 'The list is saved in this browser only.')}</p>}
      {list.length === 0 && <div className="notice"><p>{t('עדיין אין כאן סרטים. לחצו על הלב ♡ בכל סרט כדי לשמור אותו.', 'No movies here yet. Tap the heart ♡ on any movie to save it.')}</p><Link className="btn primary" to="/">{t('לגלות סרטים', 'Discover movies')}</Link></div>}
      <div className="grid">{list.map((m) => <MovieCard key={m.id} movie={m} />)}</div>
    </section>
  )
}
