import { useRef } from 'react'
import { COTES_IQOA, OUVRAGES, coteParCode, couleurCote } from '../data/referentiels.js'
import { exporterJSON, parserJSON, formatTemps } from '../lib/exportJSON.js'
import { exporterPDF } from '../lib/exportPDF.js'

export default function SynthesePanel({ inspection, classeGlobale, onClose, onImport }) {
  const importRef = useRef(null)
  const { ouvrage, desordres } = inspection
  const cote = coteParCode(classeGlobale)
  const nomVideo = (id) => inspection.videos.find((v) => v.id === id)?.fileName || '—'

  const compteurs = COTES_IQOA.map((c) => ({
    ...c,
    n: desordres.filter((d) => d.classif?.coteIQOA === c.code).length,
  }))

  const doImport = async (e) => {
    const file = (e.target.files || [])[0]
    if (!file) return
    try {
      const insp = parserJSON(await file.text())
      onImport(insp)
    } catch (err) {
      alert(`Import impossible : ${err.message}`)
    }
    e.target.value = ''
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="card-head">
          <h2>Synthèse de l’inspection</h2>
          <button className="link" type="button" onClick={onClose}>
            ✕ Fermer
          </button>
        </div>

        <div className="synth-head">
          <div>
            <div className="synth-ouvrage">{ouvrage.nom || 'Ouvrage sans nom'}</div>
            <div className="muted">
              {OUVRAGES[ouvrage.typeOuvrage]?.label} · {ouvrage.localisation || 'localisation ?'} ·{' '}
              {inspection.dateVisite}
            </div>
          </div>
          {cote ? (
            <div className="synth-classe" style={{ background: cote.couleur }}>
              <span>Classe globale (pire cas)</span>
              <strong>{cote.code}</strong>
            </div>
          ) : (
            <div className="synth-classe none">Aucun désordre coté</div>
          )}
        </div>

        <div className="synth-counters">
          {compteurs.map((c) => (
            <div key={c.code} className="counter" style={{ borderColor: c.couleur }}>
              <span className="counter-n" style={{ color: c.couleur }}>
                {c.n}
              </span>
              <span className="counter-l">Classe {c.code}</span>
            </div>
          ))}
        </div>

        <div className="synth-table-wrap">
          <table className="synth-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Vue</th>
                <th>Vidéo / temps</th>
                <th>Désordre</th>
                <th>Partie / matériau</th>
                <th>Cote</th>
                <th>Commentaire</th>
              </tr>
            </thead>
            <tbody>
              {desordres.length === 0 && (
                <tr>
                  <td colSpan={7} className="muted">
                    Aucun désordre relevé.
                  </td>
                </tr>
              )}
              {desordres.map((d, i) => (
                <tr key={d.id}>
                  <td>{i + 1}</td>
                  <td>{d.snapshot ? <img className="st-thumb" src={d.snapshot} alt="" /> : '—'}</td>
                  <td>
                    {nomVideo(d.videoId)}
                    <br />
                    <span className="muted">{formatTemps(d.t)}</span>
                  </td>
                  <td>{d.classif?.typeDesordre || '—'}</td>
                  <td>
                    {d.classif?.partie}
                    <br />
                    <span className="muted">{d.classif?.materiau}</span>
                  </td>
                  <td>
                    <span className="st-cote" style={{ background: couleurCote(d.classif?.coteIQOA) }}>
                      {d.classif?.coteIQOA || '?'}
                    </span>
                  </td>
                  <td className="st-comment">{d.classif?.commentaire}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="synth-actions">
          <button className="btn" type="button" onClick={() => importRef.current?.click()}>
            ⬆ Importer (JSON)
          </button>
          <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={doImport} />
          <button className="btn" type="button" onClick={() => exporterJSON(inspection)}>
            ⬇ Exporter (JSON)
          </button>
          <button
            className="btn primary"
            type="button"
            disabled={desordres.length === 0}
            onClick={() => exporterPDF(inspection, classeGlobale, nomVideo)}
          >
            📄 Exporter le PV (PDF)
          </button>
        </div>
      </div>
    </div>
  )
}
