import { Link, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useData } from './data'
import { useLang } from './i18n'
import Header from './components/Header'
import { GridSkeleton } from './components/Cards'
import Home from './pages/Home'
import MoviePage from './pages/MoviePage'
import DirectorPage from './pages/DirectorPage'
import ComparePage from './pages/ComparePage'
import FindPage from './pages/FindPage'
import SavedPage from './pages/SavedPage'
import SearchPage from './pages/SearchPage'
import AboutPage from './pages/AboutPage'

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  const { status, retry, fromSnapshot } = useData()
  const { t } = useLang()
  return (
    <>
      <ScrollTop />
      <a className="skip" href="#main">{t('דלגו לתוכן', 'Skip to content')}</a>
      <Header />
      <main id="main" className="wrap">
        {status === 'loading' && (
          <div aria-busy="true" aria-live="polite">
            <div className="sk sk-title" />
            <GridSkeleton count={12} />
          </div>
        )}
        {status === 'error' && (
          <div className="notice big" role="alert">
            <h2>{t('לא הצלחנו לטעון את רשימת הסרטים', "We couldn't load the movie list")}</h2>
            <p>{t('בדקו את החיבור לאינטרנט ונסו שוב.', 'Check your internet connection and try again.')}</p>
            <button className="btn primary" onClick={retry}>{t('נסו שוב', 'Try again')}</button>
          </div>
        )}
        {status === 'ready' && (
          <>
            {fromSnapshot && <p className="note-bar">{t('המאגר המקוון לא זמין כרגע, מוצג עותק שמור.', 'The online database is unavailable, showing a saved copy.')}</p>}
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/find" element={<FindPage />} />
              <Route path="/movie/:id" element={<MoviePage />} />
              <Route path="/compare/:a/:b" element={<ComparePage />} />
              <Route path="/director/:key" element={<DirectorPage />} />
              <Route path="/saved" element={<SavedPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="*" element={<div className="notice big"><h2>{t('העמוד לא נמצא', 'Page not found')}</h2><Link className="btn primary" to="/">{t('חזרה לדף הבית', 'Back to home')}</Link></div>} />
            </Routes>
          </>
        )}
      </main>
      <footer className="foot wrap">
        <p>{t('הציונים של כל סרט הם הערכה של מודל שפה, לא אמת מוחלטת. פרטים על השיטה בדף', "Each movie's scores are a language model's estimate, not absolute truth. More about the method on")} <Link to="/about">{t('איך זה עובד', 'How it works')}</Link>.</p>
      </footer>
    </>
  )
}
