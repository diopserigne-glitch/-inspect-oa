import { useRef, useState } from 'react'
import { TYPES_OUVRAGE } from '../data/referentiels.js'
import { formatTemps } from '../lib/exportJSON.js'

export default function InspectionSetup({
  inspection,
  activeVideoId,
  onSelectVideo,
  onAddVideos,
  getRuntime,
  onSetOuvrage,
  onSetMeta,
  onRemoveVideo,
  onReattach,
}) {
  const [open, setOpen] = useState(true)
  const fileRef = useRef(null)
  const reattachRef = useRef(null)
  const [reattachId, setReattachId] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const { ouvrage } = inspection

  const pickFiles = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length) onAddVideos(files)
    e.target.value = ''
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files || []).filter((f) => f.type.startsWith('video/'))
    if (files.length) onAddVideos(files)
  }

  const doReattach = (e) => {
    const file = (e.target.files || [])[0]
    if (file && reattachId) onReattach(reattachId, file)
    setReattachId(null)
    e.target.value = ''
  }

  return (
    <section className="setup card">
      <div className="card-head">
        <h2>Ouvrage & vidéos d’inspection</h2>
        <button className="link" type="button" onClick={() => setOpen((o) => !o)}>
          {open ? 'Réduire ▲' : 'Déplier ▼'}
        </button>
      </div>

      {open && (
        <div className="setup-grid">
          <label className="field">
            <span>Nom de l’ouvrage</span>
            <input
              type="text"
              value={ouvrage.nom}
              placeholder="ex : Pont sur la Falémé"
              onChange={(e) => onSetOuvrage({ nom: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Type d’ouvrage</span>
            <select value={ouvrage.typeOuvrage} onChange={(e) => onSetOuvrage({ typeOuvrage: e.target.value })}>
              {TYPES_OUVRAGE.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Localisation</span>
            <input
              type="text"
              value={ouvrage.localisation}
              placeholder="ex : RN1 PK 124, région de Tamba"
              onChange={(e) => onSetOuvrage({ localisation: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Gestionnaire</span>
            <input
              type="text"
              value={ouvrage.gestionnaire}
              placeholder="ex : AGEROUTE"
              onChange={(e) => onSetOuvrage({ gestionnaire: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Date de visite</span>
            <input
              type="date"
              value={inspection.dateVisite}
              onChange={(e) => onSetMeta({ dateVisite: e.target.value })}
            />
          </label>

          <div
            className={`dropzone ${dragOver ? 'over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
          >
            <strong>📹 Charger des vidéos drone</strong>
            <span>Glissez-déposez ou cliquez (mp4, webm, mov…)</span>
            <input ref={fileRef} type="file" accept="video/*" multiple hidden onChange={pickFiles} />
          </div>

          {inspection.videos.length > 0 && (
            <div className="video-list">
              {inspection.videos.map((v) => {
                const dispo = !!getRuntime(v.id)
                return (
                  <div
                    key={v.id}
                    className={`video-item ${v.id === activeVideoId ? 'active' : ''} ${dispo ? '' : 'absent'}`}
                  >
                    <button
                      type="button"
                      className="video-pick"
                      disabled={!dispo}
                      onClick={() => dispo && onSelectVideo(v.id)}
                      title={dispo ? 'Lire cette vidéo' : 'Fichier non chargé — re-sélectionnez-le'}
                    >
                      <span className="video-name">{v.fileName}</span>
                      <span className="video-meta">{formatTemps(v.duration)}</span>
                    </button>
                    {!dispo && (
                      <button
                        type="button"
                        className="link"
                        onClick={() => {
                          setReattachId(v.id)
                          reattachRef.current?.click()
                        }}
                      >
                        Re-sélectionner
                      </button>
                    )}
                    <button
                      type="button"
                      className="icon-btn"
                      title="Retirer la vidéo (et ses désordres)"
                      onClick={() => {
                        if (confirm(`Retirer ${v.fileName} et ses désordres ?`)) onRemoveVideo(v.id)
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                )
              })}
              <input ref={reattachRef} type="file" accept="video/*" hidden onChange={doReattach} />
            </div>
          )}
        </div>
      )}
    </section>
  )
}
