// =============================================================================
//  Référentiels de cotation et catalogues de désordres
//  Sources : méthode IQOA (Image de la Qualité des Ouvrages d'Art), ITSEOA
//  (Instruction Technique pour la Surveillance et l'Entretien des Ouvrages d'Art)
//  et catalogues de désordres CEREMA.
//
//  ⚠️  Les classes de cotation IQOA ci-dessous sont normalisées et reproduites
//  fidèlement. Les catalogues de désordres constituent une BASE DE TRAVAIL
//  cohérente avec la logique des fascicules ITSEOA/CEREMA (publications payantes),
//  à faire valider / compléter par le gestionnaire. La structure est volontairement
//  ouverte : ajouter une entrée = ajouter un objet dans les tableaux, sans toucher
//  au code de l'application.
// =============================================================================

// --- Classes de cotation IQOA « génie civil » -------------------------------
export const COTES_IQOA = [
  {
    code: '1',
    libelle: 'Classe 1 — Bon état apparent',
    description:
      "Ouvrage en bon état apparent. Aucun désordre, ou désordres mineurs ne nécessitant qu'un entretien courant.",
    couleur: '#1f9d55',
  },
  {
    code: '2',
    libelle: 'Classe 2 — Défauts mineurs',
    description:
      "Structure en bon état apparent, mais présentant des défauts mineurs d'équipements ou de protection, ou des défauts mineurs de la structure. Entretien courant.",
    couleur: '#7cb342',
  },
  {
    code: '2E',
    libelle: 'Classe 2E — Entretien spécialisé',
    description:
      "Comme la classe 2, mais nécessite un entretien spécialisé : sans intervention, les défauts risquent d'évoluer et d'affecter la structure.",
    couleur: '#f9a825',
  },
  {
    code: '3',
    libelle: 'Classe 3 — Structure altérée',
    description:
      "Structure altérée : des travaux de réparation sont nécessaires, mais sans caractère d'urgence pour la structure.",
    couleur: '#ef6c00',
  },
  {
    code: '3U',
    libelle: 'Classe 3U — Urgence',
    description:
      "Structure altérée avec caractère d'urgence : risque pour la sécurité des usagers ou évolution rapide pouvant menacer la capacité portante à court terme.",
    couleur: '#d32f2f',
  },
]

// Ordre de gravité croissant — sert au calcul de la classe globale (pire cas).
export const ORDRE_GRAVITE = ['1', '2', '2E', '3', '3U']

export function coteParCode(code) {
  return COTES_IQOA.find((c) => c.code === code) || null
}

export function couleurCote(code) {
  const c = coteParCode(code)
  return c ? c.couleur : '#90a4ae'
}

// Renvoie la cote la plus défavorable d'une liste de codes.
export function cotePlusDefavorable(codes) {
  let pire = null
  let pireRang = -1
  for (const code of codes) {
    const rang = ORDRE_GRAVITE.indexOf(code)
    if (rang > pireRang) {
      pireRang = rang
      pire = code
    }
  }
  return pire
}

// --- Cotation « eau » (tunnels / tranchées couvertes) -----------------------
export const COTES_EAU = [
  { code: '1', libelle: 'Eau 1 — Pas de venue d’eau significative' },
  { code: '2', libelle: 'Eau 2 — Venues d’eau / humidité notables' },
  { code: '3', libelle: 'Eau 3 — Venues d’eau importantes / ruissellement' },
]

// =============================================================================
//  Catalogues par type d'ouvrage
//  parties   : zones / éléments de l'ouvrage
//  materiaux : matériaux constitutifs
//  desordres : { code, famille, libelle, description, refITSEOA }
// =============================================================================

export const OUVRAGES = {
  pont: {
    label: 'Pont',
    refEau: false,
    parties: [
      'Tablier',
      'Poutres / entretoises',
      'Hourdis / dalle',
      "Appuis (piles, culées)",
      "Appareils d'appui",
      "Fondations / fûts",
      'Joints de chaussée',
      'Étanchéité / chaussée',
      'Corniches / trottoirs',
      'Garde-corps / dispositifs de retenue',
      'Évacuation des eaux',
    ],
    materiaux: [
      'Béton armé',
      'Béton précontraint',
      'Métal / acier',
      'Maçonnerie',
      'Mixte acier-béton',
      'Bois',
    ],
    desordres: [
      {
        code: 'P-FIS-FAI',
        famille: 'Fissuration',
        libelle: 'Faïençage',
        description:
          'Réseau de fines fissures superficielles en mailles, souvent lié au retrait ou à une réaction interne du béton.',
        refITSEOA: 'IQOA / ITSEOA – béton',
      },
      {
        code: 'P-FIS-EFF',
        famille: 'Fissuration',
        libelle: "Fissures d'effort (flexion / effort tranchant)",
        description:
          "Fissures structurelles orientées (flexion, effort tranchant, torsion) traduisant une sollicitation excessive ou un défaut de ferraillage.",
        refITSEOA: 'IQOA / ITSEOA – béton',
      },
      {
        code: 'P-FIS-RET',
        famille: 'Fissuration',
        libelle: 'Fissures de retrait',
        description: 'Fissures dues au retrait du béton au jeune âge ou à des gradients thermiques.',
        refITSEOA: 'IQOA / ITSEOA – béton',
      },
      {
        code: 'P-ECL-EPA',
        famille: 'Éclatements / épaufrures',
        libelle: 'Épaufrure',
        description: "Enlèvement localisé de matière (arêtes, angles), souvent en peau de béton.",
        refITSEOA: 'IQOA / ITSEOA – béton',
      },
      {
        code: 'P-ECL-ARM',
        famille: 'Éclatements / épaufrures',
        libelle: 'Éclatement avec armatures apparentes',
        description:
          "Éclatement du béton d'enrobage laissant les armatures à nu, généralement provoqué par la corrosion (gonflement des aciers).",
        refITSEOA: 'IQOA / ITSEOA – béton',
      },
      {
        code: 'P-COR-ARM',
        famille: 'Corrosion',
        libelle: 'Corrosion des armatures',
        description:
          "Oxydation des aciers (traces de rouille, gonflement, perte de section) liée à la carbonatation ou aux chlorures.",
        refITSEOA: 'IQOA / ITSEOA – béton',
      },
      {
        code: 'P-COR-MET',
        famille: 'Corrosion',
        libelle: 'Corrosion de la charpente métallique',
        description:
          "Corrosion de l'acier de structure (rouille, feuilletage, perte d'épaisseur) et dégradation de la protection anticorrosion.",
        refITSEOA: 'IQOA / ITSEOA – métal',
      },
      {
        code: 'P-ENR-DEF',
        famille: "Défaut d'enrobage / parement",
        libelle: "Défaut d'enrobage, ségrégation, nid de cailloux",
        description:
          "Béton mal mis en œuvre (ségrégation, bullage, nids de cailloux) ou enrobage insuffisant des armatures.",
        refITSEOA: 'IQOA / ITSEOA – béton',
      },
      {
        code: 'P-EAU-INF',
        famille: "Venues d'eau / humidité",
        libelle: 'Infiltrations, traces de ruissellement',
        description:
          "Traces d'humidité, ruissellement, stalactites, efflorescences révélant un défaut d'étanchéité ou d'évacuation des eaux.",
        refITSEOA: 'IQOA / ITSEOA – étanchéité',
      },
      {
        code: 'P-EAU-EFF',
        famille: "Venues d'eau / humidité",
        libelle: 'Efflorescences / concrétions calcaires',
        description: 'Dépôts blanchâtres dus à la lixiviation du béton sous circulation d’eau.',
        refITSEOA: 'IQOA / ITSEOA – béton',
      },
      {
        code: 'P-APP-DEF',
        famille: "Appareils d'appui",
        libelle: "Désordre d'appareil d'appui",
        description:
          "Écrasement, fissuration ou cisaillement d'un appareil d'appui (élastomère), défaut de bossage, déplacement anormal.",
        refITSEOA: 'IQOA / ITSEOA – appuis',
      },
      {
        code: 'P-JNT-DEF',
        famille: 'Équipements',
        libelle: 'Défaut de joint de chaussée',
        description:
          "Joint de chaussée détérioré, déréglé, bruyant ou fuyard, pouvant entraîner des infiltrations sur appuis.",
        refITSEOA: 'IQOA / ITSEOA – équipements',
      },
      {
        code: 'P-EQU-RET',
        famille: 'Équipements',
        libelle: 'Dispositif de retenue / garde-corps endommagé',
        description:
          'Garde-corps, glissières ou barrières corrodés, déformés ou descellés — enjeu de sécurité des usagers.',
        refITSEOA: 'IQOA / ITSEOA – équipements',
      },
      {
        code: 'P-DEF-GEO',
        famille: 'Déformation / mouvement',
        libelle: "Déformation, tassement, déplacement d'appui",
        description:
          "Flèche anormale, basculement, tassement d'appui ou déplacement révélant un mouvement de la structure ou des fondations.",
        refITSEOA: 'IQOA / ITSEOA – structure',
      },
      {
        code: 'P-VEG',
        famille: 'Environnement',
        libelle: 'Végétation envahissante',
        description: 'Végétation se développant sur l’ouvrage, favorisant la rétention d’eau et la dégradation.',
        refITSEOA: 'IQOA / ITSEOA – abords',
      },
    ],
  },

  mur: {
    label: 'Mur de soutènement',
    refEau: false,
    parties: ['Zone d’influence', 'Parement', 'Couronnement', 'Structure', 'Drainage / barbacanes', 'Équipements / dispositifs de retenue'],
    materiaux: ['Maçonnerie (poids)', 'Béton (poids)', 'Béton armé (encastré sur semelle)', 'Gabions', 'Éléments préfabriqués empilés', 'Sol renforcé / cloué'],
    desordres: [
      {
        code: 'M-DEF-DEV',
        famille: 'Déformation / mouvement',
        libelle: 'Déversement, bombement, basculement',
        description:
          "Mouvement d'ensemble ou localisé du mur (déversement vers l'aval, ventre, basculement) traduisant un défaut de stabilité.",
        refITSEOA: 'IQOA Murs – structure',
      },
      {
        code: 'M-FIS-STR',
        famille: 'Fissuration',
        libelle: 'Fissuration de structure',
        description: 'Fissures verticales, obliques ou en escalier traversant le parement ou la structure.',
        refITSEOA: 'IQOA Murs – structure',
      },
      {
        code: 'M-PAR-DEG',
        famille: 'Parement',
        libelle: 'Dégradation du parement',
        description:
          "Désorganisation de la maçonnerie (joints dégradés, pierres déchaussées), épaufrures, éclatements ou écaillage du béton.",
        refITSEOA: 'IQOA Murs – parement',
      },
      {
        code: 'M-COR-ARM',
        famille: 'Corrosion',
        libelle: 'Corrosion des armatures (mur BA)',
        description: "Corrosion des aciers avec éclatement de l'enrobage sur les murs en béton armé.",
        refITSEOA: 'IQOA Murs – béton armé',
      },
      {
        code: 'M-DRA-DEF',
        famille: 'Drainage',
        libelle: 'Défaut de drainage / barbacanes obstruées',
        description:
          "Barbacanes bouchées ou absentes, mauvaise évacuation provoquant une accumulation d'eau et des poussées hydrostatiques derrière le mur.",
        refITSEOA: 'IQOA Murs – drainage',
      },
      {
        code: 'M-EAU-INF',
        famille: "Venues d'eau / humidité",
        libelle: 'Venues d’eau, suintements, efflorescences',
        description: "Suintements, traces d'humidité et efflorescences sur le parement.",
        refITSEOA: 'IQOA Murs – drainage',
      },
      {
        code: 'M-GAB-DEF',
        famille: 'Gabions / préfabriqués',
        libelle: 'Désordre de gabions / éléments empilés',
        description: 'Corrosion ou rupture des cages de gabions, tassement ou désolidarisation des éléments empilés.',
        refITSEOA: 'IQOA Murs – gabions',
      },
      {
        code: 'M-ZIN-ERO',
        famille: "Zone d'influence",
        libelle: "Érosion / affouillement en pied",
        description: "Érosion, affouillement ou ravinement au pied du mur menaçant sa fondation.",
        refITSEOA: 'IQOA Murs – zone d’influence',
      },
      {
        code: 'M-EQU-RET',
        famille: 'Équipements',
        libelle: 'Dispositif de retenue en couronnement endommagé',
        description: 'Garde-corps ou glissière de couronnement corrodé, déformé ou descellé.',
        refITSEOA: 'IQOA Murs – équipements',
      },
      {
        code: 'M-VEG',
        famille: 'Environnement',
        libelle: 'Végétation envahissante',
        description: 'Végétation dans les joints et le parement, accélérant la dégradation et masquant les désordres.',
        refITSEOA: 'IQOA Murs – abords',
      },
    ],
  },

  tunnel: {
    label: 'Tunnel / tranchée couverte',
    refEau: true,
    parties: ['Revêtement / voûte', 'Piédroits', 'Radier', 'Tête / portail', 'Étanchéité', 'Drainage', 'Équipements d’exploitation'],
    materiaux: ['Béton (revêtement)', 'Béton armé', 'Maçonnerie', 'Béton projeté', 'Rocher / soutènement'],
    desordres: [
      {
        code: 'T-FIS-REV',
        famille: 'Fissuration',
        libelle: 'Fissuration du revêtement',
        description: "Fissures longitudinales, transversales ou en voûte du revêtement, traduisant des sollicitations ou un mouvement du massif.",
        refITSEOA: 'Génie civil tunnels – revêtement',
      },
      {
        code: 'T-ECL-REV',
        famille: 'Éclatements / épaufrures',
        libelle: 'Éclatement / écaillage du revêtement',
        description: "Éclatement, écaillage ou chute de matière du revêtement (risque pour l'exploitation).",
        refITSEOA: 'Génie civil tunnels – revêtement',
      },
      {
        code: 'T-COR-ARM',
        famille: 'Corrosion',
        libelle: 'Corrosion des armatures',
        description: "Corrosion des aciers avec éclatement de l'enrobage du revêtement en béton armé.",
        refITSEOA: 'Génie civil tunnels – béton armé',
      },
      {
        code: 'T-EAU-INF',
        famille: "Venues d'eau / étanchéité",
        libelle: 'Venues d’eau / infiltrations',
        description: 'Suintements, ruissellements, stalactites ou venues d’eau franches révélant un défaut d’étanchéité (cote « eau »).',
        refITSEOA: 'Génie civil tunnels – étanchéité',
      },
      {
        code: 'T-EAU-GEL',
        famille: "Venues d'eau / étanchéité",
        libelle: 'Concrétions, gel, dégradation par cycles gel/dégel',
        description: 'Concrétions calcaires, formation de glace et dégradations associées aux venues d’eau.',
        refITSEOA: 'Génie civil tunnels – étanchéité',
      },
      {
        code: 'T-DRA-DEF',
        famille: 'Drainage',
        libelle: 'Défaut de drainage / caniveaux obstrués',
        description: 'Réseau de drainage colmaté ou détérioré, mauvaise évacuation des eaux.',
        refITSEOA: 'Génie civil tunnels – drainage',
      },
      {
        code: 'T-DEF-GEO',
        famille: 'Déformation / mouvement',
        libelle: 'Déformation / convergence du revêtement',
        description: 'Déformation, ovalisation ou convergence traduisant une poussée du terrain.',
        refITSEOA: 'Génie civil tunnels – structure',
      },
      {
        code: 'T-TET-DEF',
        famille: 'Tête / portail',
        libelle: 'Désordre de tête / portail',
        description: 'Fissuration, déplacement ou instabilité de la tête, des perrés et talus associés.',
        refITSEOA: 'Génie civil tunnels – têtes',
      },
      {
        code: 'T-EQU-DEF',
        famille: 'Équipements',
        libelle: 'Défaut d’équipement d’exploitation',
        description: 'Dégradation de la ventilation, éclairage, signalisation ou dispositifs de sécurité.',
        refITSEOA: 'Génie civil tunnels – équipements',
      },
    ],
  },
}

export const TYPES_OUVRAGE = Object.entries(OUVRAGES).map(([value, o]) => ({
  value,
  label: o.label,
}))

export const REFERENTIELS = ['IQOA', 'ITSEOA', 'CEREMA']

// Familles distinctes (pour grouper les types de désordre dans le formulaire).
export function famillesPour(typeOuvrage) {
  const o = OUVRAGES[typeOuvrage]
  if (!o) return []
  return [...new Set(o.desordres.map((d) => d.famille))]
}

export function desordresPour(typeOuvrage, famille) {
  const o = OUVRAGES[typeOuvrage]
  if (!o) return []
  return famille ? o.desordres.filter((d) => d.famille === famille) : o.desordres
}

export function desordreParCode(typeOuvrage, code) {
  const o = OUVRAGES[typeOuvrage]
  if (!o) return null
  return o.desordres.find((d) => d.code === code) || null
}
