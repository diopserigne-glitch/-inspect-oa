// Export / import de l'inspection au format JSON (sauvegarde & partage).
// La vidéo n'est jamais incluse : seules les métadonnées + désordres le sont.

export function exporterJSON(inspection) {
  const data = { format: 'inspect-oa', version: 1, inspection }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  telecharger(blob, `${slug(inspection?.ouvrage?.nom || 'inspection')}.json`)
}

export function parserJSON(texte) {
  const data = JSON.parse(texte)
  if (data?.format !== 'inspect-oa' || !data.inspection) {
    throw new Error('Fichier non reconnu (format inspect-oa attendu).')
  }
  return data.inspection
}

export function telecharger(blob, nomFichier) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomFichier
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function slug(s) {
  return (s || 'inspection')
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 60) || 'inspection'
}

export function formatTemps(s) {
  s = Math.max(0, Math.floor(s || 0))
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}
