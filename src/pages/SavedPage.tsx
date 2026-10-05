import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useData, useLoved, useSaved } from '../data'
import { useLang } from '../i18n'
import { MovieCard } from '../components/Cards'
import ForYou from '../components/ForYou'

export default function SavedPage() {
  const { byId } = useData()
  const { ids, addMany } = useSaved()
  const loved = useLoved()
  const [sp] = useSearchParams()
  const [copied, setCopied] = useState(false)
  const { t } = useLang()
  const sharedParam = sp.get('ids')
  const shared = useMemo(() => (sharedParam === null ? null : sharedParam.split(',').filter((x) => byId.has(x))), [sharedParam, byId])
  const savedList = useMemo(() => (shared ?? ids).map((i) => byId.get(i)!).filter(Boolean), [shared, ids, byId])
  const lovedList = useMemo(() => loved.ids.map((i) => byId.get(i)!).filter(Boolean), [loved.ids, byId])
  const exclude = useMemo(() => new Set([...ids, ...loved.ids]), [ids, loved.ids])
  const url = `${window.location.origin}/saved?ids=${ids.join(',')}`

  if (shared) {
    return (
      <section>
        <h1>{t('רשימה ששיתפו איתכם', 'A list shared with you')}</h1>
        <p><button className="btn primary" onClick={() => addMany(shared)}>{t('שמירת כל הסרטים אצלי', 'Save all these movies')}</button></p>
        <div className="grid">{savedList.map((m) => <MovieCard key={m.id} movie={m} />)}</div>
        <ForYou liked={savedList} source="shared" />
      </section>
    )
  }

  // ההמלצות מבוססות על "אהבתי". מי שעוד לא סימן כלום מקבל המלצות לפי השמורים
  const source = lovedList.length ? 'loved' : 'saved'
  return (
    <section>
      <h1>{t('הסרטים שלי', 'My movies')}</h1>
      {savedList.length === 0 && lovedList.length === 0 && (
        <div className="notice">
          <p>{t(
            'עדיין אין כאן סרטים. לחצו על הלב ♡ כדי לשמור סרט לצפייה, ועל הכוכב ☆ על סרט שאהבתם. ההמלצות ילמדו מהסרטים שאהבתם.',
            'No movies here yet. Tap the heart ♡ to save a movie to watch, and the star ☆ on a movie you loved. Recommendations learn from the movies you loved.',
          )}</p>
          <Link className="btn primary" to="/">{t('לגלות סרטים', 'Discover movies')}</Link>
        </div>
      )}

      {(lovedList.length > 0 || savedList.length > 0) && (
        <>
          <h2>★ {t('אהבתי', 'Loved')} ({lovedList.length})</h2>
          {lovedList.length === 0
            ? <p className="muted">{t('סמנו ☆ על סרטים שראיתם ואהבתם. ההמלצות "בשבילכם" יתבססו עליהם.', 'Mark ☆ on movies you watched and loved. The "For you" picks will be based on them.')}</p>
            : <div className="grid">{lovedList.map((m) => <MovieCard key={m.id} movie={m} />)}</div>}

          <div className="row-head">
            <h2>♡ {t('שמורים לצפייה', 'Saved to watch')} ({savedList.length})</h2>
            {savedList.length > 0 && (
              <button className="btn" onClick={() => { navigator.clipboard?.writeText(url); setCopied(true) }}>{copied ? t('הקישור הועתק', 'Link copied') : t('העתקת קישור לשיתוף הרשימה', 'Copy a link to share the list')}</button>
            )}
          </div>
          {savedList.length === 0
            ? <p className="muted">{t('לחצו על הלב ♡ כדי לשמור סרט שתרצו לראות.', 'Tap the heart ♡ to save a movie you want to watch.')}</p>
            : <div className="grid">{savedList.map((m) => <MovieCard key={m.id} movie={m} />)}</div>}
          <p className="muted">{t('הרשימות נשמרות בדפדפן הזה בלבד.', 'The lists are saved in this browser only.')}</p>
        </>
      )}

      <ForYou liked={source === 'loved' ? lovedList : savedList} source={source} exclude={exclude} />
    </section>
  )
}
