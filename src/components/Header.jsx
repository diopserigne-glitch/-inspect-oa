import { coteParCode } from '../data/referentiels.js'

export default function Header({ classeGlobale, nbDesordres, onSynthese, onReset }) {
  const cote = coteParCode(classeGlobale)
  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">🛰️</span>
        <div>
          <h1>InspectOA</h1>
          <p className="tagline">Visite virtuelle & cotation des désordres d’ouvrages d’art</p>
        </div>
      </div>
      <div className="header-actions">
        {cote && (
          <span className="classe-badge" style={{ background: cote.couleur }} title={cote.description}>
            Classe globale&nbsp;{cote.code}
          </span>
        )}
        <button className="btn" type="button" onClick={onSynthese}>
          📋 Synthèse ({nbDesordres})
        </button>
        <button className="btn ghost" type="button" onClick={onReset}>
          ↺ Réinitialiser
        </button>
      </div>
    </header>
  )
}
