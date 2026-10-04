export type MetricKey =
  | 'chamber_intimacy' | 'emotional_restraint' | 'plot_vs_mood' | 'raw_vs_stylized'
  | 'emotional_warmth' | 'psychological_depth' | 'irony_and_satire' | 'ambiguity_level'
  | 'grounded_vs_surreal' | 'emotional_heaviness' | 'violence_level' | 'sexuality_level'

export interface Metric {
  key: MetricKey
  name: string
  low: string
  high: string
  group: string
  max: number // 10 or 5
  weight: number
}

export const GROUPS = ['סגנון ומראה', 'אווירה ורגש', 'תוכן רגיש']

export const METRICS: Metric[] = [
  { key: 'chamber_intimacy', name: 'גודל הסיפור', low: 'גדול ואפי', high: 'אינטימי וקטן', group: GROUPS[0], max: 10, weight: 1.5 },
  { key: 'plot_vs_mood', name: 'עלילה או אווירה', low: 'מונע עלילה', high: 'מונע אווירה', group: GROUPS[0], max: 10, weight: 1.4 },
  { key: 'raw_vs_stylized', name: 'מראה הסרט', low: 'גולמי וטבעי', high: 'מעוצב ומסוגנן', group: GROUPS[0], max: 10, weight: 1.2 },
  { key: 'grounded_vs_surreal', name: 'קרוב למציאות', low: 'מציאותי', high: 'מוזר וחלומי', group: GROUPS[0], max: 10, weight: 1.4 },
  { key: 'emotional_restraint', name: 'סערת רגשות', low: 'סוער ומוחצן', high: 'מאופק ושקט', group: GROUPS[1], max: 10, weight: 1.4 },
  { key: 'emotional_warmth', name: 'חום', low: 'קר ואנליטי', high: 'חם ואנושי', group: GROUPS[1], max: 10, weight: 1.6 },
  { key: 'psychological_depth', name: 'עומק', low: 'קליל ובידורי', high: 'עמוק ונפשי', group: GROUPS[1], max: 10, weight: 1.5 },
  { key: 'irony_and_satire', name: 'הומור וציניות', low: 'רציני', high: 'אירוני וסאטירי', group: GROUPS[1], max: 10, weight: 1.3 },
  { key: 'ambiguity_level', name: 'בהירות', low: 'ברור וסגור', high: 'עמום ופתוח לפירוש', group: GROUPS[1], max: 10, weight: 1.2 },
  { key: 'emotional_heaviness', name: 'כובד', low: 'קליל', high: 'כבד ומטלטל', group: GROUPS[1], max: 10, weight: 0.6 },
  { key: 'violence_level', name: 'אלימות', low: 'כמעט בלי אלימות', high: 'אלים מאוד', group: GROUPS[2], max: 5, weight: 0.3 },
  { key: 'sexuality_level', name: 'תוכן מיני', low: 'כמעט בלי תוכן מיני', high: 'מפורש', group: GROUPS[2], max: 5, weight: 0.3 },
]

export const METRIC_BY_KEY = Object.fromEntries(METRICS.map((m) => [m.key, m])) as Record<MetricKey, Metric>

/** ערך בין 0 ל-1 */
export function norm(m: Metric, v: number): number {
  return Math.min(1, Math.max(0, (v - 1) / (m.max - 1)))
}

export function levelWord(m: Metric, v: number): string {
  const p = norm(m, v)
  if (p <= 0.34) return m.low
  if (p >= 0.66) return m.high
  return 'באמצע'
}

export type Bucket = 'l' | 'm' | 'h'
export const BUCKET_LABEL: Record<Bucket, string> = { l: 'נמוך', m: 'באמצע', h: 'גבוה' }
export function bucketOf(m: Metric, v: number): Bucket {
  const p = norm(m, v)
  return p <= 0.34 ? 'l' : p >= 0.66 ? 'h' : 'm'
}
export const BUCKET_TARGET: Record<Bucket, number> = { l: 0.1, m: 0.5, h: 0.9 }

export const MOODS: { id: string; label: string; emoji: string; hint: string; f: Partial<Record<MetricKey, Bucket>> }[] = [
  { id: 'light', label: 'משהו קליל וחם', emoji: '☀️', hint: 'בלי כובד, עם לב', f: { emotional_heaviness: 'l', emotional_warmth: 'h' } },
  { id: 'cry', label: 'רוצה להתרגש עד דמעות', emoji: '😢', hint: 'כבד ורגשי', f: { emotional_heaviness: 'h', emotional_warmth: 'h' } },
  { id: 'think', label: 'שיישאיר אותי חושב', emoji: '🤔', hint: 'עמוק ופתוח לפירוש', f: { psychological_depth: 'h', ambiguity_level: 'h' } },
  { id: 'funny', label: 'חד, מצחיק ואירוני', emoji: '😏', hint: 'סאטירה ובלי כובד', f: { irony_and_satire: 'h', emotional_heaviness: 'l' } },
  { id: 'story', label: 'עלילה שסוחפת', emoji: '🎢', hint: 'סיפור ברור שמתקדם', f: { plot_vs_mood: 'l', ambiguity_level: 'l' } },
  { id: 'mood', label: 'אווירה, שקט ולאט', emoji: '🌙', hint: 'להתמסר לתחושה', f: { plot_vs_mood: 'h', emotional_restraint: 'h' } },
  { id: 'weird', label: 'משהו מוזר ויוצא דופן', emoji: '🌀', hint: 'חלומי וסוריאליסטי', f: { grounded_vs_surreal: 'h' } },
  { id: 'clean', label: 'בלי אלימות ובלי תוכן מיני', emoji: '🕊️', hint: 'שקט לצפייה משותפת', f: { violence_level: 'l', sexuality_level: 'l' } },
]
