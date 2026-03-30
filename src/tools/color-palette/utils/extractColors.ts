export interface ExtractedColor {
  hex: string
  rgb: string
  r: number
  g: number
  b: number
  percentage: number
}

function toHex(value: number): string {
  return value.toString(16).padStart(2, '0').toUpperCase()
}

function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)
}

export async function extractColors(file: File, count = 8): Promise<ExtractedColor[]> {
  const bitmap = await createImageBitmap(file)

  const MAX_SIDE = 200
  const scale = Math.min(MAX_SIDE / bitmap.width, MAX_SIDE / bitmap.height, 1)
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Não foi possível criar contexto de canvas')

  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()

  const { data } = ctx.getImageData(0, 0, w, h)
  const totalPixels = w * h

  const colorMap = new Map<string, { r: number; g: number; b: number; count: number }>()

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3]
    if (alpha < 128) continue // skip transparent

    // Quantize to nearest 32
    const r = Math.round((data[i] ?? 0) / 32) * 32
    const g = Math.round((data[i + 1] ?? 0) / 32) * 32
    const b = Math.round((data[i + 2] ?? 0) / 32) * 32

    // Clamp to 0-255
    const rq = Math.min(255, r)
    const gq = Math.min(255, g)
    const bq = Math.min(255, b)

    const key = `${rq},${gq},${bq}`
    const existing = colorMap.get(key)
    if (existing) {
      existing.count++
    } else {
      colorMap.set(key, { r: rq, g: gq, b: bq, count: 1 })
    }
  }

  // Sort by frequency descending
  const sorted = Array.from(colorMap.values()).sort((a, b) => b.count - a.count)

  // Deduplicate: skip colors too similar to already-selected ones
  const selected: { r: number; g: number; b: number; count: number }[] = []
  for (const candidate of sorted) {
    if (selected.length >= count) break

    const tooClose = selected.some(
      s => colorDistance(candidate.r, candidate.g, candidate.b, s.r, s.g, s.b) < 60,
    )
    if (!tooClose) {
      selected.push(candidate)
    }
  }

  const totalSelected = selected.reduce((acc, c) => acc + c.count, 0)
  const baseForPercentage = totalSelected > 0 ? totalSelected : totalPixels

  return selected.map(c => ({
    hex: `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`,
    rgb: `rgb(${c.r}, ${c.g}, ${c.b})`,
    r: c.r,
    g: c.g,
    b: c.b,
    percentage: Math.round((c.count / baseForPercentage) * 100),
  }))
}
