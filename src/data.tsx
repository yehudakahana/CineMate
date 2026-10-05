import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { METRICS, type MetricKey } from './metrics'

// המאגר המעודכן מגיע עם האפליקציה. כתובת חיצונית רק אם הוגדרה במפורש
const DATA_URL = (import.meta.env.VITE_DATA_URL as string) || ''
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
  descriptionHe: string
  wikiUrl: string | null
  imdbId: string | null
  directorWikiUrl: string | null
  values: number[] // לפי סדר METRICS
  warning: 'links' | 'mixed' | null // מתורגם בדף הסרט
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
  synopsis_he?: string
  synopsis_en_corrected?: string
  synopsis_fixed?: boolean
  synopsis_mismatch?: boolean
  director_fixed?: boolean
}

// ערכים ריקים שמגיעים מהגיליון המקורי
const val = (s?: string) => {
  const t = (s || '').trim()
  return t === '#N/A' || t === '0' ? '' : t
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
  // בסרטים שהבמאי שלהם תוקן, ייתכן שהשם העברי, התמונה והקישור עדיין של הבמאי הקודם:
  // לוקחים אותם מסרט אחר של אותו במאי. אם אין כזה, משאירים אותם רק אם הם לא של במאי אחר
  const dirInfo = new Map<string, RawMovie>()
  const hebrewOwner = new Map<string, string>()
  for (const r of raw) {
    const k = val(r?.director_e)
    if (!r || !k || r.director_fixed) continue
    if (val(r.director_h) && !dirInfo.has(k)) dirInfo.set(k, r)
    if (val(r.director_h)) hebrewOwner.set(val(r.director_h), k)
  }
  const fixedInfo = (r: RawMovie): RawMovie | undefined => {
    const other = dirInfo.get(val(r.director_e))
    if (other) return other
    const owner = hebrewOwner.get(val(r.director_h))
    return owner && owner !== val(r.director_e) ? undefined : r
  }
  let skipped = 0
  const movies: Movie[] = []
  for (const r of raw) {
    if (!r || !r.id || !r.dna) { skipped++; continue }
    const values = METRICS.map((m) => Number(r.dna![m.key as MetricKey]))
    if (values.some((v) => !Number.isFinite(v))) { skipped++; continue }
    const title = val(r.h_title) || val(r.e_title) || 'ללא שם'
    const directorEn = val(r.director_e)
    const d = r.director_fixed ? fixedInfo(r) : r
    const director = val(d?.director_h) || directorEn
    const directorImage = d?.local_director_image || null
    let imdbId = r.imdb_id || null
    let wikiUrl = r.wiki_url || null
    // התקציר המתוקן גובר על המקורי. תרגום שלא תואם לסרט לא מוצג
    let description = (r.synopsis_fixed && val(r.synopsis_en_corrected)) || (r.description || '').trim()
    let descriptionHe = r.synopsis_mismatch ? '' : val(r.synopsis_he)
    let directorWikiUrl = d?.director_wiki_url || null
    let warning: Movie['warning'] = null
    if (imdbId && (imdbCount.get(imdbId) || 0) > 1) {
      imdbId = null
      warning = 'links'
    }
    // רשומה ידועה כמעורבבת: "חלומות" של דאג יוהן הוגרד
    if (/haugerud/i.test(directorEn) && /^dreams/i.test((r.e_title || '').trim())) {
      imdbId = null
      wikiUrl = null
      description = ''
      descriptionHe = ''
      warning = 'mixed'
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
      directorImage: directorImage ? `${IMAGE_BASE}/${directorImage.replace(/^\//, '')}` : null,
      description,
      descriptionHe,
      wikiUrl,
      imdbId,
      directorWikiUrl,
      values,
      warning,
      search: strip([title, val(r.e_title), director, directorEn].filter(Boolean).join(' ')),
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
        if (!DATA_URL) throw new Error('no remote')
        raw = await getJson(DATA_URL)
      } catch {
        try {
          raw = await getJson(`${import.meta.env.BASE_URL}data-snapshot.json`)
          snap = !!DATA_URL
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
