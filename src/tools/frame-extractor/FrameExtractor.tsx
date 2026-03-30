import { useMemo, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
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
    videoFile,
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

  // Stable object URL for video preview — revoked on file change or unmount
  const videoUrl = useMemo(
    () => (videoFile ? URL.createObjectURL(videoFile) : null),
    [videoFile],
  )
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl)
    }
  }, [videoUrl])

  return (
    <>
      <Helmet>
        <title>FrameExtractor — Extraia frames de vídeos no navegador | CaosHub</title>
        <meta name="description" content="Extraia frames de qualquer vídeo diretamente no navegador. Exporte como PNG, JPEG ou ZIP. Sem upload para servidores, 100% privado e gratuito." />
        <link rel="canonical" href="https://caoshub.vercel.app/tools/frame-extractor" />
        <meta property="og:url" content="https://caoshub.vercel.app/tools/frame-extractor" />
        <meta property="og:title" content="FrameExtractor — Extraia frames de vídeos no navegador | CaosHub" />
        <meta property="og:description" content="Extraia frames de qualquer vídeo diretamente no navegador. Exporte como PNG, JPEG ou ZIP. Sem upload, 100% privado e gratuito." />
        <meta name="twitter:title" content="FrameExtractor — Extraia frames de vídeos no navegador | CaosHub" />
        <meta name="twitter:description" content="Extraia frames de qualquer vídeo diretamente no navegador. Exporte como PNG, JPEG ou ZIP. Sem upload, 100% privado e gratuito." />
      </Helmet>
      <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-2xl mx-auto px-4 pb-12 space-y-6"
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
      {phase === 'config' && videoMeta && videoFile && videoUrl && (
        <div className="space-y-4">
          {/* Video player */}
          <video
            src={videoUrl}
            controls
            className="w-full rounded-xl border border-border bg-black"
            style={{ maxHeight: '360px' }}
          />

          {/* Config panel */}
          <ExtractionConfigPanel
            config={config}
            onChange={setConfig}
            meta={videoMeta}
            filename={videoFile.name}
            onStart={startExtraction}
            onReset={reset}
          />
        </div>
      )}

      {/* Phase: processing */}
      {phase === 'processing' && (
        <div className="space-y-4 rounded-xl bg-bg-secondary border border-border p-6">
          <ProgressBar value={progress} label="Extracting frames…" />
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
    </>
  )
}
