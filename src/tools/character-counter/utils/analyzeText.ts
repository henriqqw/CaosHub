export interface TextStats {
  characters: number
  charactersNoSpaces: number
  words: number
  uniqueWords: number
  sentences: number
  paragraphs: number
  lines: number
  readingTime: string
  longestWord: string
  avgWordLength: number
}

export function analyzeText(text: string): TextStats {
  const characters = text.length
  const charactersNoSpaces = text.replace(/\s/g, '').length

  const wordMatches = text.match(/\S+/g) ?? []
  const words = wordMatches.length

  const uniqueWords = new Set(wordMatches.map(w => w.toLowerCase().replace(/[^a-záàâãéèêíïóôõöúüçñ]/gi, ''))).size

  const sentenceMatches = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const sentences = text.trim().length === 0 ? 0 : sentenceMatches.length

  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length

  const lines = text.split('\n').filter(l => l.trim().length > 0).length

  const WPM = 200
  const totalSeconds = Math.round((words / WPM) * 60)
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  const readingTime =
    words === 0
      ? '0 seg'
      : mins > 0
      ? `${mins} min ${secs} seg`
      : `${secs} seg`

  const longestWord = wordMatches.reduce<string>((longest, w) => {
    const clean = w.replace(/[^a-záàâãéèêíïóôõöúüçñ]/gi, '')
    return clean.length > longest.length ? clean : longest
  }, '')

  const avgWordLength =
    words === 0
      ? 0
      : Math.round((wordMatches.reduce((sum, w) => sum + w.replace(/[^a-záàâãéèêíïóôõöúüçñ]/gi, '').length, 0) / words) * 10) / 10

  return {
    characters,
    charactersNoSpaces,
    words,
    uniqueWords,
    sentences,
    paragraphs,
    lines,
    readingTime,
    longestWord,
    avgWordLength,
  }
}
