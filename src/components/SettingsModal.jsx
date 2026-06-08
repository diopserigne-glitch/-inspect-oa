import { useState } from 'react'
import { MODELES } from '../lib/aiSettings.js'

export default function SettingsModal({ reglages, onSave, onClose }) {
  const [r, setR] = useState(reglages)
  const set = (patch) => setR((x) => ({ ...x, ...patch }))

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal small" onClick={(e) => e.stopPropagation()}>
        <div className="card-head">
          <h2>Réglages de l’agent IA</h2>
          <button className="link" type="button" onClick={onClose}>
            ✕ Fermer
          </button>
        </div>

        <p className="hint">
          La détection automatique envoie des images de la vidéo à Claude via votre <strong>proxy
          serverless</strong> (qui détient la clé API). Renseignez l’URL du proxy déployé
          (Cloudflare Worker — voir <code>worker/</code>). La clé API ne transite jamais par le
          navigateur.
        </p>

        <label className="field">
          <span>URL du proxy</span>
          <input
            type="url"
            value={r.proxyUrl}
            placeholder="https://inspectoa-proxy.votre-compte.workers.dev"
            onChange={(e) => set({ proxyUrl: e.target.value.trim() })}
          />
        </label>

        <label className="field">
          <span>Jeton partagé (optionnel)</span>
          <input
            type="text"
            value={r.appToken}
            placeholder="si APP_TOKEN défini côté worker"
            onChange={(e) => set({ appToken: e.target.value.trim() })}
          />
        </label>

        <div className="field-2">
          <label className="field">
            <span>Modèle</span>
            <select value={r.modele} onChange={(e) => set({ modele: e.target.value })}>
              {MODELES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Intervalle (s/image)</span>
            <input
              type="number"
              min={0.5}
              step={0.5}
              value={r.intervalleSec}
              onChange={(e) => set({ intervalleSec: parseFloat(e.target.value) || 2 })}
            />
          </label>
        </div>

        <div className="field-2">
          <label className="field">
            <span>Images max / vidéo</span>
            <input
              type="number"
              min={1}
              max={8 * 60}
              value={r.maxImages}
              onChange={(e) => set({ maxImages: parseInt(e.target.value) || 20 })}
            />
          </label>
          <label className="field">
            <span>Seuil de confiance</span>
            <input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={r.seuilConfiance}
              onChange={(e) => set({ seuilConfiance: parseFloat(e.target.value) || 0 })}
            />
          </label>
        </div>

        <label className="field-check">
          <input
            type="checkbox"
            checked={r.autoAnalyse}
            onChange={(e) => set({ autoAnalyse: e.target.checked })}
          />
          <span>Analyser automatiquement à l’ouverture d’une vidéo</span>
        </label>

        <div className="form-actions">
          <button className="btn ghost" type="button" onClick={onClose}>
            Annuler
          </button>
          <button className="btn primary" type="button" onClick={() => onSave(r)}>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}
