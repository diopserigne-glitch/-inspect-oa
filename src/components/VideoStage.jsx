import { useEffect, useRef } from 'react'
import AnnotationOverlay from './AnnotationOverlay.jsx'

const SCALE_MIN = 1
const SCALE_MAX = 8

function clamp(v, a, b) {
  return Math.min(b, Math.max(a, v))
}

export default function VideoStage({
  videoRef,
  runtime,
  view,
  setView,
  drawing,
  box,
  onBoxChange,
  onLoadedMeta,
  onTimeUpdate,
  onPlayState,
}) {
  const viewportRef = useRef(null)
  const pan = useRef(null) // état de déplacement en cours

  // Borne le déplacement pour garder l'image visible.
  const clampPan = (panX, panY, scale) => {
    const r = viewportRef.current?.getBoundingClientRect()
    if (!r) return { panX, panY }
    const maxX = ((scale - 1) * r.width) / 2
    const maxY = ((scale - 1) * r.height) / 2
    return { panX: clamp(panX, -maxX, maxX), panY: clamp(panY, -maxY, maxY) }
  }

  const onWheel = (e) => {
    if (!runtime) return
    e.preventDefault()
    const r = viewportRef.current.getBoundingClientRect()
    const cx = e.clientX - r.left - r.width / 2
    const cy = e.clientY - r.top - r.height / 2
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15
    const newScale = clamp(view.scale * factor, SCALE_MIN, SCALE_MAX)
    const k = newScale / view.scale
    let panX = cx - k * (cx - view.panX)
    let panY = cy - k * (cy - view.panY)
    if (newScale === 1) {
      panX = 0
      panY = 0
    }
    const c = clampPan(panX, panY, newScale)
    setView({ scale: newScale, ...c })
  }

  // Déplacement (pan) : actif uniquement hors mode dessin et si zoomé.
  const onPointerDown = (e) => {
    if (drawing || view.scale <= 1 || !runtime) return
    viewportRef.current.setPointerCapture(e.pointerId)
    pan.current = { sx: e.clientX, sy: e.clientY, panX: view.panX, panY: view.panY }
  }
  const onPointerMove = (e) => {
    if (!pan.current) return
    const dx = e.clientX - pan.current.sx
    const dy = e.clientY - pan.current.sy
    const c = clampPan(pan.current.panX + dx, pan.current.panY + dy, view.scale)
    setView((v) => ({ ...v, ...c }))
  }
  const onPointerUp = (e) => {
    pan.current = null
    try {
      viewportRef.current.releasePointerCapture(e.pointerId)
    } catch {}
  }

  // (Re)charge la source vidéo quand le runtime change.
  useEffect(() => {
    const v = videoRef.current
    if (v && runtime) {
      v.src = runtime.url
      v.load()
    }
  }, [runtime, videoRef])

  const transform = `translate(${view.panX}px, ${view.panY}px) scale(${view.scale})`
  const cursor = drawing ? 'crosshair' : view.scale > 1 ? 'grab' : 'default'

  return (
    <div
      className="video-viewport"
      ref={viewportRef}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{ cursor }}
    >
      {!runtime && (
        <div className="video-empty">
          <p>Aucune vidéo sélectionnée.</p>
          <p className="muted">Chargez une vidéo d’inspection drone ci-dessus pour démarrer la visite.</p>
        </div>
      )}
      <div className="video-transform" style={{ transform, visibility: runtime ? 'visible' : 'hidden' }}>
        <video
          ref={videoRef}
          className="video-el"
          playsInline
          onLoadedMetadata={(e) => onLoadedMeta(e.currentTarget.duration || 0)}
          onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
          onPlay={() => onPlayState(true)}
          onPause={() => onPlayState(false)}
        />
        <AnnotationOverlay active={drawing} box={box} onBoxChange={onBoxChange} />
      </div>

      {view.scale > 1 && <div className="zoom-tag">×{view.scale.toFixed(1)}</div>}
    </div>
  )
}
