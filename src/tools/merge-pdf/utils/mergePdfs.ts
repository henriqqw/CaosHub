import { PDFDocument } from 'pdf-lib'

export async function mergePdfs(buffers: ArrayBuffer[]): Promise<Uint8Array> {
  const merged = await PDFDocument.create()

  for (const buffer of buffers) {
    const bytes = new Uint8Array(buffer)
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true })
    const indices = doc.getPageIndices()
    const pages = await merged.copyPages(doc, indices)
    pages.forEach(page => merged.addPage(page))
  }

  return merged.save()
}
