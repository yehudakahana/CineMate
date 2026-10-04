import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { METRICS, type MetricKey } from './metrics'

const DATA_URL = (import.meta.env.VITE_DATA_URL as string) || 'https://cinema-dna.pages.dev/final_classified_db.json'
export const IMAGE_BASE = ((import.meta.env.VITE_IMAGE_BASE as string) || 'https://pub-d05124f3b7094e6b8b0af331b009eeef.r2.dev').replace(/\/$/, '')

export interface Movie {
  id: string
  title: string
  titleEn: string
  year: number
  director: string
  directorEn: string
  directorKey: string
  poster: string | null
  directorImage: string | null
  description: string
  wikiUrl: string | null
  imdbId: string | null
  directorWikiUrl: string | null
  values: number[] // לפי סדר METRICS
  warning: string | null
  search: string
}

export interface Director {
  key: string
  name: string
  nameEn: string
  image: string | null
  wikiUrl: string | null
  movies: Movie[]
}

interface RawMovie {
  id: string
  h_title?: string
  e_title?: string
  year?: number
  director_h?: string
  director_e?: string
  local_poster?: string
  local_director_image?: string
  description?: string
  wiki_url?: string
  imdb_id?: string
  director_wiki_url?: string
  dna?: Record<string, number>
}

const strip = (s: string) => s.toLowerCase().replace(/[\u0591-\u05C7]/g, '').replace(/[^\p{L}\p{N} ]/gu, ' ').replace(/\s+/g, ' ').trim()
export const normalizeText = strip

export function slug(s: string): string {
  return strip(s).replace(/ /g, '-')
}

function clean(raw: RawMovie[]): { movies: Movie[]; skipped: number } {
  // מזהי IMDb שמופיעים בשני סרטים שונים הם חשודים: לא מציגים קישור
  const imdbCount = new Map<string, number>()
  raw.forEach((r) => r.imdb_id && imdbCount.set(r.imdb_id, (imdbCount.get(r.imdb_id) || 0) + 1))
  let skipped = 0
  const movies: Movie[] = []
  for (const r of raw) {
    if (!r || !r.id || !r.dna) { skipped++; continue }
    const values = METRICS.map((m) => Number(r.dna![m.key as MetricKey]))
    if (values.some((v) => !Number.isFinite(v))) { skipped++; continue }
    const title = (r.h_title || '').trim() || (r.e_title || '').trim() || 'ללא שם'
    const directorEn = (r.director_e || '').trim()
    const director = (r.director_h || '').trim() || directorEn
    let imdbId = r.imdb_id || null
    let wikiUrl = r.wiki_url || null
    let description = (r.description || '').trim()
    let directorWikiUrl = r.director_wiki_url || null
    let warning: string | null = null
    if (imdbId && (imdbCount.get(imdbId) || 0) > 1) {
      imdbId = null
      warning = 'חלק מהקישורים החיצוניים לסרט הזה לא אמינים במאגר ולכן לא מוצגים.'
    }
    // רשומה ידועה כמעורבבת: "חלומות" של דאג יוהן הוגרד
    if (/haugerud/i.test(directorEn) && /^dreams/i.test((r.e_title || '').trim())) {
      imdbId = null
      wikiUrl = null
      description = ''
      warning = 'במאגר המקורי חלק מפרטי הסרט הזה שייכים לסרט אחר, ולכן הוסתרו התקציר והקישורים. ציוני האופי והפוסטר נראים תקינים.'
    }
    const key = slug(directorEn || director) || 'unknown'
    movies.push({
      id: r.id,
      title,
      titleEn: (r.e_title || '').trim(),
      year: Number(r.year) || 0,
      director,
      directorEn,
      directorKey: key,
      poster: r.local_poster ? `${IMAGE_BASE}/${r.local_poster.replace(/^\//, '')}` : null,
      directorImage: r.local_director_image ? `${IMAGE_BASE}/${r.local_director_image.replace(/^\//, '')}` : null,
      description,
      wikiUrl,
      imdbId,
      directorWikiUrl,
      values,
      warning,
      search: strip([title, r.e_title, director, directorEn].filter(Boolean).join(' ')),
    })
  }
  return { movies, skipped }
}

interface DataState {
  status: 'loading' | 'ready' | 'error'
  movies: Movie[]
  byId: Map<string, Movie>
  directors: Director[]
  directorByKey: Map<string, Director>
  fromSnapshot: boolean
  retry: () => void
}

const Ctx = createContext<DataState | null>(null)

async function getJson(url: string): Promise<RawMovie[]> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(String(res.status))
  const j = await res.json()
  if (!Array.isArray(j)) throw new Error('bad shape')
  return j
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ status: 'loading' | 'ready' | 'error'; movies: Movie[]; snap: boolean }>({ status: 'loading', movies: [], snap: false })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let live = true
    setState({ status: 'loading', movies: [], snap: false })
    ;(async () => {
      let snap = false
      let raw: RawMovie[]
      try {
        raw = await getJson(DATA_URL)
      } catch {
        try {
          raw = await getJson(`${import.meta.env.BASE_URL}data-snapshot.json`)
          snap = true
        } catch {
          if (live) setState({ status: 'error', movies: [], snap: false })
          return
        }
      }
      const { movies } = clean(raw)
      if (live) setState({ status: movies.length ? 'ready' : 'error', movies, snap })
    })()
    return () => { live = false }
  }, [attempt])

  const value = useMemo<DataState>(() => {
    const byId = new Map(state.movies.map((m) => [m.id, m]))
    const dm = new Map<string, Director>()
    for (const m of state.movies) {
      let d = dm.get(m.directorKey)
      if (!d) { d = { key: m.directorKey, name: m.director, nameEn: m.directorEn, image: null, wikiUrl: null, movies: [] }; dm.set(m.directorKey, d) }
      d.movies.push(m)
      if (!d.image && m.directorImage) d.image = m.directorImage
      if (!d.wikiUrl && m.directorWikiUrl) d.wikiUrl = m.directorWikiUrl
    }
    dm.forEach((d) => d.movies.sort((a, b) => b.year - a.year))
    return {
      status: state.status, movies: state.movies, byId, directors: [...dm.values()], directorByKey: dm,
      fromSnapshot: state.snap, retry: () => setAttempt((n) => n + 1),
    }
  }, [state])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useData(): DataState {
  const c = useContext(Ctx)
  if (!c) throw new Error('no data')
  return c
}

// ---- שמירה ----
const KEY = 'cdna-saved-v1'
function readSaved(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}
export function useSaved() {
  const [ids, setIds] = useState<string[]>(readSaved)
  useEffect(() => {
    const on = () => setIds(readSaved())
    window.addEventListener('cdna-saved', on)
    window.addEventListener('storage', on)
    return () => { window.removeEventListener('cdna-saved', on); window.removeEventListener('storage', on) }
  }, [])
  const write = useCallback((next: string[]) => {
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* ignore */ }
    window.dispatchEvent(new Event('cdna-saved'))
    setIds(next)
  }, [])
  const toggle = useCallback((id: string) => {
    const cur = readSaved()
    write(cur.includes(id) ? cur.filter((x) => x !== id) : [id, ...cur])
  }, [write])
  const addMany = useCallback((more: string[]) => {
    const cur = readSaved()
    write([...more.filter((x) => !cur.includes(x)), ...cur])
  }, [write])
  return { ids, has: (id: string) => ids.includes(id), toggle, addMany }
}
