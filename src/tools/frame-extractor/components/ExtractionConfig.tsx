import { type ExtractionConfig } from '../utils/extractFrames'
import { type VideoMeta } from '../hooks/useFrameExtractor'
import { Button } from '../../../components/ui/Button'

interface ExtractionConfigProps {
  config: ExtractionConfig
  onChange: (config: ExtractionConfig) => void
  meta: VideoMeta
  filename: string
  onStart: () => void
  onReset: () => void
}

const WIDTH_PRESETS = [
  { label: '3840px (4K)', value: 3840 },
  { label: '2560px (2K)', value: 2560 },
  { label: '1920px (Full HD)', value: 1920 },
  { label: '1280px (HD)', value: 1280 },
  { label: '1080px', value: 1080 },
  { label: '720px', value: 720 },
  { label: '480px', value: 480 },
  { label: '360px', value: 360 },
]

const FORMAT_OPTIONS = [
  { label: 'PNG (lossless)', value: 'png' },
  { label: 'JPEG (compressed)', value: 'jpeg' },
]

function formatDuration(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

function truncate(str: string, n: number) {
  return str.length > n ? str.slice(0, n) + '…' : str
}

type AllFramesMethod = 'fps' | 'count'

export function ExtractionConfigPanel({
  config,
  onChange,
  meta,
  filename,
  onStart,
  onReset,
}: ExtractionConfigProps) {
  const update = <K extends keyof ExtractionConfig>(key: K, value: ExtractionConfig[K]) =>
    onChange({ ...config, [key]: value })

  const isAllFrames = config.mode !== 'first'
  const method: AllFramesMethod = config.mode === 'count' ? 'count' : 'fps'
  const useCustomWidth = config.outputWidth !== null

  const setAllFrames = (all: boolean) => {
    if (!all) {
      onChange({ ...config, mode: 'first' })
    } else {
      onChange({ ...config, mode: method === 'count' ? 'count' : 'fps' })
    }
  }

  const setMethod = (m: AllFramesMethod) => {
    onChange({ ...config, mode: m === 'fps' ? 'fps' : 'count' })
  }

  const estimatedFrames =
    config.mode === 'first'
      ? 1
      : config.mode === 'fps'
        ? Math.max(1, Math.floor(meta.duration * config.fps))
        : config.count

  return (
    <div className="space-y-5 rounded-xl bg-bg-secondary border border-border p-5">
      {/* File info bar */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium">
        <span>
          <span className="text-text-secondary uppercase tracking-wide mr-1.5">File</span>
          <span className="text-text-primary font-mono">{truncate(filename, 28)}</span>
        </span>
        <span className="text-border">|</span>
        <span>
          <span className="text-text-secondary uppercase tracking-wide mr-1.5">Duration</span>
          <span className="text-text-primary">{formatDuration(meta.duration)}</span>
        </span>
        <span className="text-border">|</span>
        <span>
          <span className="text-text-secondary uppercase tracking-wide mr-1.5">Resolution</span>
          <span className="text-text-primary">{meta.width}×{meta.height}</span>
        </span>
      </div>

      <hr className="border-border" />

      {/* Extraction mode */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-text-secondary uppercase tracking-widest">
          Extraction Mode
        </label>
        <div className="grid grid-cols-2 gap-1 p-1 bg-surface rounded-lg border border-border">
          <ModeButton active={!isAllFrames} onClick={() => setAllFrames(false)}>
            First Frame
          </ModeButton>
          <ModeButton active={isAllFrames} onClick={() => setAllFrames(true)}>
            All Frames
          </ModeButton>
        </div>
      </div>

      {/* Extraction method (All Frames only) */}
      {isAllFrames && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-widest">
            Extraction Method
          </label>
          <div className="grid grid-cols-2 gap-1 p-1 bg-surface rounded-lg border border-border">
            <ModeButton active={method === 'fps'} onClick={() => setMethod('fps')}>
              By FPS
            </ModeButton>
            <ModeButton active={method === 'count'} onClick={() => setMethod('count')}>
              Total Count
            </ModeButton>
          </div>
        </div>
      )}

      {/* Sampling rate slider (FPS) */}
      {isAllFrames && method === 'fps' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-widest">
              Sampling Rate
            </label>
            <span className="text-sm font-semibold text-accent">{config.fps} FPS</span>
          </div>
          <input
            type="range"
            min={0.1}
            max={30}
            step={0.1}
            value={config.fps}
            onChange={e => update('fps', parseFloat(e.target.value))}
            className="w-full accent-accent"
          />
          <p className="text-xs text-text-secondary">
            Higher FPS = more frames &amp; longer processing.
          </p>
        </div>
      )}

      {/* Total count input */}
      {isAllFrames && method === 'count' && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-widest">
            Total Frames
          </label>
          <input
            type="number"
            min={1}
            max={1000}
            step={1}
            value={config.count}
            onChange={e => update('count', Math.max(1, parseInt(e.target.value) || 10))}
            className="w-28 px-3 py-1.5 rounded-lg bg-surface border border-border text-text-primary text-sm focus:outline-none focus:border-accent"
          />
        </div>
      )}

      {/* Output resolution */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-text-secondary uppercase tracking-widest">
          Output Resolution
        </label>
        <div className="grid grid-cols-2 gap-1 p-1 bg-surface rounded-lg border border-border">
          <ModeButton active={!useCustomWidth} onClick={() => update('outputWidth', null)}>
            Original
          </ModeButton>
          <ModeButton
            active={useCustomWidth}
            onClick={() => update('outputWidth', WIDTH_PRESETS.find(p => p.value <= meta.width)?.value ?? 1280)}
          >
            Custom Width
          </ModeButton>
        </div>
      </div>

      {/* Width preset dropdown */}
      {useCustomWidth && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-widest">
            Width Preset
          </label>
          <select
            value={config.outputWidth ?? ''}
            onChange={e => update('outputWidth', parseInt(e.target.value))}
            className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text-primary text-sm focus:outline-none focus:border-accent"
          >
            {WIDTH_PRESETS.map(p => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-text-secondary">
            Height auto-calculated to maintain aspect ratio.
          </p>
        </div>
      )}

      {/* Output format */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-text-secondary uppercase tracking-widest">
          Output Format
        </label>
        <select
          value={config.format}
          onChange={e => update('format', e.target.value as 'png' | 'jpeg')}
          className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text-primary text-sm focus:outline-none focus:border-accent"
        >
          {FORMAT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <hr className="border-border" />

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={onStart} className="flex-1">
          {config.mode === 'first'
            ? 'Extract First Frame'
            : `Extract All Frames (~${estimatedFrames})`}
        </Button>
        <Button variant="ghost" onClick={onReset}>
          Reset
        </Button>
      </div>
    </div>
  )
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`py-1.5 px-3 rounded-md text-xs font-medium transition-colors duration-100 ${
        active
          ? 'bg-accent text-white'
          : 'text-text-secondary hover:text-text-primary'
      }`}
    >
      {children}
    </button>
  )
}
