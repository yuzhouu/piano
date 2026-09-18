import { useEffect, useRef, useState } from 'react'
import { useSelector } from '@tanstack/react-store'
import { pianoStore, updatePiano } from '@/state/piano-store'
import { pianoEngine } from '@/audio/engine'

export async function requestFullscreen() {
  if (document.fullscreenElement) return true
  if (!document.documentElement.requestFullscreen) return false
  try { await document.documentElement.requestFullscreen(); return true } catch { return false }
}
export function useChildMode() {
  const locked = useSelector(pianoStore, (state) => state.childMode)
  useEffect(() => {
    const fullscreen = () => updatePiano({ fullscreen: !!document.fullscreenElement })
    document.addEventListener('fullscreenchange', fullscreen)
    return () => document.removeEventListener('fullscreenchange', fullscreen)
  }, [])
  useEffect(() => {
    if (!locked) return
    document.body.classList.add('child-mode')
    const prevent = (event: Event) => event.preventDefault()
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    const options = { passive: false, capture: true }
    const events = ['contextmenu', 'selectstart', 'dragstart', 'wheel', 'touchmove', 'gesturestart', 'gesturechange']
    for (const name of events) document.addEventListener(name, prevent, options)
    window.addEventListener('beforeunload', beforeUnload)
    return () => {
      document.body.classList.remove('child-mode')
      for (const name of events) document.removeEventListener(name, prevent, options)
      window.removeEventListener('beforeunload', beforeUnload)
    }
  }, [locked])
  return {
    locked,
    enter: async () => {
      pianoEngine.stopAll()
      void pianoEngine.activate()
      updatePiano({ childMode: true })
      return requestFullscreen()
    },
    leave: () => { pianoEngine.stopAll(); updatePiano({ childMode: false }) },
  }
}
export function useHoldToUnlock(unlock: () => void) {
  const [progress, setProgress] = useState(0)
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const stop = () => { clearInterval(timer.current); timer.current = undefined; setProgress(0) }
  const start = () => {
    if (timer.current) return
    const started = performance.now()
    timer.current = setInterval(() => {
      const value = Math.min(1, (performance.now() - started) / 3000)
      setProgress(value)
      if (value === 1) { stop(); unlock() }
    }, 30)
  }
  useEffect(() => {
    window.addEventListener('blur', stop)
    const visibility = () => { if (document.hidden) stop() }
    document.addEventListener('visibilitychange', visibility)
    return () => { clearInterval(timer.current); window.removeEventListener('blur', stop); document.removeEventListener('visibilitychange', visibility) }
  }, [])
  return { progress, start, stop }
}
