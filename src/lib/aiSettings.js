// Réglages de l'agent IA, persistés en localStorage (petits, non sensibles —
// la clé API ne vit JAMAIS ici : elle reste dans le proxy serverless).
const CLE = 'inspect-oa:ai-settings'

export const MODELES = [
  { id: 'claude-haiku-4-5', label: 'Haiku 4.5 (rapide / économique)' },
  { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6 (équilibré)' },
  { id: 'claude-opus-4-8', label: 'Opus 4.8 (le plus fin)' },
]

const DEFAUTS = {
  proxyUrl: '',
  appToken: '',
  modele: 'claude-haiku-4-5',
  intervalleSec: 2, // une image analysée toutes les N secondes
  maxImages: 20, // plafond du nombre d'images analysées par vidéo
  seuilConfiance: 0.35, // détections sous ce seuil ignorées
}

export function lireReglagesIA() {
  try {
    return { ...DEFAUTS, ...(JSON.parse(localStorage.getItem(CLE)) || {}) }
  } catch {
    return { ...DEFAUTS }
  }
}

export function ecrireReglagesIA(patch) {
  const next = { ...lireReglagesIA(), ...patch }
  localStorage.setItem(CLE, JSON.stringify(next))
  return next
}

export function iaConfiguree() {
  return !!lireReglagesIA().proxyUrl
}
