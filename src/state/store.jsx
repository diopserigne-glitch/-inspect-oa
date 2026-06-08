import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { get as idbGet, set as idbSet } from 'idb-keyval'
import { cotePlusDefavorable } from '../data/referentiels.js'

const IDB_KEY = 'inspect-oa:inspection'

export function uid(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function inspectionVide() {
  return {
    id: uid('insp'),
    nom: '',
    dateVisite: new Date().toISOString().slice(0, 10),
    ouvrage: { nom: '', typeOuvrage: 'pont', localisation: '', gestionnaire: '' },
    videos: [],
    desordres: [],
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':
      return action.inspection
    case 'SET_OUVRAGE':
      return { ...state, ouvrage: { ...state.ouvrage, ...action.patch } }
    case 'SET_META':
      return { ...state, ...action.patch }
    case 'ADD_VIDEOS':
      return { ...state, videos: [...state.videos, ...action.videos] }
    case 'REMOVE_VIDEO':
      return {
        ...state,
        videos: state.videos.filter((v) => v.id !== action.id),
        desordres: state.desordres.filter((d) => d.videoId !== action.id),
      }
    case 'ADD_DESORDRE':
      return { ...state, desordres: [...state.desordres, action.desordre] }
    case 'UPDATE_DESORDRE':
      return {
        ...state,
        desordres: state.desordres.map((d) =>
          d.id === action.id ? { ...d, ...action.patch, updatedAt: Date.now() } : d
        ),
      }
    case 'REMOVE_DESORDRE':
      return { ...state, desordres: state.desordres.filter((d) => d.id !== action.id) }
    case 'RESET':
      return inspectionVide()
    default:
      return state
  }
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [inspection, dispatch] = useReducer(reducer, null, inspectionVide)
  const [hydrated, setHydrated] = useState(false)
  // Map videoId -> { file, url } : runtime uniquement, jamais persisté.
  const runtimeRef = useRef(new Map())
  const [runtimeVersion, setRuntimeVersion] = useState(0)

  // Hydratation depuis IndexedDB au démarrage.
  useEffect(() => {
    let annule = false
    idbGet(IDB_KEY)
      .then((saved) => {
        if (!annule && saved && saved.id) dispatch({ type: 'HYDRATE', inspection: saved })
      })
      .catch(() => {})
      .finally(() => !annule && setHydrated(true))
    return () => {
      annule = true
    }
  }, [])

  // Persistance à chaque changement (après hydratation).
  useEffect(() => {
    if (hydrated) idbSet(IDB_KEY, inspection).catch(() => {})
  }, [inspection, hydrated])

  const api = useMemo(() => {
    const attachRuntime = (videoId, file) => {
      const url = URL.createObjectURL(file)
      runtimeRef.current.set(videoId, { file, url })
      setRuntimeVersion((v) => v + 1)
    }
    const getRuntime = (videoId) => runtimeRef.current.get(videoId) || null
    return {
      dispatch,
      attachRuntime,
      getRuntime,
      // helpers haut niveau
      setOuvrage: (patch) => dispatch({ type: 'SET_OUVRAGE', patch }),
      setMeta: (patch) => dispatch({ type: 'SET_META', patch }),
      addVideos: (videos) => dispatch({ type: 'ADD_VIDEOS', videos }),
      removeVideo: (id) => {
        runtimeRef.current.delete(id)
        dispatch({ type: 'REMOVE_VIDEO', id })
      },
      addDesordre: (desordre) => dispatch({ type: 'ADD_DESORDRE', desordre }),
      updateDesordre: (id, patch) => dispatch({ type: 'UPDATE_DESORDRE', id, patch }),
      removeDesordre: (id) => dispatch({ type: 'REMOVE_DESORDRE', id }),
      reset: () => {
        runtimeRef.current.clear()
        dispatch({ type: 'RESET' })
      },
    }
  }, [])

  const classeGlobale = useMemo(
    () => cotePlusDefavorable(inspection.desordres.map((d) => d.classif?.coteIQOA).filter(Boolean)),
    [inspection.desordres]
  )

  const value = useMemo(
    () => ({ inspection, hydrated, classeGlobale, runtimeVersion, ...api }),
    [inspection, hydrated, classeGlobale, runtimeVersion, api]
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore doit être utilisé dans <StoreProvider>')
  return ctx
}
