import { PDFDocument } from 'pdf-lib'

export interface SplitResult {
  name: string
  blob: Blob
  pageCount: number
}

export async function extractPages(
  buffer: ArrayBuffer,
  pageIndices: number[],
  filename: string,
): Promise<SplitResult> {
  const srcDoc = await PDFDocument.load(buffer)
  const newDoc = await PDFDocument.create()
  const pages = await newDoc.copyPages(srcDoc, pageIndices)
  for (const page of pages) {
    newDoc.addPage(page)
  }
  const bytes = await newDoc.save()
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
  return { name: filename, blob, pageCount: pageIndices.length }
}

export async function splitAllPages(
  buffer: ArrayBuffer,
  basename: string,
): Promise<SplitResult[]> {
  const srcDoc = await PDFDocument.load(buffer)
  const total = srcDoc.getPageCount()
  const results: SplitResult[] = []

  for (let i = 0; i < total; i++) {
    const newDoc = await PDFDocument.create()
    const [page] = await newDoc.copyPages(srcDoc, [i])
    newDoc.addPage(page)
    const bytes = await newDoc.save()
    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
    results.push({ name: `${basename}-pagina-${i + 1}.pdf`, blob, pageCount: 1 })
  }

  return results
}

export async function splitByRanges(
  buffer: ArrayBuffer,
  ranges: [number, number][],
  basename: string,
): Promise<SplitResult[]> {
  const srcDoc = await PDFDocument.load(buffer)
  const results: SplitResult[] = []

  for (let r = 0; r < ranges.length; r++) {
    const [start, end] = ranges[r]
    // start/end are 0-indexed inclusive
    const indices: number[] = []
    for (let i = start; i <= end; i++) {
      indices.push(i)
    }
    const newDoc = await PDFDocument.create()
    const pages = await newDoc.copyPages(srcDoc, indices)
    for (const page of pages) {
      newDoc.addPage(page)
    }
    const bytes = await newDoc.save()
    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
    const label = `${start + 1}-${end + 1}`
    results.push({
      name: `${basename}-paginas-${label}.pdf`,
      blob,
      pageCount: indices.length,
    })
  }

  return results
}
