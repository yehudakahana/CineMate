import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useData, type Movie } from '../data'
import { useStats } from '../hooks'
import { useLang } from '../i18n'
import { METRICS } from '../metrics'
import { recommendFor, tasteTraits } from '../similarity'
import { MovieCard } from './Cards'

const PAGE = 24

/** המלצות לפי רשימת הסרטים שאהבו. compact: שורה קצרה לדף הבית עם קישור לכל ההמלצות */
/** source: מאיפה הרשימה. loved = "אהבתי", saved = השמורים (כשעוד לא סימנו "אהבתי"), shared = רשימה ששיתפו */
export default function ForYou({ liked, source, exclude, compact = false }: { liked: Movie[]; source: 'loved' | 'saved' | 'shared'; exclude?: Set<string>; compact?: boolean }) {
  const { movies } = useData()
  const stats = useStats()
  const { lang, t, title } = useLang()
  const [shown, setShown] = useState(PAGE)
  const recs = useMemo(() => recommendFor(liked, movies, stats, exclude), [liked, movies, stats, exclude])
  const traits = useMemo(() => tasteTraits(liked, stats), [liked, stats])
  const { hash } = useLocation()
  // הגעה מהקישור בדף הבית: גוללים להמלצות
  useEffect(() => {
    if (!compact && hash === '#for-you' && recs.length) document.getElementById('for-you')?.scrollIntoView()
  }, [compact, hash, recs.length])
  if (!recs.length) return null

  const taste = traits.map(({ i, value }) => {
    const m = METRICS[i]
    return value > stats.mean[i] ? m.high[lang] : m.low[lang]
  })
  const list = recs.slice(0, compact ? 6 : shown)

  return (
    <section id="for-you">
      <div className="row-head">
        <h2>{t('בשבילכם', 'For you')}</h2>
        {compact && <Link className="btn ghost" to="/saved#for-you">{t('לכל ההמלצות', 'All recommendations')}</Link>}
      </div>
      {taste.length > 0 && (
        <p className="taste">
          <b>{t('הטעם שלכם נוטה ל:', 'Your taste leans toward:')}</b>{' '}
          {taste.map((w) => <span key={w} className="tag same">{w}</span>)}
        </p>
      )}
      <p className="muted">
        {source === 'loved' && (liked.length === 1
          ? t('מבוסס על הסרט שאהבתם.', 'Based on the movie you loved.')
          : t(`מבוסס על ${liked.length} הסרטים שאהבתם.`, `Based on the ${liked.length} movies you loved.`))}
        {source === 'saved' && (liked.length === 1
          ? t('מבוסס על הסרט ששמרתם.', 'Based on the movie you saved.')
          : t(`מבוסס על ${liked.length} הסרטים ששמרתם.`, `Based on the ${liked.length} movies you saved.`))}
        {source === 'shared' && t(`מבוסס על ${liked.length} הסרטים ברשימה הזו.`, `Based on the ${liked.length} movies in this list.`)}
        {source === 'saved' && ' ' + t('סמנו ★ "אהבתי" על סרטים שאהבתם באמת, וההמלצות יתבססו רק עליהם.', 'Mark the movies you really loved with ★ and recommendations will be based on those only.')}
        {source === 'loved' && liked.length < 3 && ' ' + t('סמנו ★ על עוד כמה סרטים שאהבתם כדי לקבל המלצות מדויקות יותר.', 'Mark a few more movies you loved with ★ for sharper picks.')}
      </p>
      <div className="grid">
        {list.map((r) => (
          <MovieCard
            key={r.movie.id} movie={r.movie} score={r.score}
            reasons={[t('כי אהבתם', 'Because you liked') + ': ' + r.because.map((m) => title(m)).join(', ')]}
          />
        ))}
      </div>
      {!compact && shown < recs.length && (
        <div className="center"><button className="btn" onClick={() => setShown((n) => n + PAGE)}>{t('הצגת עוד', 'Show more')}</button></div>
      )}
    </section>
  )
}
