import { useState, useRef, useCallback } from 'react'
import { extractFrames, type ExtractionConfig } from '../utils/extractFrames'

type Phase = 'upload' | 'config' | 'processing' | 'done'

export interface VideoMeta {
  duration: number
  width: number
  height: number
}

export function useFrameExtractor() {
  const [phase, setPhase] = useState<Phase>('upload')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoMeta, setVideoMeta] = useState<VideoMeta | null>(null)
  const [config, setConfig] = useState<ExtractionConfig>({
    mode: 'fps',
    fps: 1,
    count: 10,
    format: 'png',
    outputWidth: null,
  })
  const [progress, setProgress] = useState(0)
  const [frames, setFrames] = useState<string[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)
  const stopRef = useRef(false)

  const loadVideo = useCallback((file: File) => {
    setVideoFile(file)
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      setVideoMeta({ duration: video.duration, width: video.videoWidth, height: video.videoHeight })
      URL.revokeObjectURL(url)
      setPhase('config')
    }
    video.src = url
  }, [])

  const startExtraction = useCallback(async () => {
    if (!videoFile) return
    setPhase('processing')
    setProgress(0)
    stopRef.current = false

    const video = document.createElement('video')
    video.src = URL.createObjectURL(videoFile)
    await new Promise<void>(resolve => {
      video.onloadeddata = () => resolve()
    })

    try {
      const result = await extractFrames(video, config, setProgress, stopRef)
      setFrames(result)
      setPhase('done')
    } catch {
      setPhase('config')
    } finally {
      URL.revokeObjectURL(video.src)
    }
  }, [videoFile, config])

  const cancel = useCallback(() => {
    stopRef.current = true
  }, [])

  const reset = useCallback(() => {
    setPhase('upload')
    setVideoFile(null)
    setVideoMeta(null)
    setFrames([])
    setProgress(0)
    stopRef.current = false
  }, [])

  return {
    phase,
    videoFile,
    videoMeta,
    config,
    setConfig,
    progress,
    frames,
    videoRef,
    loadVideo,
    startExtraction,
    cancel,
    reset,
  }
}
