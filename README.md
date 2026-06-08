# InspectOA — Visite virtuelle & cotation des désordres d'ouvrages d'art

Application web (100 % côté navigateur, sans serveur) pour **visiter virtuellement** des
ouvrages d'art à partir de **vidéos d'inspection prises par drone**, **zoomer** et **mettre en
pause** sur les désordres, les **encadrer**, les **commenter** et les **classer** selon les
référentiels **IQOA / ITSEOA / CEREMA**.

## Fonctions

- **Chargement de vidéos drone** locales (glisser-déposer, multi-fichiers : mp4, webm, mov…).
- **Lecteur** avec lecture/pause, image par image, vitesse de lecture et barre de navigation.
- **Zoom & déplacement** sur l'image (molette + glisser) pour observer un désordre de près.
- **Annotation** : sur pause, on encadre le désordre ; l'application **capture la vue**.
- **Classification** en cascade : type d'ouvrage → partie → matériau → famille → type de désordre,
  **cote IQOA** (1, 2, 2E, 3, 3U) — et cote « eau » pour les tunnels — + **commentaire libre**.
- **Marqueurs** colorés sur la timeline ; clic = retour au désordre avec restitution du zoom.
- **Synthèse** : tableau des désordres, compteurs par classe, **classe globale = pire cas**.
- **Export PDF** (PV de visite avec vignettes) et **export/import JSON** (sauvegarde & partage).
- **Persistance locale** (IndexedDB) : l'inspection est conservée entre les sessions. Les vidéos,
  trop volumineuses, ne sont pas stockées : on les re-sélectionne au rechargement (ré-attachement
  automatique des désordres par signature de fichier).

## Couverture des référentiels

Ouvrages couverts : **ponts**, **murs de soutènement**, **tunnels / tranchées couvertes**.

> ⚠️ Les **classes de cotation IQOA** sont normalisées et reproduites fidèlement. Les
> **catalogues de désordres** (familles et types par matériau/partie) constituent une **base de
> travail** cohérente avec la logique des fascicules ITSEOA / catalogues CEREMA (publications
> payantes), **à faire valider et compléter** par le gestionnaire. La taxonomie est centralisée
> dans [`src/data/referentiels.js`](src/data/referentiels.js) et conçue pour être étendue sans
> toucher au code.

## Développement

```bash
npm install
npm run dev      # serveur local Vite
npm run build    # build de production dans dist/
```

## Déploiement

Build Vite déployé sur **GitHub Pages** via GitHub Actions
([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)). `base: './'` dans
`vite.config.js` permet de servir l'app aussi bien à la racine d'un domaine que dans un
sous-chemin (`https://utilisateur.github.io/inspect-oa/`).

## Pile technique

Vite + React 18, état via Context + reducer, persistance `idb-keyval`, export PDF `jspdf` +
`jspdf-autotable`. Zoom/pan et annotations réalisés en CSS transform + canvas (aucune dépendance
lourde).
