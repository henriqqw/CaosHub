import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).href

export interface PageImage {
  pageNumber: number
  dataUrl: string
  width: number
  height: number
}

export type ImageFormat = 'png' | 'jpeg'

export async function renderPdfPages(
  file: File,
  format: ImageFormat,
  quality: number,
  scale: number,
  pageNumbers?: number[],
  onProgress?: (current: number, total: number) => void,
): Promise<PageImage[]> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const totalPages = pdf.numPages

  const pagesToRender =
    pageNumbers && pageNumbers.length > 0
      ? pageNumbers.filter(n => n >= 1 && n <= totalPages)
      : Array.from({ length: totalPages }, (_, i) => i + 1)

  const results: PageImage[] = []

  for (let i = 0; i < pagesToRender.length; i++) {
    const pageNumber = pagesToRender[i]
    const page = await pdf.getPage(pageNumber)
    const viewport = page.getViewport({ scale })

    const canvas = document.createElement('canvas')
    canvas.width = Math.floor(viewport.width)
    canvas.height = Math.floor(viewport.height)

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Não foi possível obter contexto 2D do canvas')

    await page.render({ canvasContext: ctx, viewport }).promise

    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png'
    const dataUrl =
      format === 'jpeg'
        ? canvas.toDataURL(mimeType, quality)
        : canvas.toDataURL(mimeType)

    results.push({
      pageNumber,
      dataUrl,
      width: canvas.width,
      height: canvas.height,
    })

    onProgress?.(i + 1, pagesToRender.length)

    // Release page resources
    page.cleanup()
  }

  return results
}
