export interface PasswordOptions {
  length: number
  uppercase: boolean
  lowercase: boolean
  numbers: boolean
  symbols: boolean
  excludeAmbiguous: boolean
}

export type StrengthLevel = 'weak' | 'fair' | 'strong' | 'very-strong'

export interface PasswordResult {
  password: string
  strength: StrengthLevel
  entropy: number
}

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'
const NUMBERS = '0123456789'
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?'
const AMBIGUOUS = /[0Ol1I]/g

function buildCharset(options: PasswordOptions): string {
  let charset = ''
  if (options.uppercase) charset += UPPERCASE
  if (options.lowercase) charset += LOWERCASE
  if (options.numbers) charset += NUMBERS
  if (options.symbols) charset += SYMBOLS
  if (options.excludeAmbiguous) charset = charset.replace(AMBIGUOUS, '')
  return charset
}

function calcStrength(entropy: number): StrengthLevel {
  if (entropy < 40) return 'weak'
  if (entropy < 60) return 'fair'
  if (entropy < 80) return 'strong'
  return 'very-strong'
}

export function generatePassword(options: PasswordOptions): PasswordResult {
  const charset = buildCharset(options)
  if (charset.length === 0) {
    return { password: '', strength: 'weak', entropy: 0 }
  }

  const array = new Uint32Array(options.length)
  crypto.getRandomValues(array)

  let password = ''
  for (let i = 0; i < options.length; i++) {
    password += charset[array[i] % charset.length]
  }

  const entropy = Math.log2(Math.pow(charset.length, options.length))
  const strength = calcStrength(entropy)

  return { password, strength, entropy }
}

export function generateBatch(options: PasswordOptions, count: number): PasswordResult[] {
  const results: PasswordResult[] = []
  for (let i = 0; i < count; i++) {
    results.push(generatePassword(options))
  }
  return results
}
