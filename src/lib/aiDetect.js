import { COTES_IQOA, COTES_EAU, OUVRAGES } from '../data/referentiels.js'
import { uid } from '../state/store.jsx'

const NOM_OUTIL = 'signaler_desordres'

// --- Extraction d'images de la vidéo ----------------------------------------
function attendreSeeked(video) {
  return new Promise((resolve) => {
    const on = () => {
      video.removeEventListener('seeked', on)
      resolve()
    }
    video.addEventListener('seeked', on)
  })
}

// Certains conteneurs (webm/MediaRecorder, flux) annoncent duration = Infinity.
// On force son calcul en cherchant très loin, puis on revient à 0.
async function dureeFiable(video) {
  if (Number.isFinite(video.duration) && video.duration > 0) return video.duration
  await new Promise((resolve) => {
    const fini = () => {
      video.removeEventListener('durationchange', onDur)
      video.removeEventListener('seeked', onSeeked)
      resolve()
    }
    const onDur = () => Number.isFinite(video.duration) && fini()
    const onSeeked = () => {
      video.currentTime = 0
    }
    video.addEventListener('durationchange', onDur)
    video.addEventListener('seeked', onSeeked)
    try {
      video.currentTime = 1e7
    } catch {}
    setTimeout(fini, 1500)
  })
  return Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0
}

// Capture la frame à l'instant t → { t, base64, dataUrl } (JPEG borné en largeur).
async function extraireFrame(video, t, maxW = 768) {
  video.currentTime = Math.min(t, (video.duration || t) - 0.05)
  await attendreSeeked(video)
  const vw = video.videoWidth
  const vh = video.videoHeight
  const ratio = Math.min(1, maxW / vw)
  const w = Math.round(vw * ratio)
  const h = Math.round(vh * ratio)
  const cv = document.createElement('canvas')
  cv.width = w
  cv.height = h
  cv.getContext('2d').drawImage(video, 0, 0, w, h)
  const dataUrl = cv.toDataURL('image/jpeg', 0.7)
  return { t, dataUrl, base64: dataUrl.split(',')[1] }
}

// Dessine la boîte d'un désordre sur une image (dataUrl) → vignette annotée.
function annoterVignette(dataUrl, box, couleur) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const cv = document.createElement('canvas')
      cv.width = img.width
      cv.height = img.height
      const ctx = cv.getContext('2d')
      ctx.drawImage(img, 0, 0)
      if (box) {
        ctx.lineWidth = Math.max(2, Math.round(img.width / 240))
        ctx.strokeStyle = couleur
        ctx.strokeRect(box.x * img.width, box.y * img.height, box.w * img.width, box.h * img.height)
      }
      resolve(cv.toDataURL('image/jpeg', 0.72))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

// --- Construction du prompt système (catalogue) + schéma de l'outil ---------
function construirePromptSysteme(typeOuvrage) {
  const o = OUVRAGES[typeOuvrage] || OUVRAGES.pont
  const classes = COTES_IQOA.map((c) => `- ${c.code} : ${c.description}`).join('\n')
  const desordres = o.desordres
    .map((d) => `- « ${d.libelle} » (${d.famille}) : ${d.description}`)
    .join('\n')
  return [
    `Tu es un inspecteur expert en ouvrages d'art. Tu analyses une image issue d'une vidéo d'inspection par drone d'un ouvrage de type « ${o.label} ».`,
    `Tu appliques les référentiels IQOA / ITSEOA / CEREMA pour repérer et coter les désordres VISIBLES sur l'image.`,
    ``,
    `Parties d'ouvrage possibles : ${o.parties.join(', ')}.`,
    `Matériaux possibles : ${o.materiaux.join(', ')}.`,
    ``,
    `Catalogue des désordres à reconnaître :`,
    desordres,
    ``,
    `Classes de cotation IQOA (gravité) :`,
    classes,
    o.refEau ? `\nCote « eau » (tunnels) : 1 = pas de venue d'eau, 2 = humidité/venues notables, 3 = venues importantes.` : '',
    ``,
    `Règles :`,
    `- Ne signale QUE des désordres réellement visibles. En cas de doute, n'invente rien (renvoie une liste vide).`,
    `- Donne une boîte englobante serrée en coordonnées NORMALISÉES (x, y, largeur, hauteur entre 0 et 1, origine au coin haut-gauche).`,
    `- Choisis le type de désordre, la partie et le matériau dans les listes fournies.`,
    `- Justifie la cote IQOA dans « explication » (en français, 1 à 2 phrases : nature, étendue, gravité).`,
    `- Indique une confiance entre 0 et 1.`,
    `- Réponds UNIQUEMENT via l'outil ${NOM_OUTIL}.`,
  ].join('\n')
}

function construireSchemaOutil(typeOuvrage) {
  const o = OUVRAGES[typeOuvrage] || OUVRAGES.pont
  const item = {
    type: 'object',
    properties: {
      boundingBox: {
        type: 'object',
        description: 'Boîte englobante normalisée 0..1 (origine coin haut-gauche).',
        properties: {
          x: { type: 'number' },
          y: { type: 'number' },
          w: { type: 'number' },
          h: { type: 'number' },
        },
        required: ['x', 'y', 'w', 'h'],
      },
      partie: { type: 'string', enum: o.parties },
      materiau: { type: 'string', enum: o.materiaux },
      typeDesordre: { type: 'string', enum: o.desordres.map((d) => d.libelle) },
      coteIQOA: { type: 'string', enum: COTES_IQOA.map((c) => c.code) },
      explication: { type: 'string' },
      confiance: { type: 'number' },
    },
    required: ['boundingBox', 'typeDesordre', 'coteIQOA', 'explication', 'confiance'],
  }
  if (o.refEau) item.properties.coteEau = { type: 'string', enum: COTES_EAU.map((c) => c.code) }
  return {
    name: NOM_OUTIL,
    description: 'Signale les désordres détectés sur l’image avec leur localisation et leur cotation.',
    input_schema: {
      type: 'object',
      properties: {
        detections: {
          type: 'array',
          description: 'Désordres visibles sur cette image (liste vide si aucun).',
          items: item,
        },
      },
      required: ['detections'],
    },
  }
}

// --- Appel du proxy ----------------------------------------------------------
async function appelerProxy(reglages, body) {
  const headers = { 'content-type': 'application/json' }
  if (reglages.appToken) headers['x-app-token'] = reglages.appToken
  const r = await fetch(reglages.proxyUrl, { method: 'POST', headers, body: JSON.stringify(body) })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(data?.error?.message || data?.error || `Proxy HTTP ${r.status}`)
  return data
}

function extraireDetections(reponse) {
  const bloc = (reponse.content || []).find((b) => b.type === 'tool_use' && b.name === NOM_OUTIL)
  return bloc?.input?.detections || []
}

// --- Analyse complète d'une vidéo -------------------------------------------
// onProgress(fait, total). Renvoie un tableau de Desordre prêts à enregistrer.
export async function analyserVideo({ video, videoId, typeOuvrage, reglages, onProgress, signal }) {
  if (!video) throw new Error('Vidéo non prête')
  const etaitEnLecture = !video.paused
  video.pause()

  const dur = await dureeFiable(video)
  if (!dur) throw new Error('Durée de la vidéo indéterminée')
  const pas = Math.max(0.5, reglages.intervalleSec)
  const times = []
  for (let t = 0; t < dur && times.length < reglages.maxImages; t += pas) times.push(t)

  const systeme = construirePromptSysteme(typeOuvrage)
  const outil = construireSchemaOutil(typeOuvrage)
  const couleurDe = (code) => COTES_IQOA.find((c) => c.code === code)?.couleur || '#d32f2f'

  const desordres = []
  for (let i = 0; i < times.length; i++) {
    if (signal?.aborted) break
    onProgress?.(i, times.length)
    const frame = await extraireFrame(video, times[i])
    const body = {
      model: reglages.modele,
      max_tokens: 1024,
      // Le bloc système (catalogue) est mis en cache : les images suivantes le réutilisent.
      system: [{ type: 'text', text: systeme, cache_control: { type: 'ephemeral' } }],
      tools: [outil],
      tool_choice: { type: 'tool', name: NOM_OUTIL },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: frame.base64 } },
            { type: 'text', text: `Image à l'instant t=${frame.t.toFixed(1)} s. Repère les désordres visibles.` },
          ],
        },
      ],
    }

    let detections = []
    try {
      detections = extraireDetections(await appelerProxy(reglages, body))
    } catch (e) {
      // on remonte l'erreur réseau/proxy (clé manquante, modèle refusé, etc.)
      throw new Error(`Analyse interrompue (image ${i + 1}/${times.length}) : ${e.message}`)
    }

    for (const det of detections) {
      if ((det.confiance ?? 1) < reglages.seuilConfiance) continue
      const box = det.boundingBox
        ? {
            x: clamp01(det.boundingBox.x),
            y: clamp01(det.boundingBox.y),
            w: clamp01(det.boundingBox.w),
            h: clamp01(det.boundingBox.h),
          }
        : null
      const snapshot = await annoterVignette(frame.dataUrl, box, couleurDe(det.coteIQOA))
      desordres.push({
        id: uid('des'),
        videoId,
        t: frame.t,
        box,
        view: { scale: 1, panX: 0, panY: 0 },
        snapshot,
        source: 'ia',
        confiance: det.confiance ?? null,
        classif: {
          referentiel: 'IQOA',
          partie: det.partie || '',
          materiau: det.materiau || '',
          familleDesordre: '',
          typeDesordre: det.typeDesordre || '',
          coteIQOA: det.coteIQOA || '2',
          coteEau: det.coteEau,
          commentaire: det.explication || '',
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    }
  }
  onProgress?.(times.length, times.length)
  if (etaitEnLecture && !signal?.aborted) video.play().catch(() => {})
  return desordres
}

function clamp01(v) {
  return Math.min(1, Math.max(0, Number(v) || 0))
}
