import { couleurCote } from '../data/referentiels.js'
import { formatTemps } from '../lib/exportJSON.js'

export default function Timeline({ duration, currentTime, desordres, onSeek, onPickDesordre }) {
  const dur = duration || 0
  const pct = (t) => (dur ? `${(t / dur) * 100}%` : '0%')

  const onClickBar = (e) => {
    if (!dur) return
    const r = e.currentTarget.getBoundingClientRect()
    onSeek(((e.clientX - r.left) / r.width) * dur)
  }

  return (
    <div className="timeline">
      <div className="tl-track" onClick={onClickBar}>
        <div className="tl-progress" style={{ width: pct(currentTime) }} />
        {desordres.map((d) => (
          <button
            key={d.id}
            type="button"
            className="tl-marker"
            style={{ left: pct(d.t), background: couleurCote(d.classif?.coteIQOA) }}
            title={`${formatTemps(d.t)} — ${d.classif?.typeDesordre || 'désordre'} (cote ${d.classif?.coteIQOA || '?'})`}
            onClick={(e) => {
              e.stopPropagation()
              onPickDesordre(d)
            }}
          />
        ))}
      </div>
      <div className="tl-legend">
        {desordres.length === 0
          ? 'Aucun désordre marqué sur cette vidéo.'
          : `${desordres.length} désordre(s) sur cette vidéo — cliquez un repère pour y revenir.`}
      </div>
    </div>
  )
}
