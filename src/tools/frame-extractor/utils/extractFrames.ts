export interface ExtractionConfig {
  mode: 'first' | 'fps' | 'count'
  fps: number
  count: number
  format: 'png' | 'jpeg'
  outputWidth: number | null
}

function buildTimestamps(duration: number, config: ExtractionConfig): number[] {
  if (config.mode === 'first') return [0]
  if (config.mode === 'fps') {
    const step = 1 / config.fps
    const ts: number[] = []
    for (let t = 0; t < duration; t += step) ts.push(t)
    return ts
  }
  // count mode
  const total = Math.max(1, config.count)
  const step = duration / total
  return Array.from({ length: total }, (_, i) => i * step)
}

function seekTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise(resolve => {
    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked)
      resolve()
    }
    video.addEventListener('seeked', onSeeked)
    video.currentTime = time
  })
}

export async function extractFrames(
  video: HTMLVideoElement,
  config: ExtractionConfig,
  onProgress: (pct: number) => void,
  stopRef: { current: boolean },
): Promise<string[]> {
  const timestamps = buildTimestamps(video.duration, config)
  const frames: string[] = []

  const outWidth = config.outputWidth ?? video.videoWidth
  const scale = outWidth / video.videoWidth
  const outHeight = Math.round(video.videoHeight * scale)

  const canvas = document.createElement('canvas')
  canvas.width = outWidth
  canvas.height = outHeight
  const ctx = canvas.getContext('2d')!
  const mimeType = config.format === 'png' ? 'image/png' : 'image/jpeg'
  const quality = config.format === 'jpeg' ? 0.95 : undefined

  for (let i = 0; i < timestamps.length; i++) {
    if (stopRef.current) break
    await seekTo(video, timestamps[i])
    ctx.drawImage(video, 0, 0, outWidth, outHeight)
    frames.push(canvas.toDataURL(mimeType, quality))
    onProgress(Math.round(((i + 1) / timestamps.length) * 100))
  }

  return frames
}
