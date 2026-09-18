import { useEffect } from 'react'
import { pianoEngine } from '@/audio/engine'
import { noteForCode } from '@/lib/notes'
import { pianoStore } from '@/state/piano-store'

export function usePianoInput() {
  useEffect(() => {
    const held = new Set<string>()
    const keydown = (event: KeyboardEvent) => {
      const state = pianoStore.get()
      if (state.childMode) { event.preventDefault(); event.stopImmediatePropagation() }
      else {
        if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return
        if (document.querySelector('[role="dialog"][data-state="open"]')) return
        if (event.target instanceof Element && event.target.closest('input,textarea,select,[contenteditable="true"],[role="slider"]')) return
      }
      const note = noteForCode(event.code, state.octave, state.childMode)
      if (note === null) return
      event.preventDefault()
      if (event.repeat || held.has(event.code)) return
      held.add(event.code)
      void pianoEngine.noteOn(`key:${event.code}`, note)
    }
    const keyup = (event: KeyboardEvent) => {
      held.delete(event.code)
      pianoEngine.noteOff(`key:${event.code}`)
      if (pianoStore.get().childMode) { event.preventDefault(); event.stopImmediatePropagation() }
    }
    const clear = () => { held.clear(); pianoEngine.stopAll() }
    const visibility = () => { if (document.hidden) clear() }
    window.addEventListener('keydown', keydown, true)
    window.addEventListener('keyup', keyup, true)
    window.addEventListener('blur', clear)
    document.addEventListener('visibilitychange', visibility)
    document.addEventListener('fullscreenchange', clear)
    return () => {
      window.removeEventListener('keydown', keydown, true)
      window.removeEventListener('keyup', keyup, true)
      window.removeEventListener('blur', clear)
      document.removeEventListener('visibilitychange', visibility)
      document.removeEventListener('fullscreenchange', clear)
      clear()
    }
  }, [])
}
