// Signature stable d'un fichier vidéo : permet de ré-attacher une vidéo
// (re-sélectionnée par l'utilisateur) aux désordres déjà enregistrés, sans
// stocker le fichier lui-même (trop volumineux pour le navigateur).
export function signatureFromMeta(fileName, size, duration) {
  const dur = Math.round((duration || 0) * 10) / 10
  return `${fileName}|${size}|${dur}`
}

// Lit la durée d'un fichier vidéo via un élément <video> hors écran.
export function lireDureeVideo(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.onloadedmetadata = () => {
      const d = v.duration
      URL.revokeObjectURL(url)
      resolve(Number.isFinite(d) ? d : 0)
    }
    v.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Impossible de lire la vidéo'))
    }
    v.src = url
  })
}

// Construit l'objet VideoMeta + un objet runtime (file + url) à partir d'un File.
export async function fichierVersVideo(file, idGen) {
  const duration = await lireDureeVideo(file)
  const signature = signatureFromMeta(file.name, file.size, duration)
  const meta = {
    id: idGen(),
    fileName: file.name,
    size: file.size,
    duration,
    signature,
  }
  return { meta, runtime: { file, url: URL.createObjectURL(file) } }
}
