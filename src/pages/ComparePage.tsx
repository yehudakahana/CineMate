import { Link, useParams } from 'react-router-dom'
import { useData } from '../data'
import { useLang } from '../i18n'
import { METRICS, GROUPS, levelWord, norm } from '../metrics'
import { Bar, Poster } from '../components/Cards'

export default function ComparePage() {
  const { a, b } = useParams()
  const { byId } = useData()
  const { lang, t, title, director } = useLang()
  const A = a ? byId.get(a) : undefined
  const B = b ? byId.get(b) : undefined
  if (!A || !B) return <div className="notice big"><h2>{t('אחד הסרטים לא נמצא', 'One of the movies was not found')}</h2><Link className="btn primary" to="/">{t('חזרה לדף הבית', 'Back to home')}</Link></div>

  const rows = METRICS.map((m, i) => {
    const d = Math.abs(norm(m, A.values[i]) - norm(m, B.values[i]))
    return { m, i, d, kind: d < 0.12 ? 'same' : d < 0.34 ? 'near' : 'far' }
  })
  const alike = rows.filter((r) => r.kind !== 'far').length
  const label = { same: t('כמעט זהים', 'Nearly identical'), near: t('קרובים', 'Close'), far: t('שונים', 'Different') }

  return (
    <>
      <p><Link to={`/movie/${A.id}`}>{t(`← חזרה ל"${title(A)}"`, `← Back to "${title(A)}"`)}</Link></p>
      <section className="cmp-head">
        <div><Link to={`/movie/${A.id}`}><Poster movie={A} /></Link><h2>{title(A)}</h2><p className="muted">{A.year} · {director(A)}</p></div>
        <div className="cmp-mid"><span>{t('דומים ב', 'Alike in')}</span><b>{t(`${alike} מתוך 12`, `${alike} of 12`)}</b><span>{t('תכונות', 'traits')}</span></div>
        <div><Link to={`/movie/${B.id}`}><Poster movie={B} /></Link><h2>{title(B)}</h2><p className="muted">{B.year} · {director(B)}</p></div>
      </section>
      <p className="center"><Link className="btn" to={`/compare/${B.id}/${A.id}`}>{t('החלפת צדדים', 'Swap sides')}</Link></p>
      {GROUPS.map((g, gi) => (
        <section key={gi} className="panel">
          <h3>{g[lang]}</h3>
          {rows.filter((r) => r.m.group === gi).map((r) => (
            <div key={r.m.key} className={`cmp-row ${r.kind}`}>
              <div className="cmp-name"><b>{r.m.name[lang]}</b><span className={`tag ${r.kind}`}>{label[r.kind as keyof typeof label]}</span></div>
              <div className="cmp-bars">
                <div><small>{title(A)}: {levelWord(r.m, A.values[r.i], lang)}</small><Bar value={A.values[r.i]} max={r.m.max} color="var(--gold)" /></div>
                <div><small>{title(B)}: {levelWord(r.m, B.values[r.i], lang)}</small><Bar value={B.values[r.i]} max={r.m.max} color="var(--teal)" /></div>
              </div>
              <div className="ends"><span>{r.m.low[lang]}</span><span>{r.m.high[lang]}</span></div>
            </div>
          ))}
        </section>
      ))}
    </>
  )
}
