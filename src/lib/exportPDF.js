import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { coteParCode, couleurCote, OUVRAGES } from '../data/referentiels.js'
import { formatTemps, slug } from './exportJSON.js'

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '')
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [144, 164, 174]
}

// Génère un PV de visite PDF : en-tête ouvrage, classe globale, tableau des
// désordres avec vignettes.
export function exporterPDF(inspection, classeGlobale, fileNameById) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const ouvrage = inspection.ouvrage || {}
  const pageW = doc.internal.pageSize.getWidth()

  // En-tête
  doc.setFillColor(14, 58, 95)
  doc.rect(0, 0, pageW, 26, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.text('PV de visite — Inspection d’ouvrage d’art', 12, 12)
  doc.setFontSize(9)
  doc.text('InspectOA — cotation IQOA / ITSEOA / CEREMA', 12, 19)

  doc.setTextColor(30, 30, 30)
  doc.setFontSize(10)
  let y = 34
  const ligne = (label, val) => {
    doc.setFont(undefined, 'bold')
    doc.text(`${label} :`, 12, y)
    doc.setFont(undefined, 'normal')
    doc.text(String(val || '—'), 48, y)
    y += 6
  }
  ligne('Ouvrage', ouvrage.nom)
  ligne('Type', OUVRAGES[ouvrage.typeOuvrage]?.label || ouvrage.typeOuvrage)
  ligne('Localisation', ouvrage.localisation)
  ligne('Gestionnaire', ouvrage.gestionnaire)
  ligne('Date de visite', inspection.dateVisite)

  // Classe globale
  if (classeGlobale) {
    const c = coteParCode(classeGlobale)
    const [r, g, b] = hexToRgb(c?.couleur)
    doc.setFillColor(r, g, b)
    doc.roundedRect(pageW - 90, 32, 78, 16, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.text('Classe globale (pire cas)', pageW - 86, 38)
    doc.setFontSize(15)
    doc.setFont(undefined, 'bold')
    doc.text(c?.libelle?.split('—')[0]?.trim() || classeGlobale, pageW - 86, 45)
    doc.setFont(undefined, 'normal')
    doc.setTextColor(30, 30, 30)
  }

  const desordres = inspection.desordres || []
  const body = desordres.map((d, i) => [
    String(i + 1),
    fileNameById(d.videoId) || '—',
    formatTemps(d.t),
    d.classif?.typeDesordre || '—',
    `${d.classif?.partie || '—'} / ${d.classif?.materiau || '—'}`,
    d.classif?.coteIQOA || '—',
    d.classif?.commentaire || '',
    '', // colonne image (remplie par didDrawCell)
  ])

  autoTable(doc, {
    startY: Math.max(y, 52),
    head: [['#', 'Vidéo', 'Temps', 'Désordre', 'Partie / matériau', 'Cote', 'Commentaire', 'Vue']],
    body,
    styles: { fontSize: 8, valign: 'middle', cellPadding: 1.5 },
    headStyles: { fillColor: [14, 58, 95] },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 38 },
      2: { cellWidth: 14 },
      3: { cellWidth: 42 },
      4: { cellWidth: 44 },
      5: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
      6: { cellWidth: 'auto' },
      7: { cellWidth: 40, minCellHeight: 26 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const code = desordres[data.row.index]?.classif?.coteIQOA
        const [r, g, b] = hexToRgb(couleurCote(code))
        data.cell.styles.fillColor = [r, g, b]
        data.cell.styles.textColor = [255, 255, 255]
      }
    },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 7) {
        const snap = desordres[data.row.index]?.snapshot
        if (snap) {
          const pad = 1.5
          const cw = data.cell.width - pad * 2
          const ch = data.cell.height - pad * 2
          try {
            doc.addImage(snap, 'JPEG', data.cell.x + pad, data.cell.y + pad, cw, ch)
          } catch (e) {
            /* image illisible : on ignore */
          }
        }
      }
    },
  })

  doc.save(`pv-visite-${slug(ouvrage.nom)}.pdf`)
}
