import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString()

export type ImageFormat = 'png' | 'jpeg'

export interface RenderedPage {
  dataUrl: string
  pageNumber: number
}

export async function renderPdfPages(
  file: File,
  format: ImageFormat,
  quality: number,
  scale: number,
  _pages?: number[],
  onProgress?: (current: number, total: number) => void,
): Promise<RenderedPage[]> {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
  const totalPages = pdf.numPages
  const results: RenderedPage[] = []

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')!
    await page.render({ canvasContext: ctx, viewport }).promise
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png'
    const dataUrl = canvas.toDataURL(mimeType, quality)
    results.push({ dataUrl, pageNumber: i })
    onProgress?.(i, totalPages)
  }

  return results
}
