export type OutputFormat = 'jpeg' | 'png' | 'webp'

export interface ConversionResult {
  dataUrl: string
  size: number
  width: number
  height: number
}

export async function convertImage(
  file: File,
  format: OutputFormat,
  quality: number,
): Promise<ConversionResult> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!

      // JPEG has no transparency — fill white background
      if (format === 'jpeg') {
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      ctx.drawImage(img, 0, 0)

      const mimeType =
        format === 'jpeg' ? 'image/jpeg' : format === 'png' ? 'image/png' : 'image/webp'
      const dataUrl =
        format === 'png'
          ? canvas.toDataURL('image/png')
          : canvas.toDataURL(mimeType, quality)

      const base64 = dataUrl.split(',')[1] ?? ''
      const size = Math.round((base64.length * 3) / 4)
      resolve({ dataUrl, size, width: img.naturalWidth, height: img.naturalHeight })
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image'))
    }

    img.src = objectUrl
  })
}

export function formatExt(format: OutputFormat): string {
  return format === 'jpeg' ? 'jpg' : format
}
