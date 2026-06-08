import { useRef } from 'react'

// Couche de tracé de la boîte. Placée À L'INTÉRIEUR du conteneur transformé :
// elle se superpose exactement à la vidéo, donc les coordonnées normalisées
// (0..1) restent valides quel que soit le zoom/pan.
export default function AnnotationOverlay({ active, box, onBoxChange }) {
  const ref = useRef(null)
  const draft = useRef(null)

  const toNorm = (e) => {
    const r = ref.current.getBoundingClientRect()
    return {
      x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
      y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
    }
  }

  const onPointerDown = (e) => {
    if (!active) return
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = toNorm(e)
    draft.current = { x0: p.x, y0: p.y }
    onBoxChange({ x: p.x, y: p.y, w: 0, h: 0 })
  }

  const onPointerMove = (e) => {
    if (!active || !draft.current) return
    const p = toNorm(e)
    const { x0, y0 } = draft.current
    onBoxChange({
      x: Math.min(x0, p.x),
      y: Math.min(y0, p.y),
      w: Math.abs(p.x - x0),
      h: Math.abs(p.y - y0),
    })
  }

  const onPointerUp = (e) => {
    if (!active) return
    draft.current = null
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}
  }

  return (
    <div
      ref={ref}
      className={`annot-overlay ${active ? 'active' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {box && box.w > 0 && box.h > 0 && (
        <div
          className="annot-box"
          style={{
            left: `${box.x * 100}%`,
            top: `${box.y * 100}%`,
            width: `${box.w * 100}%`,
            height: `${box.h * 100}%`,
          }}
        />
      )}
    </div>
  )
}
