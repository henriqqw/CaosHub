import { type ExtractionConfig } from '../utils/extractFrames'
import { type VideoMeta } from '../hooks/useFrameExtractor'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'

interface ExtractionConfigProps {
  config: ExtractionConfig
  onChange: (config: ExtractionConfig) => void
  meta: VideoMeta
  onStart: () => void
  onBack: () => void
}

export function ExtractionConfigPanel({ config, onChange, meta, onStart, onBack }: ExtractionConfigProps) {
  const update = <K extends keyof ExtractionConfig>(key: K, value: ExtractionConfig[K]) =>
    onChange({ ...config, [key]: value })

  const estimatedFrames =
    config.mode === 'first'
      ? 1
      : config.mode === 'fps'
        ? Math.floor(meta.duration * config.fps)
        : config.count

  return (
    <div className="space-y-6">
      {/* Video info */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge>{Math.round(meta.duration)}s</Badge>
        <Badge>{meta.width}×{meta.height}</Badge>
        <Badge variant="accent">~{estimatedFrames} frames</Badge>
      </div>

      {/* Mode */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">Extraction Mode</label>
        <div className="flex gap-2">
          {(['first', 'fps', 'count'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => update('mode', mode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors duration-100 ${
                config.mode === mode
                  ? 'bg-accent text-white border-accent'
                  : 'bg-transparent text-text-secondary border-border hover:border-accent/50'
              }`}
            >
              {mode === 'first' ? 'First Frame' : mode === 'fps' ? 'By FPS' : 'By Count'}
            </button>
          ))}
        </div>
      </div>

      {/* Mode-specific options */}
      {config.mode === 'fps' && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-text-secondary">Frames per second</label>
          <input
            type="number"
            min={0.1}
            max={60}
            step={0.1}
            value={config.fps}
            onChange={e => update('fps', parseFloat(e.target.value) || 1)}
            className="w-24 px-3 py-1.5 rounded-lg bg-bg-secondary border border-border text-text-primary text-sm focus:outline-none focus:border-accent"
          />
        </div>
      )}

      {config.mode === 'count' && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-text-secondary">Number of frames</label>
          <input
            type="number"
            min={1}
            max={500}
            step={1}
            value={config.count}
            onChange={e => update('count', parseInt(e.target.value) || 10)}
            className="w-24 px-3 py-1.5 rounded-lg bg-bg-secondary border border-border text-text-primary text-sm focus:outline-none focus:border-accent"
          />
        </div>
      )}

      {/* Format */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">Format</label>
        <div className="flex gap-2">
          {(['png', 'jpeg'] as const).map(fmt => (
            <button
              key={fmt}
              onClick={() => update('format', fmt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors duration-100 uppercase ${
                config.format === fmt
                  ? 'bg-accent text-white border-accent'
                  : 'bg-transparent text-text-secondary border-border hover:border-accent/50'
              }`}
            >
              {fmt}
            </button>
          ))}
        </div>
      </div>

      {/* Output width */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-text-secondary">Output width (px, blank = original)</label>
        <input
          type="number"
          min={64}
          max={7680}
          step={1}
          placeholder={String(meta.width)}
          value={config.outputWidth ?? ''}
          onChange={e => update('outputWidth', e.target.value ? parseInt(e.target.value) : null)}
          className="w-32 px-3 py-1.5 rounded-lg bg-bg-secondary border border-border text-text-primary text-sm focus:outline-none focus:border-accent placeholder:text-text-secondary/40"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="ghost" onClick={onBack} className="text-sm">Back</Button>
        <Button onClick={onStart} className="text-sm">
          Extract {estimatedFrames} frame{estimatedFrames !== 1 ? 's' : ''}
        </Button>
      </div>
    </div>
  )
}
