import { METRICS, norm, levelWord, type MetricKey, type Nudge } from './metrics'
import type { Movie } from './data'
import type { Lang } from './i18n'

export type Weights = number[]
export const DEFAULT_WEIGHTS: Weights = METRICS.map((m) => m.weight)

export function parseWeights(param: string | null): Weights {
  const w = [...DEFAULT_WEIGHTS]
  if (!param) return w
  for (const part of param.split(',')) {
    const [k, v] = part.split(':')
    const i = METRICS.findIndex((m) => m.key === k)
    const n = Number(v)
    if (i >= 0 && Number.isFinite(n)) w[i] = Math.min(2.5, Math.max(0, n))
  }
  return w
}
export function weightsToParam(w: Weights): string | null {
  const parts = METRICS.map((m, i) => (Math.abs(w[i] - m.weight) > 1e-9 ? `${m.key}:${w[i]}` : '')).filter(Boolean)
  return parts.length ? parts.join(',') : null
}

export interface Stats { mean: number[]; std: number[]; z: Map<string, number[]> }
export function buildStats(movies: Movie[]): Stats {
  const n = movies.length || 1
  const mean = METRICS.map((_, i) => movies.reduce((s, m) => s + m.values[i], 0) / n)
  const std = METRICS.map((_, i) => {
    const v = movies.reduce((s, m) => s + (m.values[i] - mean[i]) ** 2, 0) / n
    return Math.sqrt(v) || 1
  })
  const z = new Map(movies.map((m) => [m.id, m.values.map((x, i) => (x - mean[i]) / std[i])]))
  return { mean, std, z }
}

export interface Similar { movie: Movie; score: number; reasons: string[] }

export function reasonsFor(a: Movie, b: Movie, w: Weights, lang: Lang): string[] {
  const out = METRICS.map((m, i) => {
    const pa = norm(m, a.values[i])
    const pb = norm(m, b.values[i])
    const close = 1 - Math.abs(pa - pb)
    const ext = Math.abs((pa + pb) / 2 - 0.5)
    return { m, i, close, ext, s: close * ext * Math.max(w[i], 0.05) }
  })
    .filter((x) => x.close >= 0.75 && x.ext >= 0.15)
    .sort((x, y) => y.s - x.s)
    .slice(0, 3)
  const both = lang === 'he' ? 'בשניהם' : 'Both'
  return out.map((x) => `${both}: ${levelWord(x.m, Math.round((a.values[x.i] + b.values[x.i]) / 2), lang)}`)
}

// כמה סטיות תקן להזיז את המטרה בכל "אבל..."
const NUDGE_SHIFT = 1.2
// כמה הסרט צריך להיות לפחות בכיוון המבוקש, בסטיות תקן
export const NUDGE_MIN = 0.3

export function findSimilar(base: Movie, movies: Movie[], stats: Stats, weights: Weights, nudges: Nudge[] = []): Similar[] {
  let w = weights
  if (w.every((x) => x <= 0)) w = DEFAULT_WEIGHTS
  const zb = stats.z.get(base.id)!
  // המטרה היא הסרט עצמו, מוזז בתכונות שביקשו לשנות. התכונות האלה גם מקבלות משקל גבוה
  const target = [...zb]
  if (nudges.length) w = [...w]
  const dirs: { i: number; dir: number }[] = []
  for (const n of nudges) {
    const i = METRICS.findIndex((m) => m.key === n.key)
    target[i] = zb[i] + n.dir * NUDGE_SHIFT
    w[i] = Math.max(w[i], 2)
    dirs.push({ i, dir: n.dir })
  }
  const rows: { movie: Movie; d: number }[] = []
  for (const m of movies) {
    if (m.id === base.id) continue
    const zm = stats.z.get(m.id)!
    // "קליל יותר" חייב להיות באמת קליל יותר מהסרט המקורי
    if (dirs.some(({ i, dir }) => (zm[i] - zb[i]) * dir < NUDGE_MIN)) continue
    let s = 0
    for (let i = 0; i < zb.length; i++) s += w[i] * (target[i] - zm[i]) ** 2
    rows.push({ movie: m, d: Math.sqrt(s) })
  }
  const pos = rows.map((r) => r.d).filter((d) => d > 0).sort((a, b) => a - b)
  const p40 = pos.length ? pos[Math.floor(pos.length * 0.4)] || pos[pos.length - 1] : 1
  return rows
    .map((r) => {
      let score = 100 * Math.exp(-0.45 * Math.pow(r.d / p40, 1.3))
      if (base.director && r.movie.director === base.director) score = Math.min(96, score + 6)
      return { movie: r.movie, score: Math.round(score * 10) / 10, reasons: [] as string[] }
    })
    .sort((a, b) => b.score - a.score)
}

export function metricKeyIndex(k: MetricKey) { return METRICS.findIndex((m) => m.key === k) }

export interface Recommendation { movie: Movie; score: number; because: Movie[] }

/**
 * המלצות לפי רשימת סרטים שאהבו. הציון של כל סרט נקבע בעיקר לפי הסרט השמור הכי דומה לו,
 * ואחר כך מסדרים כך שכל סרט שמור יקבל ייצוג: מי שאהב גם קומדיות וגם דרמות קשות יקבל משניהם
 */
export function recommendFor(liked: Movie[], movies: Movie[], stats: Stats, exclude: Set<string> = new Set()): Recommendation[] {
  if (!liked.length) return []
  // לא ממליצים על מה שכבר אהבו או כבר שמרו לצפייה
  const likedIds = new Set([...liked.map((m) => m.id), ...exclude])
  const per = new Map<string, { score: number; from: Movie }[]>()
  for (const base of liked) {
    for (const r of findSimilar(base, movies, stats, DEFAULT_WEIGHTS)) {
      if (likedIds.has(r.movie.id)) continue
      let a = per.get(r.movie.id)
      if (!a) per.set(r.movie.id, (a = []))
      a.push({ score: r.score, from: base })
    }
  }
  const byId = new Map(movies.map((m) => [m.id, m]))
  const all: Recommendation[] = []
  per.forEach((a, id) => {
    a.sort((x, y) => y.score - x.score)
    // סרט שדומה לשני סרטים שאהבו מקבל תוספת קטנה
    const score = a.length > 1 ? 0.8 * a[0].score + 0.2 * a[1].score : a[0].score
    // "בגלל": הסרטים השמורים שהכי דומים לו
    const because = a.slice(0, 2).filter((x, i) => i === 0 || x.score >= 75).map((x) => x.from)
    all.push({ movie: byId.get(id)!, score: Math.round(score * 10) / 10, because })
  })
  all.sort((a, b) => b.score - a.score)
  // סידור לפי תור: כל המלצה נוספת מאותו סרט שמור "עולה" 2 נקודות, כדי שסרט אחד לא ישתלט
  const pool = all.slice(0, 400)
  const used = new Map<string, number>()
  const out: Recommendation[] = []
  while (pool.length) {
    let best = 0
    let bestVal = -Infinity
    for (let j = 0; j < pool.length; j++) {
      const v = pool[j].score - 2 * (used.get(pool[j].because[0].id) || 0)
      if (v > bestVal) { bestVal = v; best = j }
      if (pool[j].score < bestVal) break // הרשימה ממוינת, אין טעם להמשיך
    }
    const [r] = pool.splice(best, 1)
    used.set(r.because[0].id, (used.get(r.because[0].id) || 0) + 1)
    out.push(r)
  }
  return out.concat(all.slice(400))
}

/** התכונות הכי בולטות בטעם: איפה הממוצע של הרשימה הכי רחוק מהממוצע הכללי */
export function tasteTraits(liked: Movie[], stats: Stats, count = 4): { i: number; value: number }[] {
  if (!liked.length) return []
  return METRICS.map((_, i) => {
    const value = liked.reduce((s, m) => s + m.values[i], 0) / liked.length
    return { i, value, z: (value - stats.mean[i]) / stats.std[i] }
  })
    .filter((x) => Math.abs(x.z) >= 0.4)
    .sort((a, b) => Math.abs(b.z) - Math.abs(a.z))
    .slice(0, count)
}
