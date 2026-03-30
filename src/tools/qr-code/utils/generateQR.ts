import QRCode from 'qrcode'

export interface QROptions {
  size: number
  errorLevel: 'L' | 'M' | 'Q' | 'H'
  margin: number
  darkColor: string
  lightColor: string
}

export async function generateQRDataUrl(text: string, options: QROptions): Promise<string> {
  return QRCode.toDataURL(text, {
    width: options.size,
    margin: options.margin,
    errorCorrectionLevel: options.errorLevel,
    color: {
      dark: options.darkColor,
      light: options.lightColor,
    },
  })
}

export async function generateQRSvgString(text: string, options: QROptions): Promise<string> {
  return QRCode.toString(text, {
    type: 'svg',
    width: options.size,
    margin: options.margin,
    errorCorrectionLevel: options.errorLevel,
    color: {
      dark: options.darkColor,
      light: options.lightColor,
    },
  })
}
