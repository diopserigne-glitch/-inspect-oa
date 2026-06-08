import { telecharger, slug } from '../lib/exportJSON.js'

export default function VideoResultModal({ result, ouvrageNom, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="card-head">
          <h2>Vidéo annotée</h2>
          <button className="link" type="button" onClick={onClose}>
            ✕ Fermer
          </button>
        </div>
        <p className="hint">
          Vidéo retravaillée : chaque désordre est incrusté au bon instant (cadre + cote + explication
          selon IQOA/ITSEOA/CEREMA), avec l’en-tête de l’ouvrage et la classe globale.
        </p>
        <video className="result-video" src={result.url} controls autoPlay playsInline />
        <div className="synth-actions">
          <button
            className="btn primary"
            type="button"
            onClick={() => telecharger(result.blob, `inspection-annotee-${slug(ouvrageNom)}.webm`)}
          >
            ⬇ Télécharger la vidéo (.webm)
          </button>
        </div>
      </div>
    </div>
  )
}
