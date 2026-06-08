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
- **Détection automatique par IA** : un agent Claude (vision) analyse des images extraites de la
  vidéo, détecte les désordres, les **localise** (boîte englobante), les **classe** (IQOA/ITSEOA)
  et les **explique**. Pendant la lecture, l'app **met en exergue** chaque désordre détecté
  (cadre + libellé + cote) et affiche son **explication**. Voir « Détection IA » ci-dessous.
- **Classification** en cascade : type d'ouvrage → partie → matériau → famille → type de désordre,
  **cote IQOA** (1, 2, 2E, 3, 3U) — et cote « eau » pour les tunnels — + **commentaire libre**.
- **Marqueurs** colorés sur la timeline ; clic = retour au désordre avec restitution du zoom.
- **Synthèse** : tableau des désordres, compteurs par classe, **classe globale = pire cas**.
- **Vidéo annotée (résultat visualisable)** : régénère la vidéo du drone **retravaillée** — chaque
  désordre est incrusté au bon instant (cadre coloré par cote + libellé + explication), avec un
  en-tête (ouvrage + classe globale). Rejouable dans l'app et **téléchargeable en `.webm`**
  (rendu Canvas + MediaRecorder, 100 % navigateur).
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

## Détection IA (agent Claude)

L'app étant 100 % navigateur, elle n'embarque pas la clé API. La détection passe par un **proxy
serverless** (Cloudflare Worker, dossier [`worker/`](worker/)) qui détient la clé et relaie les
requêtes vers l'API Claude. Flux : l'app extrait des images de la vidéo → les envoie au proxy →
Claude (vision + *tool use*) renvoie les désordres structurés (boîte normalisée, type, partie,
matériau, cote IQOA, explication) → l'app les ajoute comme désordres (marqués « IA ») et les met
en exergue pendant la lecture. Le catalogue (prompt système) est mis en **cache** pour réduire le
coût des images suivantes.

**Déployer le proxy :**

```bash
npm i -g wrangler
cd worker
wrangler deploy
wrangler secret put ANTHROPIC_API_KEY     # colle ta clé sk-ant-...
# optionnel : wrangler secret put APP_TOKEN  (jeton partagé app <-> worker)
```

Puis, dans l'app, ouvrir **⚙️ IA** et renseigner l'URL du worker (et le jeton si défini). Choisir
le modèle (défaut **Haiku 4.5** — `claude-haiku-4-5`), l'intervalle d'échantillonnage et le nombre
d'images max.

**Annotation automatique** : par défaut, dès qu'une vidéo est chargée, l'agent l'analyse et
l'annote automatiquement (option « Analyser automatiquement à l'ouverture d'une vidéo » dans
⚙️ IA). Le bouton **🤖 Analyse IA** permet de relancer manuellement.

> Le worker borne les requêtes (modèles sur liste blanche, nb d'images) et applique le CORS. En
> production, fixe `ALLOWED_ORIGIN` (toml) sur l'URL Pages de l'app et définis un `APP_TOKEN`.
> La détection assiste l'inspecteur : **les désordres IA restent à valider/corriger** dans l'app.

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
