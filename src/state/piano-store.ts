import { createStore } from '@tanstack/store'
import { instruments, type InstrumentId } from '@/audio/instruments'

export type AudioStatus = 'idle' | 'loading' | 'ready' | 'fallback' | 'error'
type Preferences = { instrument: InstrumentId; volume: number; octave: number; showLabels: boolean }
export const defaults: Preferences = { instrument: 'piano', volume: 55, octave: 4, showLabels: true }
export function readPreferences(): Preferences {
  try {
    const value = JSON.parse(localStorage.getItem('little-pianist:v1') ?? '{}')
    return {
      instrument: instruments.some((item) => item.id === value.instrument) ? value.instrument : defaults.instrument,
      volume: Number.isFinite(value.volume) ? Math.min(80, Math.max(0, value.volume)) : defaults.volume,
      octave: [3, 4, 5].includes(value.octave) ? value.octave : defaults.octave,
      showLabels: typeof value.showLabels === 'boolean' ? value.showLabels : defaults.showLabels,
    }
  } catch { return defaults }
}
export const pianoStore = createStore({
  ...readPreferences(), childMode: false, audioStatus: 'idle' as AudioStatus,
  audioMessage: '', activeNotes: [] as number[], lastNote: null as number | null,
  fullscreen: false, offlineReady: false,
})
export type PianoState = ReturnType<typeof pianoStore.get>
export function updatePiano(patch: Partial<PianoState>) {
  pianoStore.setState((state) => ({ ...state, ...patch }))
}
export function savePreferences(patch: Partial<Preferences>) {
  updatePiano(patch)
  const { instrument, volume, octave, showLabels } = pianoStore.get()
  try { localStorage.setItem('little-pianist:v1', JSON.stringify({ instrument, volume, octave, showLabels })) } catch { /* Storage is optional. */ }
}
