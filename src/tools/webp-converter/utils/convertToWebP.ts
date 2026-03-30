export interface ConversionResult {
  dataUrl: string
  size: number
}

export async function convertToWebP(file: File, quality: number): Promise<ConversionResult> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const dataUrl = canvas.toDataURL('image/webp', quality)
      // Approximate byte size from base64 string
      const base64 = dataUrl.split(',')[1] ?? ''
      const size = Math.round((base64.length * 3) / 4)
      resolve({ dataUrl, size })
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image'))
    }

    img.src = objectUrl
  })
}
