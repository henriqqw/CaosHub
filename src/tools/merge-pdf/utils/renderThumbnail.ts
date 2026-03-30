import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString()

export async function renderThumbnail(buffer: ArrayBuffer): Promise<string> {
  // Copy the buffer — pdfjs-dist transfers the ArrayBuffer to its Web Worker,
  // which would neuter the original buffer stored in React state and break merging.
  const copy = buffer.slice(0)
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(copy) }).promise
  const page = await pdf.getPage(1)
  const viewport = page.getViewport({ scale: 1 })
  const scale = 160 / viewport.width
  const scaled = page.getViewport({ scale })

  const canvas = document.createElement('canvas')
  canvas.width = scaled.width
  canvas.height = scaled.height

  const ctx = canvas.getContext('2d')!
  await page.render({ canvasContext: ctx, viewport: scaled }).promise

  return canvas.toDataURL('image/jpeg', 0.85)
}
