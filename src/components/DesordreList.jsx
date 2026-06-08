import { couleurCote } from '../data/referentiels.js'
import { formatTemps } from '../lib/exportJSON.js'

export default function DesordreList({ desordres, videos, activeId, onPick, onRemove }) {
  const nomVideo = (id) => videos.find((v) => v.id === id)?.fileName || '—'

  return (
    <div className="desordre-list card">
      <div className="card-head">
        <h3>Désordres relevés ({desordres.length})</h3>
      </div>
      {desordres.length === 0 && <p className="muted">Aucun désordre pour le moment.</p>}
      <ul>
        {desordres.map((d) => (
          <li key={d.id} className={`dl-item ${d.id === activeId ? 'active' : ''}`}>
            <button type="button" className="dl-main" onClick={() => onPick(d)}>
              {d.snapshot ? (
                <img src={d.snapshot} alt="" className="dl-thumb" />
              ) : (
                <span className="dl-thumb placeholder">—</span>
              )}
              <span className="dl-info">
                <span className="dl-title">{d.classif?.typeDesordre || 'Désordre non typé'}</span>
                <span className="dl-sub">
                  {nomVideo(d.videoId)} · {formatTemps(d.t)}
                </span>
                <span className="dl-sub">{d.classif?.partie}</span>
              </span>
              <span className="dl-cote" style={{ background: couleurCote(d.classif?.coteIQOA) }}>
                {d.classif?.coteIQOA || '?'}
              </span>
            </button>
            <button
              type="button"
              className="icon-btn"
              title="Supprimer"
              onClick={() => onRemove(d.id)}
            >
              🗑️
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
