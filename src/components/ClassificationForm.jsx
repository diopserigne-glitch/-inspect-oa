import { useEffect } from 'react'
import {
  COTES_EAU,
  COTES_IQOA,
  OUVRAGES,
  REFERENTIELS,
  coteParCode,
  desordreParCode,
  desordresPour,
  famillesPour,
} from '../data/referentiels.js'
import { formatTemps } from '../lib/exportJSON.js'

export default function ClassificationForm({ editor, typeOuvrage, onChange, onSave, onCancel, hasBox }) {
  const o = OUVRAGES[typeOuvrage] || OUVRAGES.pont
  const c = editor.classif
  const set = (patch) => onChange({ ...c, ...patch })

  const familles = famillesPour(typeOuvrage)
  const desordres = desordresPour(typeOuvrage, c.familleDesordre)
  const desordreCourant = desordreParCode(typeOuvrage, c.typeDesordre)
  const cote = coteParCode(c.coteIQOA)

  // Si le type d'ouvrage gère la cote eau et qu'elle n'est pas définie, l'initialiser.
  useEffect(() => {
    if (o.refEau && !c.coteEau) set({ coteEau: '1' })
    if (!o.refEau && c.coteEau) set({ coteEau: undefined })
  }, [o.refEau]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="classify card">
      <div className="card-head">
        <h3>{editor.id ? 'Modifier le désordre' : 'Classer le désordre'}</h3>
        <span className="t-chip">⏱ {formatTemps(editor.t)}</span>
      </div>

      {!hasBox && (
        <p className="warn-line">Tracez un cadre sur le désordre dans l’image (cliquez-glissez).</p>
      )}

      <label className="field">
        <span>Référentiel</span>
        <select value={c.referentiel} onChange={(e) => set({ referentiel: e.target.value })}>
          {REFERENTIELS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>

      <div className="field-2">
        <label className="field">
          <span>Partie d’ouvrage</span>
          <select value={c.partie} onChange={(e) => set({ partie: e.target.value })}>
            {o.parties.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Matériau</span>
          <select value={c.materiau} onChange={(e) => set({ materiau: e.target.value })}>
            {o.materiaux.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="field-2">
        <label className="field">
          <span>Famille de désordre</span>
          <select
            value={c.familleDesordre}
            onChange={(e) => set({ familleDesordre: e.target.value, typeDesordre: '' })}
          >
            <option value="">— Toutes —</option>
            {familles.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Type de désordre</span>
          <select value={c.typeDesordre} onChange={(e) => set({ typeDesordre: e.target.value })}>
            <option value="">— À sélectionner —</option>
            {desordres.map((d) => (
              <option key={d.code} value={d.libelle}>
                {d.libelle}
              </option>
            ))}
          </select>
        </label>
      </div>

      {desordreCourant && (
        <p className="desordre-desc">
          {desordreCourant.description}
          <span className="ref-tag">{desordreCourant.refITSEOA}</span>
        </p>
      )}

      <label className="field">
        <span>Cote IQOA (gravité)</span>
        <div className="cote-pills">
          {COTES_IQOA.map((ct) => (
            <button
              key={ct.code}
              type="button"
              className={`cote-pill ${c.coteIQOA === ct.code ? 'on' : ''}`}
              style={c.coteIQOA === ct.code ? { background: ct.couleur, borderColor: ct.couleur } : {}}
              onClick={() => set({ coteIQOA: ct.code })}
              title={ct.description}
            >
              {ct.code}
            </button>
          ))}
        </div>
      </label>
      {cote && <p className="cote-desc">{cote.description}</p>}

      {o.refEau && (
        <label className="field">
          <span>Cote « eau »</span>
          <select value={c.coteEau || '1'} onChange={(e) => set({ coteEau: e.target.value })}>
            {COTES_EAU.map((ce) => (
              <option key={ce.code} value={ce.code}>
                {ce.libelle}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="field">
        <span>Commentaire</span>
        <textarea
          rows={3}
          value={c.commentaire}
          placeholder="Localisation précise, étendue, évolution, recommandation…"
          onChange={(e) => set({ commentaire: e.target.value })}
        />
      </label>

      <div className="form-actions">
        <button className="btn ghost" type="button" onClick={onCancel}>
          Annuler
        </button>
        <button className="btn primary" type="button" onClick={onSave}>
          {editor.id ? 'Enregistrer' : 'Ajouter le désordre'}
        </button>
      </div>
    </div>
  )
}
