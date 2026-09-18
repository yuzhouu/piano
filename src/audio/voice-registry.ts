export type Voice = { cancel: () => void }
// Input sources own voices: releasing one finger never releases another.
export class VoiceRegistry {
  private entries = new Map<string, { midi: number; voice?: Voice; generation: number }>()
  private generation = 0
  constructor(private changed: (notes: number[]) => void = () => {}, private limit = 20) {}
  begin(source: string, midi: number) {
    this.release(source)
    while (this.entries.size >= this.limit) this.release(this.entries.keys().next().value!)
    const generation = ++this.generation
    this.entries.set(source, { midi, generation })
    this.emit()
    return generation
  }
  attach(source: string, generation: number, voice: Voice) {
    const entry = this.entries.get(source)
    if (!entry || entry.generation !== generation) { voice.cancel(); return false }
    entry.voice = voice
    return true
  }
  isCurrent(source: string, generation: number) { return this.entries.get(source)?.generation === generation }
  release(source: string) {
    const entry = this.entries.get(source)
    if (!entry) return
    entry.voice?.cancel()
    this.entries.delete(source)
    this.emit()
  }
  clear() {
    for (const entry of this.entries.values()) entry.voice?.cancel()
    this.entries.clear()
    this.emit()
  }
  get notes() { return [...new Set([...this.entries.values()].map((entry) => entry.midi))] }
  private emit() { this.changed(this.notes) }
}
