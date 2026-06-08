import { couleurCote } from '../data/referentiels.js'

// Capture la frame courante d'un <video> dans un canvas, dessine la boîte du
// désordre (coords normalisées 0..1) et renvoie un JPEG dataURL réduit.
// maxW borne la largeur pour garder des vignettes légères (stockage IndexedDB).
export function capturerVignette(video, box, coteCode, maxW = 640) {
  const vw = video.videoWidth
  const vh = video.videoHeight
  if (!vw || !vh) return null

  const ratio = Math.min(1, maxW / vw)
  const w = Math.round(vw * ratio)
  const h = Math.round(vh * ratio)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.drawImage(video, 0, 0, w, h)

  if (box && box.w > 0 && box.h > 0) {
    const bx = box.x * w
    const by = box.y * h
    const bw = box.w * w
    const bh = box.h * h
    ctx.lineWidth = Math.max(2, Math.round(w / 240))
    ctx.strokeStyle = couleurCote(coteCode)
    ctx.strokeRect(bx, by, bw, bh)
    // léger voile sombre hors de la boîte pour faire ressortir le désordre
    ctx.save()
    ctx.fillStyle = 'rgba(0,0,0,0.28)'
    ctx.beginPath()
    ctx.rect(0, 0, w, h)
    ctx.rect(bx, by, bw, bh)
    ctx.fill('evenodd')
    ctx.restore()
  }

  return canvas.toDataURL('image/jpeg', 0.72)
}
