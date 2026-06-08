import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore, uid } from './state/store.jsx'
import { fichierVersVideo } from './lib/videoSignature.js'
import { capturerVignette } from './lib/snapshot.js'
import { OUVRAGES } from './data/referentiels.js'
import Header from './components/Header.jsx'
import InspectionSetup from './components/InspectionSetup.jsx'
import VideoStage from './components/VideoStage.jsx'
import PlayerControls from './components/PlayerControls.jsx'
import Timeline from './components/Timeline.jsx'
import ClassificationForm from './components/ClassificationForm.jsx'
import DesordreList from './components/DesordreList.jsx'
import SynthesePanel from './components/SynthesePanel.jsx'
import SettingsModal from './components/SettingsModal.jsx'
import VideoResultModal from './components/VideoResultModal.jsx'
import { analyserVideo } from './lib/aiDetect.js'
import { genererVideoAnnotee } from './lib/renderVideo.js'
import { lireReglagesIA, ecrireReglagesIA } from './lib/aiSettings.js'

const VUE_INITIALE = { scale: 1, panX: 0, panY: 0 }

function classifVide(typeOuvrage) {
  const o = OUVRAGES[typeOuvrage] || OUVRAGES.pont
  return {
    referentiel: 'IQOA',
    partie: o.parties[0] || '',
    materiau: o.materiaux[0] || '',
    familleDesordre: '',
    typeDesordre: '',
    coteIQOA: '2',
    coteEau: o.refEau ? '1' : undefined,
    commentaire: '',
  }
}

export default function App() {
  const store = useStore()
  const { inspection } = store
  const videoRef = useRef(null)

  const [activeVideoId, setActiveVideoId] = useState(null)
  const [view, setView] = useState(VUE_INITIALE)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playing, setPlaying] = useState(false)
  // editor : désordre en cours de création/édition (null = aucun)
  const [editor, setEditor] = useState(null)
  const [showSynthese, setShowSynthese] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [reglagesIA, setReglagesIA] = useState(() => lireReglagesIA())
  const [aiStatus, setAiStatus] = useState(null)
  const [videoExport, setVideoExport] = useState(null)
  const [videoResult, setVideoResult] = useState(null)

  const activeVideoMeta = inspection.videos.find((v) => v.id === activeVideoId) || null
  const runtime = activeVideoId ? store.getRuntime(activeVideoId) : null

  // Sélectionne automatiquement la première vidéo disponible (avec runtime).
  useEffect(() => {
    if (activeVideoId && store.getRuntime(activeVideoId)) return
    const dispo = inspection.videos.find((v) => store.getRuntime(v.id))
    if (dispo) setActiveVideoId(dispo.id)
    else if (!inspection.videos.length) setActiveVideoId(null)
  }, [inspection.videos, store.runtimeVersion]) // eslint-disable-line react-hooks/exhaustive-deps

  // Réinitialise la vue quand on change de vidéo.
  useEffect(() => {
    setView(VUE_INITIALE)
    setEditor(null)
  }, [activeVideoId])

  // --- Import de vidéos -----------------------------------------------------
  const handleAddVideos = useCallback(
    async (files) => {
      const ajoutees = []
      for (const file of files) {
        try {
          const { meta, runtime: rt } = await fichierVersVideo(file, () => uid('vid'))
          const existante = inspection.videos.find((v) => v.signature === meta.signature)
          if (existante) {
            // ré-attache la vidéo à une métadonnée déjà connue (désordres conservés)
            store.attachRuntime(existante.id, rt.file)
            if (!activeVideoId) setActiveVideoId(existante.id)
          } else {
            store.attachRuntime(meta.id, rt.file)
            ajoutees.push(meta)
          }
        } catch (e) {
          alert(`Vidéo illisible : ${file.name}`)
        }
      }
      if (ajoutees.length) {
        store.addVideos(ajoutees)
        if (!activeVideoId) setActiveVideoId(ajoutees[0].id)
      }
    },
    [inspection.videos, activeVideoId, store]
  )

  // --- Contrôles lecteur ----------------------------------------------------
  const seekTo = useCallback((t) => {
    const v = videoRef.current
    if (v) v.currentTime = Math.max(0, Math.min(t, v.duration || t))
  }, [])

  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) v.play()
    else v.pause()
  }, [])

  const stepFrame = useCallback((dir) => {
    const v = videoRef.current
    if (!v) return
    v.pause()
    v.currentTime = Math.max(0, v.currentTime + dir * (1 / 25))
  }, [])

  // --- Annotation -----------------------------------------------------------
  const startAnnotation = useCallback(() => {
    const v = videoRef.current
    if (!v || !activeVideoId) return
    v.pause()
    setEditor({
      id: null,
      videoId: activeVideoId,
      t: v.currentTime,
      box: null,
      view,
      classif: classifVide(inspection.ouvrage.typeOuvrage),
    })
  }, [activeVideoId, view, inspection.ouvrage.typeOuvrage])

  const selectDesordre = useCallback(
    (d) => {
      if (d.videoId !== activeVideoId && store.getRuntime(d.videoId)) {
        setActiveVideoId(d.videoId)
      }
      setView(d.view || VUE_INITIALE)
      // seek après un tick pour laisser le bon <video> se monter si on a changé
      setTimeout(() => seekTo(d.t), 60)
      setEditor({ id: d.id, videoId: d.videoId, t: d.t, box: d.box, view: d.view, classif: { ...d.classif } })
    },
    [activeVideoId, store, seekTo]
  )

  const saveEditor = useCallback(() => {
    if (!editor) return
    const v = videoRef.current
    const snapshot = v ? capturerVignette(v, editor.box, editor.classif.coteIQOA) : null
    if (editor.id) {
      store.updateDesordre(editor.id, {
        box: editor.box,
        view: editor.view,
        classif: editor.classif,
        ...(snapshot ? { snapshot } : {}),
      })
    } else {
      store.addDesordre({
        id: uid('des'),
        videoId: editor.videoId,
        t: editor.t,
        box: editor.box,
        view: editor.view,
        snapshot,
        classif: editor.classif,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    }
    setEditor(null)
  }, [editor, store])

  const cancelEditor = useCallback(() => setEditor(null), [])

  // --- Analyse IA -----------------------------------------------------------
  const handleAnalyze = useCallback(async () => {
    if (!reglagesIA.proxyUrl) {
      setShowSettings(true)
      return
    }
    const video = videoRef.current
    if (!video || !activeVideoId) return
    setEditor(null)
    setAiStatus({ running: true, done: 0, total: 0, error: null })
    try {
      const detections = await analyserVideo({
        video,
        videoId: activeVideoId,
        typeOuvrage: inspection.ouvrage.typeOuvrage,
        reglages: reglagesIA,
        onProgress: (done, total) => setAiStatus({ running: true, done, total, error: null }),
      })
      detections.forEach((d) => store.addDesordre(d))
      setAiStatus({ running: false, done: detections.length, total: detections.length, error: null })
    } catch (e) {
      setAiStatus({ running: false, error: e.message })
    }
  }, [reglagesIA, activeVideoId, inspection.ouvrage.typeOuvrage, store])

  const desordresVideo = inspection.desordres.filter((d) => d.videoId === activeVideoId)

  // Désordres à mettre en exergue à l'instant courant (lecture = visite guidée).
  const highlights = editor
    ? []
    : desordresVideo
        .filter((d) => Math.abs(d.t - currentTime) <= 0.6)
        .sort((a, b) => Math.abs(a.t - currentTime) - Math.abs(b.t - currentTime))

  // --- Génération de la vidéo annotée (résultat visualisable) ---------------
  const handleExportVideo = async () => {
    const video = videoRef.current
    if (!video || !activeVideoId) return
    setEditor(null)
    setVideoExport({ running: true, progress: 0, error: null })
    try {
      const result = await genererVideoAnnotee({
        video,
        desordres: desordresVideo,
        ouvrage: inspection.ouvrage,
        classeGlobale: store.classeGlobale,
        onProgress: (t, dur) => setVideoExport({ running: true, progress: dur ? t / dur : 0, error: null }),
      })
      setVideoExport(null)
      setVideoResult((prev) => {
        if (prev?.url) URL.revokeObjectURL(prev.url)
        return result
      })
    } catch (e) {
      setVideoExport({ running: false, error: e.message })
    }
  }

  return (
    <div className="app">
      <Header
        classeGlobale={store.classeGlobale}
        nbDesordres={inspection.desordres.length}
        onSynthese={() => setShowSynthese(true)}
        onSettings={() => setShowSettings(true)}
        onReset={() => {
          if (confirm('Réinitialiser toute l’inspection ? (les désordres seront effacés)')) {
            store.reset()
            setActiveVideoId(null)
          }
        }}
      />

      <InspectionSetup
        inspection={inspection}
        activeVideoId={activeVideoId}
        onSelectVideo={setActiveVideoId}
        onAddVideos={handleAddVideos}
        getRuntime={store.getRuntime}
        onSetOuvrage={store.setOuvrage}
        onSetMeta={store.setMeta}
        onRemoveVideo={store.removeVideo}
        onReattach={(id, file) => store.attachRuntime(id, file)}
      />

      <main className="workspace">
        <section className="stage-col">
          <VideoStage
            videoRef={videoRef}
            runtime={runtime}
            view={view}
            setView={setView}
            drawing={!!editor}
            box={editor?.box}
            onBoxChange={(box) => setEditor((e) => (e ? { ...e, box } : e))}
            onLoadedMeta={(d) => setDuration(d)}
            onTimeUpdate={(t) => setCurrentTime(t)}
            onPlayState={setPlaying}
            highlights={highlights}
          />
          <PlayerControls
            hasVideo={!!runtime}
            playing={playing}
            currentTime={currentTime}
            duration={duration}
            view={view}
            onTogglePlay={togglePlay}
            onSeek={seekTo}
            onStep={stepFrame}
            onZoom={(scale) => setView((vw) => ({ ...vw, scale }))}
            onResetView={() => setView(VUE_INITIALE)}
            onRate={(r) => { if (videoRef.current) videoRef.current.playbackRate = r }}
            onAnnotate={startAnnotation}
            annotating={!!editor}
            onAnalyze={handleAnalyze}
            aiStatus={aiStatus}
            iaConfiguree={!!reglagesIA.proxyUrl}
            onExportVideo={handleExportVideo}
            videoExport={videoExport}
            nbDesordresVideo={desordresVideo.length}
          />
          <Timeline
            duration={duration}
            currentTime={currentTime}
            desordres={desordresVideo}
            onSeek={seekTo}
            onPickDesordre={selectDesordre}
          />
        </section>

        <aside className="side-col">
          {editor ? (
            <ClassificationForm
              editor={editor}
              typeOuvrage={inspection.ouvrage.typeOuvrage}
              onChange={(classif) => setEditor((e) => ({ ...e, classif }))}
              onSave={saveEditor}
              onCancel={cancelEditor}
              hasBox={!!(editor.box && editor.box.w > 0)}
            />
          ) : (
            <div className="hint-card">
              <h3>Annoter un désordre</h3>
              <p>
                Mettez la vidéo en pause sur un désordre, zoomez si besoin, puis cliquez sur
                <strong> « Marquer un désordre »</strong> pour l’encadrer et le classer selon les
                référentiels IQOA / ITSEOA / CEREMA.
              </p>
            </div>
          )}
          <DesordreList
            desordres={inspection.desordres}
            videos={inspection.videos}
            activeId={editor?.id}
            onPick={selectDesordre}
            onRemove={(id) => {
              store.removeDesordre(id)
              if (editor?.id === id) setEditor(null)
            }}
          />
        </aside>
      </main>

      {showSynthese && (
        <SynthesePanel
          inspection={inspection}
          classeGlobale={store.classeGlobale}
          onClose={() => setShowSynthese(false)}
          onImport={(insp) => {
            store.dispatch({ type: 'HYDRATE', inspection: insp })
            setActiveVideoId(null)
            setShowSynthese(false)
          }}
        />
      )}

      {showSettings && (
        <SettingsModal
          reglages={reglagesIA}
          onClose={() => setShowSettings(false)}
          onSave={(r) => {
            setReglagesIA(ecrireReglagesIA(r))
            setShowSettings(false)
          }}
        />
      )}

      {videoResult && (
        <VideoResultModal
          result={videoResult}
          ouvrageNom={inspection.ouvrage.nom}
          onClose={() => setVideoResult(null)}
        />
      )}
    </div>
  )
}
