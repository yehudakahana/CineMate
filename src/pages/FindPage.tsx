import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useData } from '../data'
import { BUCKET_LABEL, BUCKET_TARGET, METRICS, MOODS, bucketOf, norm, type Bucket, type MetricKey } from '../metrics'
import { MovieCard } from '../components/Cards'

function parseF(p: string | null): Partial<Record<MetricKey, Bucket>> {
  const out: Partial<Record<MetricKey, Bucket>> = {}
  if (!p) return out
  for (const part of p.split(',')) {
    const [k, b] = part.split('.')
    if (METRICS.some((m) => m.key === k) && (b === 'l' || b === 'm' || b === 'h')) out[k as MetricKey] = b
  }
  return out
}
const PAGE = 24

export default function FindPage() {
  const { movies } = useData()
  const [sp, setSp] = useSearchParams()
  const [adv, setAdv] = useState(false)
  const f = useMemo(() => parseF(sp.get('f')), [sp])
  const shown = Number(sp.get('n')) || PAGE
  const active = METRICS.filter((m) => f[m.key])
  const mood = sp.get('mood')

  const save = (nf: Partial<Record<MetricKey, Bucket>>, moodId: string | null) => {
    const n = new URLSearchParams()
    const s = Object.entries(nf).map(([k, b]) => `${k}.${b}`).join(',')
    if (s) n.set('f', s)
    if (moodId) n.set('mood', moodId)
    setSp(n, { replace: true })
  }

  const { exact, near } = useMemo(() => {
    if (!active.length) return { exact: [], near: [] }
    const rows = movies.map((mv) => {
      let dist = 0, ok = true
      for (const m of active) {
        const i = METRICS.indexOf(m)
        const b = f[m.key]!
        dist += Math.abs(norm(m, mv.values[i]) - BUCKET_TARGET[b])
        if (bucketOf(m, mv.values[i]) !== b) ok = false
      }
      return { mv, dist, ok }
    })
    rows.sort((a, b) => a.dist - b.dist)
    return { exact: rows.filter((r) => r.ok), near: rows.slice(0, 48) }
  }, [movies, f, active])

  const list = exact.length > 0 ? exact : near
  const maxShown = list.length

  return (
    <>
      <section className="hero small-hero">
        <h1>איזה סרט מתאים לכם עכשיו?</h1>
        <p className="lead">בחרו מצב רוח אחד או יותר. אפשר לדייק עוד למטה.</p>
        <div className="moods">
          {MOODS.map((m) => (
            <button key={m.id} className={`mood ${mood === m.id ? 'on' : ''}`} onClick={() => save(mood === m.id ? {} : (m.f as Record<MetricKey, Bucket>), mood === m.id ? null : m.id)} aria-pressed={mood === m.id}>
              <span className="emo" aria-hidden="true">{m.emoji}</span><b>{m.label}</b><small>{m.hint}</small>
            </button>
          ))}
        </div>
        <button className="btn ghost" onClick={() => setAdv((a) => !a)} aria-expanded={adv}>לדייק בעצמי</button>
        {adv && (
          <div className="panel adv-find">
            {METRICS.map((m) => (
              <div key={m.key} className="pick-row">
                <span className="pick-name">{m.name}</span>
                <div className="seg" role="group" aria-label={m.name}>
                  <button aria-pressed={!f[m.key]} className={!f[m.key] ? 'on' : ''} onClick={() => { const n = { ...f }; delete n[m.key]; save(n, null) }}>לא משנה</button>
                  {(['l', 'm', 'h'] as Bucket[]).map((b) => (
                    <button key={b} aria-pressed={f[m.key] === b} className={f[m.key] === b ? 'on' : ''} onClick={() => save({ ...f, [m.key]: b }, null)} title={b === 'l' ? m.low : b === 'h' ? m.high : 'באמצע'}>
                      {b === 'l' ? m.low : b === 'h' ? m.high : BUCKET_LABEL[b]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {active.length > 0 && (
        <section>
          <div className="row-head">
            <h2>{exact.length > 0 ? `${exact.length} סרטים מתאימים` : 'אין התאמה מלאה, אלה הקרובים ביותר'}</h2>
            <button className="btn ghost" onClick={() => save({}, null)}>ניקוי</button>
          </div>
          <p className="muted">מסננים פעילים: {active.map((m) => `${m.name}: ${f[m.key] === 'l' ? m.low : f[m.key] === 'h' ? m.high : 'באמצע'}`).join(' · ')}</p>
          <div className="grid">{list.slice(0, shown).map((r) => <MovieCard key={('mv' in r ? r.mv : r).id} movie={'mv' in r ? r.mv : r} />)}</div>
          {shown < maxShown && <div className="center"><button className="btn" onClick={() => { const n = new URLSearchParams(sp); n.set('n', String(shown + PAGE)); setSp(n, { replace: true }) }}>הצגת עוד</button></div>}
        </section>
      )}
    </>
  )
}
