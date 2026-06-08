import { couleurCote, coteParCode, OUVRAGES } from '../data/referentiels.js'
import { formatTemps } from './exportJSON.js'

// Coerce une durée finie (certains conteneurs annoncent Infinity).
async function dureeFiable(video) {
  if (Number.isFinite(video.duration) && video.duration > 0) return video.duration
  await new Promise((resolve) => {
    const fini = () => {
      video.removeEventListener('durationchange', onDur)
      resolve()
    }
    const onDur = () => Number.isFinite(video.duration) && fini()
    video.addEventListener('durationchange', onDur)
    try {
      video.currentTime = 1e7
    } catch {}
    setTimeout(fini, 1500)
  })
  try {
    video.currentTime = 0
  } catch {}
  return Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0
}

function choisirMime() {
  const candidats = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
  return candidats.find((t) => MediaRecorder.isTypeSupported(t)) || 'video/webm'
}

function wrap(ctx, texte, maxW) {
  const mots = (texte || '').split(/\s+/)
  const lignes = []
  let ligne = ''
  for (const m of mots) {
    const test = ligne ? `${ligne} ${m}` : m
    if (ctx.measureText(test).width > maxW && ligne) {
      lignes.push(ligne)
      ligne = m
    } else ligne = test
  }
  if (ligne) lignes.push(ligne)
  return lignes
}

// Incruste les annotations sur le contexte canvas pour l'instant courant.
function dessinerOverlays(ctx, W, H, t, desordres, ouvrage, classeGlobale) {
  const pad = Math.round(W * 0.012)

  // En-tête : ouvrage + classe globale
  const hH = Math.round(H * 0.08)
  ctx.fillStyle = 'rgba(14,58,95,0.82)'
  ctx.fillRect(0, 0, W, hH)
  ctx.fillStyle = '#fff'
  ctx.font = `600 ${Math.round(hH * 0.34)}px system-ui, sans-serif`
  ctx.textBaseline = 'middle'
  ctx.fillText(ouvrage?.nom || 'Ouvrage', pad, hH * 0.36)
  ctx.font = `${Math.round(hH * 0.24)}px system-ui, sans-serif`
  ctx.fillStyle = '#c7d6e5'
  ctx.fillText(
    `${OUVRAGES[ouvrage?.typeOuvrage]?.label || ''} — InspectOA · IQOA/ITSEOA/CEREMA`,
    pad,
    hH * 0.72
  )
  if (classeGlobale) {
    const c = coteParCode(classeGlobale)
    const label = `Classe ${classeGlobale}`
    ctx.font = `700 ${Math.round(hH * 0.3)}px system-ui, sans-serif`
    const tw = ctx.measureText(label).width + pad * 2
    ctx.fillStyle = c?.couleur || '#d32f2f'
    ctx.fillRect(W - tw - pad, hH * 0.2, tw, hH * 0.6)
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'center'
    ctx.fillText(label, W - tw / 2 - pad, hH * 0.5)
    ctx.textAlign = 'left'
  }

  // Désordres actifs à l'instant t
  const actifs = desordres
    .filter((d) => Math.abs(d.t - t) <= 0.6)
    .sort((a, b) => Math.abs(a.t - t) - Math.abs(b.t - t))

  for (const d of actifs) {
    if (!d.box || d.box.w <= 0) continue
    const col = couleurCote(d.classif?.coteIQOA)
    const x = d.box.x * W
    const y = d.box.y * H
    const bw = d.box.w * W
    const bh = d.box.h * H
    ctx.lineWidth = Math.max(2, Math.round(W / 320))
    ctx.strokeStyle = col
    ctx.strokeRect(x, y, bw, bh)
    // étiquette
    const fs = Math.round(H * 0.026)
    ctx.font = `600 ${fs}px system-ui, sans-serif`
    const label = `${d.classif?.typeDesordre || 'désordre'} · ${d.classif?.coteIQOA || ''}`
    const lw = ctx.measureText(label).width + 10
    const ly = Math.max(0, y - fs - 6)
    ctx.fillStyle = col
    ctx.fillRect(x, ly, lw, fs + 6)
    ctx.fillStyle = '#fff'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, x + 5, ly + (fs + 6) / 2)
  }

  // Bandeau d'explication (désordre le plus proche)
  const principal = actifs[0]
  if (principal) {
    const col = couleurCote(principal.classif?.coteIQOA)
    const fs = Math.round(H * 0.028)
    ctx.font = `${fs}px system-ui, sans-serif`
    const texte = `${principal.classif?.typeDesordre || 'Désordre'}${
      principal.classif?.commentaire ? ' — ' + principal.classif.commentaire : ''
    }`
    const maxTextW = W - pad * 4 - Math.round(H * 0.07)
    const lignes = wrap(ctx, texte, maxTextW).slice(0, 3)
    const bH = pad * 2 + lignes.length * (fs + 4) + fs
    const bY = H - bH - pad
    ctx.fillStyle = 'rgba(10,16,24,0.85)'
    ctx.fillRect(pad, bY, W - pad * 2, bH)
    // pastille cote
    const badge = Math.round(H * 0.05)
    ctx.fillStyle = col
    ctx.fillRect(pad * 2, bY + pad, badge, badge)
    ctx.fillStyle = '#fff'
    ctx.font = `700 ${Math.round(badge * 0.5)}px system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(principal.classif?.coteIQOA || '?', pad * 2 + badge / 2, bY + pad + badge / 2)
    ctx.textAlign = 'left'
    // texte
    ctx.fillStyle = '#9fb4c8'
    ctx.font = `${Math.round(fs * 0.8)}px system-ui, sans-serif`
    ctx.fillText(`⏱ ${formatTemps(principal.t)}  ·  ${principal.source === 'ia' ? 'détecté par IA' : 'relevé manuel'}`, pad * 2 + badge + pad, bY + pad + fs * 0.5)
    ctx.fillStyle = '#fff'
    ctx.font = `${fs}px system-ui, sans-serif`
    lignes.forEach((l, i) => {
      ctx.fillText(l, pad * 2 + badge + pad, bY + pad + fs * 1.6 + i * (fs + 4))
    })
  }
}

// Génère une vidéo annotée (webm) rejouable. Rendu en temps réel (≈ durée de la vidéo).
export async function genererVideoAnnotee({
  video,
  desordres,
  ouvrage,
  classeGlobale,
  fps = 30,
  maxW = 1280,
  onProgress,
  signal,
}) {
  if (!video) throw new Error('Vidéo non prête')
  const dur = await dureeFiable(video)
  const vw = video.videoWidth
  const vh = video.videoHeight
  if (!vw || !vh) throw new Error('Dimensions vidéo inconnues')

  const ratio = Math.min(1, maxW / vw)
  const W = Math.round(vw * ratio)
  const H = Math.round(vh * ratio)
  const cv = document.createElement('canvas')
  cv.width = W
  cv.height = H
  const ctx = cv.getContext('2d')

  const stream = cv.captureStream(fps)
  const mimeType = choisirMime()
  const rec = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 5_000_000 })
  const chunks = []
  rec.ondataavailable = (e) => e.data && e.data.size && chunks.push(e.data)
  const stopped = new Promise((r) => (rec.onstop = r))

  video.muted = true
  video.pause()
  // Remet proprement au début (le coerce-durée a pu placer la tête en fin).
  await new Promise((res) => {
    if (Math.abs(video.currentTime) < 0.05) return res()
    const on = () => {
      video.removeEventListener('seeked', on)
      res()
    }
    video.addEventListener('seeked', on)
    try {
      video.currentTime = 0
    } catch {
      res()
    }
  })

  // Dessine une première image avant de démarrer l'enregistrement.
  ctx.drawImage(video, 0, 0, W, H)
  dessinerOverlays(ctx, W, H, 0, desordres, ouvrage, classeGlobale)

  rec.start(200)
  await video.play().catch(() => {})

  // Boucle rAF : met à jour le canvas en continu (capture fiable) jusqu'à la fin.
  await new Promise((resolve) => {
    let stop = false
    const finish = () => {
      if (stop) return
      stop = true
      clearTimeout(safety)
      resolve()
    }
    video.addEventListener('ended', finish, { once: true })
    const safety = setTimeout(finish, (dur + 3) * 1000)
    const loop = () => {
      if (stop) return
      if (signal?.aborted) return finish()
      ctx.drawImage(video, 0, 0, W, H)
      dessinerOverlays(ctx, W, H, video.currentTime, desordres, ouvrage, classeGlobale)
      onProgress?.(video.currentTime, dur)
      if (video.ended || video.paused) return finish()
      requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
  })

  await new Promise((r) => setTimeout(r, 250)) // laisse le dernier chunk se flusher
  rec.stop()
  await stopped
  video.pause()
  try {
    video.currentTime = 0
  } catch {}

  const blob = new Blob(chunks, { type: mimeType })
  return { blob, url: URL.createObjectURL(blob), mimeType }
}
