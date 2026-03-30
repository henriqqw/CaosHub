export interface CompressResult {
  dataUrl: string
  originalSize: number
  compressedSize: number
  width: number
  height: number
}

export type CompressFormat = 'jpeg' | 'png' | 'webp'

export async function compressImage(
  file: File,
  format: CompressFormat,
  quality: number,
  maxWidth?: number,
): Promise<CompressResult> {
  const originalSize = file.size

  const imageBitmap = await createImageBitmap(file)

  let targetWidth = imageBitmap.width
  let targetHeight = imageBitmap.height

  if (maxWidth && targetWidth > maxWidth) {
    const ratio = maxWidth / targetWidth
    targetWidth = maxWidth
    targetHeight = Math.round(targetHeight * ratio)
  }

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Não foi possível criar contexto de canvas')

  ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight)
  imageBitmap.close()

  const mimeType = format === 'jpeg' ? 'image/jpeg' : format === 'png' ? 'image/png' : 'image/webp'
  const qualityValue = format === 'png' ? undefined : quality

  const dataUrl = canvas.toDataURL(mimeType, qualityValue)

  // Calculate compressed size from base64 data
  const base64Data = dataUrl.split(',')[1] ?? ''
  const compressedSize = Math.round((base64Data.length * 3) / 4)

  return {
    dataUrl,
    originalSize,
    compressedSize,
    width: targetWidth,
    height: targetHeight,
  }
}
