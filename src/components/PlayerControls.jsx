import { formatTemps } from '../lib/exportJSON.js'

const VITESSES = [0.25, 0.5, 1, 1.5, 2]

export default function PlayerControls({
  hasVideo,
  playing,
  currentTime,
  duration,
  view,
  onTogglePlay,
  onSeek,
  onStep,
  onZoom,
  onResetView,
  onRate,
  onAnnotate,
  annotating,
  onAnalyze,
  aiStatus,
  iaConfiguree,
}) {
  return (
    <div className="player-controls">
      <div className="pc-row">
        <button className="btn icon" type="button" disabled={!hasVideo} onClick={() => onStep(-1)} title="Image précédente">
          ⏮
        </button>
        <button className="btn play" type="button" disabled={!hasVideo} onClick={onTogglePlay}>
          {playing ? '⏸ Pause' : '▶ Lecture'}
        </button>
        <button className="btn icon" type="button" disabled={!hasVideo} onClick={() => onStep(1)} title="Image suivante">
          ⏭
        </button>

        <input
          className="seek"
          type="range"
          min={0}
          max={duration || 0}
          step={0.05}
          value={Math.min(currentTime, duration || 0)}
          disabled={!hasVideo}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
        />
        <span className="time">
          {formatTemps(currentTime)} / {formatTemps(duration)}
        </span>
      </div>

      <div className="pc-row secondary">
        <label className="inline">
          Vitesse
          <select disabled={!hasVideo} defaultValue={1} onChange={(e) => onRate(parseFloat(e.target.value))}>
            {VITESSES.map((v) => (
              <option key={v} value={v}>
                ×{v}
              </option>
            ))}
          </select>
        </label>

        <label className="inline grow">
          Zoom
          <input
            type="range"
            min={1}
            max={8}
            step={0.1}
            value={view.scale}
            disabled={!hasVideo}
            onChange={(e) => onZoom(parseFloat(e.target.value))}
          />
        </label>
        <button className="btn ghost" type="button" disabled={!hasVideo} onClick={onResetView}>
          Recadrer
        </button>

        <button
          className={`btn ${annotating ? 'warn' : 'primary'}`}
          type="button"
          disabled={!hasVideo}
          onClick={onAnnotate}
        >
          {annotating ? '✎ En cours…' : '＋ Marquer un désordre'}
        </button>

        <button
          className="btn ai"
          type="button"
          disabled={!hasVideo || aiStatus?.running}
          onClick={onAnalyze}
          title={iaConfiguree ? 'Détection automatique des désordres' : 'Configurez le proxy IA (⚙️ IA)'}
        >
          🤖 {aiStatus?.running ? `Analyse… ${aiStatus.done}/${aiStatus.total}` : 'Analyse IA'}
        </button>
      </div>

      {aiStatus?.running && (
        <div className="ai-progress">
          <div
            className="ai-progress-bar"
            style={{ width: `${aiStatus.total ? (aiStatus.done / aiStatus.total) * 100 : 0}%` }}
          />
        </div>
      )}
      {aiStatus?.error && <p className="warn-line">⚠️ {aiStatus.error}</p>}
    </div>
  )
}
