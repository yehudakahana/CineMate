import { METRICS, norm, levelWord, type MetricKey } from './metrics'
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

export function findSimilar(base: Movie, movies: Movie[], stats: Stats, weights: Weights): Similar[] {
  let w = weights
  if (w.every((x) => x <= 0)) w = DEFAULT_WEIGHTS
  const zb = stats.z.get(base.id)!
  const rows: { movie: Movie; d: number }[] = []
  for (const m of movies) {
    if (m.id === base.id) continue
    const zm = stats.z.get(m.id)!
    let s = 0
    for (let i = 0; i < zb.length; i++) s += w[i] * (zb[i] - zm[i]) ** 2
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
