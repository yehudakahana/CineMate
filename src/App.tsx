import { Link, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useData } from './data'
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
  return (
    <>
      <ScrollTop />
      <a className="skip" href="#main">דלגו לתוכן</a>
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
            <h2>לא הצלחנו לטעון את רשימת הסרטים</h2>
            <p>בדקו את החיבור לאינטרנט ונסו שוב.</p>
            <button className="btn primary" onClick={retry}>נסו שוב</button>
          </div>
        )}
        {status === 'ready' && (
          <>
            {fromSnapshot && <p className="note-bar">המאגר המקוון לא זמין כרגע, מוצג עותק שמור.</p>}
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/find" element={<FindPage />} />
              <Route path="/movie/:id" element={<MoviePage />} />
              <Route path="/compare/:a/:b" element={<ComparePage />} />
              <Route path="/director/:key" element={<DirectorPage />} />
              <Route path="/saved" element={<SavedPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="*" element={<div className="notice big"><h2>העמוד לא נמצא</h2><Link className="btn primary" to="/">חזרה לדף הבית</Link></div>} />
            </Routes>
          </>
        )}
      </main>
      <footer className="foot wrap">
        <p>הציונים של כל סרט הם הערכה של מודל שפה, לא אמת מוחלטת. פרטים על השיטה בדף <Link to="/about">איך זה עובד</Link>.</p>
      </footer>
    </>
  )
}
