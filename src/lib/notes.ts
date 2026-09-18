const names = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']
const syllables = ['Do', 'Di', 'Re', 'Ri', 'Mi', 'Fa', 'Fi', 'Sol', 'Si♭', 'La', 'Li', 'Si']
export const keyboardCodes = ['KeyA', 'KeyW', 'KeyS', 'KeyE', 'KeyD', 'KeyF', 'KeyT', 'KeyG', 'KeyY', 'KeyH', 'KeyU', 'KeyJ', 'KeyK', 'KeyO', 'KeyL', 'KeyP', 'Semicolon', 'Quote', 'BracketLeft', 'BracketRight', 'Backslash', 'KeyZ', 'KeyX', 'KeyC', 'KeyV']
const symbolLabels: Record<string, string> = { Semicolon: ';', Quote: "'", BracketLeft: '[', BracketRight: ']', Backslash: '\\' }
export const keyLabel = (code: string) => symbolLabels[code] ?? code.replace('Key', '')
export const midiName = (midi: number) => `${names[midi % 12]}${Math.floor(midi / 12) - 1}`
export const solfege = (midi: number) => syllables[midi % 12]
export const isBlack = (midi: number) => [1, 3, 6, 8, 10].includes(midi % 12)
export const frequency = (midi: number) => 440 * 2 ** ((midi - 69) / 12)
export function notesForOctave(octave: number, compact = false) {
  return Array.from({ length: compact ? 13 : 25 }, (_, offset) => {
    const midi = (octave + 1) * 12 + offset
    return { midi, black: isBlack(midi), label: solfege(midi), name: midiName(midi), shortcut: keyLabel(keyboardCodes[offset]) }
  })
}
export function noteForCode(code: string, octave: number, childMode: boolean): number | null {
  const offset = keyboardCodes.indexOf(code)
  if (offset !== -1) return (octave + 1) * 12 + offset
  if (!childMode || /^(Meta|Control|Alt|Shift|CapsLock|Fn|Unidentified)/.test(code)) return null
  const pentatonic = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21]
  const hash = [...code].reduce((value, letter) => value + letter.charCodeAt(0), 0)
  return (octave + 1) * 12 + pentatonic[hash % pentatonic.length]
}
