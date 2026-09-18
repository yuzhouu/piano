import { describe, expect, it } from 'vitest'
import { isBlack, midiName, noteForCode, notesForOctave, solfege } from './notes'

describe('piano note map', () => {
  it('creates two chromatic octaves with the correct black-key pattern', () => {
    const notes = notesForOctave(4)
    expect(notes).toHaveLength(25)
    expect(notes.filter((note) => !note.black)).toHaveLength(15)
    expect(notes.slice(0, 12).map((note) => note.black)).toEqual([false, true, false, true, false, false, true, false, true, false, true, false])
  })
  it('maps computer keys to notes and child mode keeps random keys musical', () => {
    expect(noteForCode('KeyA', 4, false)).toBe(60)
    expect(noteForCode('KeyW', 4, false)).toBe(61)
    expect(noteForCode('Escape', 4, false)).toBeNull()
    expect(noteForCode('Escape', 4, true)).not.toBeNull()
    expect(noteForCode('MetaLeft', 4, true)).toBeNull()
  })
  it('formats the displayed note labels', () => {
    expect(midiName(60)).toBe('C4')
    expect(solfege(60)).toBe('Do')
    expect(isBlack(61)).toBe(true)
  })
})
