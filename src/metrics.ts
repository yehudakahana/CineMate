import type { Lang } from './i18n'

export type MetricKey =
  | 'chamber_intimacy' | 'emotional_restraint' | 'plot_vs_mood' | 'raw_vs_stylized'
  | 'emotional_warmth' | 'psychological_depth' | 'irony_and_satire' | 'ambiguity_level'
  | 'grounded_vs_surreal' | 'emotional_heaviness' | 'violence_level' | 'sexuality_level'

type Text = Record<Lang, string>

export interface Metric {
  key: MetricKey
  name: Text
  low: Text
  high: Text
  group: number // אינדקס ב-GROUPS
  max: number // 10 or 5
  weight: number
}

export const GROUPS: Text[] = [
  { he: 'סגנון ומראה', en: 'Style & look' },
  { he: 'אווירה ורגש', en: 'Mood & emotion' },
  { he: 'תוכן רגיש', en: 'Sensitive content' },
]

export const METRICS: Metric[] = [
  { key: 'chamber_intimacy', name: { he: 'גודל הסיפור', en: 'Story scale' }, low: { he: 'גדול ואפי', en: 'Big and epic' }, high: { he: 'אינטימי וקטן', en: 'Small and intimate' }, group: 0, max: 10, weight: 1.5 },
  { key: 'plot_vs_mood', name: { he: 'עלילה או אווירה', en: 'Plot or mood' }, low: { he: 'מונע עלילה', en: 'Plot-driven' }, high: { he: 'מונע אווירה', en: 'Mood-driven' }, group: 0, max: 10, weight: 1.4 },
  { key: 'raw_vs_stylized', name: { he: 'מראה הסרט', en: 'Look' }, low: { he: 'גולמי וטבעי', en: 'Raw and natural' }, high: { he: 'מעוצב ומסוגנן', en: 'Stylized' }, group: 0, max: 10, weight: 1.2 },
  { key: 'grounded_vs_surreal', name: { he: 'קרוב למציאות', en: 'Realism' }, low: { he: 'מציאותי', en: 'Realistic' }, high: { he: 'מוזר וחלומי', en: 'Strange and dreamlike' }, group: 0, max: 10, weight: 1.4 },
  { key: 'emotional_restraint', name: { he: 'סערת רגשות', en: 'Emotional intensity' }, low: { he: 'סוער ומוחצן', en: 'Stormy and expressive' }, high: { he: 'מאופק ושקט', en: 'Restrained and quiet' }, group: 1, max: 10, weight: 1.4 },
  { key: 'emotional_warmth', name: { he: 'חום', en: 'Warmth' }, low: { he: 'קר ואנליטי', en: 'Cold and analytical' }, high: { he: 'חם ואנושי', en: 'Warm and human' }, group: 1, max: 10, weight: 1.6 },
  { key: 'psychological_depth', name: { he: 'עומק', en: 'Depth' }, low: { he: 'קליל ובידורי', en: 'Light entertainment' }, high: { he: 'עמוק ונפשי', en: 'Deep and psychological' }, group: 1, max: 10, weight: 1.5 },
  { key: 'irony_and_satire', name: { he: 'הומור וציניות', en: 'Irony' }, low: { he: 'רציני', en: 'Serious' }, high: { he: 'אירוני וסאטירי', en: 'Ironic and satirical' }, group: 1, max: 10, weight: 1.3 },
  { key: 'ambiguity_level', name: { he: 'בהירות', en: 'Clarity' }, low: { he: 'ברור וסגור', en: 'Clear and resolved' }, high: { he: 'עמום ופתוח לפירוש', en: 'Ambiguous and open' }, group: 1, max: 10, weight: 1.2 },
  { key: 'emotional_heaviness', name: { he: 'כובד', en: 'Heaviness' }, low: { he: 'קליל', en: 'Light' }, high: { he: 'כבד ומטלטל', en: 'Heavy and shaking' }, group: 1, max: 10, weight: 0.6 },
  { key: 'violence_level', name: { he: 'אלימות', en: 'Violence' }, low: { he: 'כמעט בלי אלימות', en: 'Almost no violence' }, high: { he: 'אלים מאוד', en: 'Very violent' }, group: 2, max: 5, weight: 0.3 },
  { key: 'sexuality_level', name: { he: 'תוכן מיני', en: 'Sexual content' }, low: { he: 'כמעט בלי תוכן מיני', en: 'Almost no sexual content' }, high: { he: 'מפורש', en: 'Explicit' }, group: 2, max: 5, weight: 0.3 },
]

export const METRIC_BY_KEY = Object.fromEntries(METRICS.map((m) => [m.key, m])) as Record<MetricKey, Metric>

/** ערך בין 0 ל-1 */
export function norm(m: Metric, v: number): number {
  return Math.min(1, Math.max(0, (v - 1) / (m.max - 1)))
}

export type Bucket = 'l' | 'm' | 'h'
export const BUCKET_LABEL: Record<Bucket, Text> = {
  l: { he: 'נמוך', en: 'Low' },
  m: { he: 'באמצע', en: 'In between' },
  h: { he: 'גבוה', en: 'High' },
}
export function bucketOf(m: Metric, v: number): Bucket {
  const p = norm(m, v)
  return p <= 0.34 ? 'l' : p >= 0.66 ? 'h' : 'm'
}
export const BUCKET_TARGET: Record<Bucket, number> = { l: 0.1, m: 0.5, h: 0.9 }

/** שם הקצה המתאים לדלי: "נמוך" מוצג כשם הקצה הנמוך וכן הלאה */
export function bucketWord(m: Metric, b: Bucket, lang: Lang): string {
  return b === 'l' ? m.low[lang] : b === 'h' ? m.high[lang] : BUCKET_LABEL.m[lang]
}

export function levelWord(m: Metric, v: number, lang: Lang): string {
  return bucketWord(m, bucketOf(m, v), lang)
}

export const MOODS: { id: string; label: Text; emoji: string; hint: Text; f: Partial<Record<MetricKey, Bucket>> }[] = [
  { id: 'light', label: { he: 'משהו קליל וחם', en: 'Something light and warm' }, emoji: '☀️', hint: { he: 'בלי כובד, עם לב', en: 'No heaviness, lots of heart' }, f: { emotional_heaviness: 'l', emotional_warmth: 'h' } },
  { id: 'cry', label: { he: 'רוצה להתרגש עד דמעות', en: 'I want a good cry' }, emoji: '😢', hint: { he: 'כבד ורגשי', en: 'Heavy and emotional' }, f: { emotional_heaviness: 'h', emotional_warmth: 'h' } },
  { id: 'think', label: { he: 'שיישאיר אותי חושב', en: 'Something to think about' }, emoji: '🤔', hint: { he: 'עמוק ופתוח לפירוש', en: 'Deep and open to interpretation' }, f: { psychological_depth: 'h', ambiguity_level: 'h' } },
  { id: 'funny', label: { he: 'חד, מצחיק ואירוני', en: 'Sharp, funny and ironic' }, emoji: '😏', hint: { he: 'סאטירה ובלי כובד', en: 'Satire without the weight' }, f: { irony_and_satire: 'h', emotional_heaviness: 'l' } },
  { id: 'story', label: { he: 'עלילה שסוחפת', en: 'A gripping story' }, emoji: '🎢', hint: { he: 'סיפור ברור שמתקדם', en: 'A clear plot that keeps moving' }, f: { plot_vs_mood: 'l', ambiguity_level: 'l' } },
  { id: 'mood', label: { he: 'אווירה, שקט ולאט', en: 'Slow, quiet and moody' }, emoji: '🌙', hint: { he: 'להתמסר לתחושה', en: 'Just sink into the feeling' }, f: { plot_vs_mood: 'h', emotional_restraint: 'h' } },
  { id: 'weird', label: { he: 'משהו מוזר ויוצא דופן', en: 'Something strange and unusual' }, emoji: '🌀', hint: { he: 'חלומי וסוריאליסטי', en: 'Dreamlike and surreal' }, f: { grounded_vs_surreal: 'h' } },
  { id: 'clean', label: { he: 'בלי אלימות ובלי תוכן מיני', en: 'No violence, no sex' }, emoji: '🕊️', hint: { he: 'שקט לצפייה משותפת', en: 'Safe to watch together' }, f: { violence_level: 'l', sexuality_level: 'l' } },
]
