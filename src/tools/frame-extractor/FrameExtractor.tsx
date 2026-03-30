import { motion } from 'framer-motion'
import { useFrameExtractor } from './hooks/useFrameExtractor'
import { VideoUpload } from './components/VideoUpload'
import { ExtractionConfigPanel } from './components/ExtractionConfig'
import { FrameResults } from './components/FrameResults'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { Button } from '../../components/ui/Button'

export function FrameExtractor() {
  const {
    phase,
    videoMeta,
    config,
    setConfig,
    progress,
    frames,
    loadVideo,
    startExtraction,
    cancel,
    reset,
  } = useFrameExtractor()

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">FrameExtractor</h1>
        <p className="text-text-secondary text-sm mt-1">
          Extract frames from any video. All processing happens in your browser.
        </p>
      </div>

      {/* Phase: upload */}
      {phase === 'upload' && (
        <VideoUpload onFile={loadVideo} />
      )}

      {/* Phase: config */}
      {phase === 'config' && videoMeta && (
        <ExtractionConfigPanel
          config={config}
          onChange={setConfig}
          meta={videoMeta}
          onStart={startExtraction}
          onBack={reset}
        />
      )}

      {/* Phase: processing */}
      {phase === 'processing' && (
        <div className="space-y-4">
          <ProgressBar value={progress} label="Extracting frames" />
          <Button variant="ghost" onClick={cancel} className="text-sm">
            Cancel
          </Button>
        </div>
      )}

      {/* Phase: done */}
      {phase === 'done' && (
        <FrameResults frames={frames} format={config.format} onReset={reset} />
      )}
    </motion.div>
  )
}
