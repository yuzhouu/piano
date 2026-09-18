import { useEffect, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'
import { updatePiano } from '@/state/piano-store'

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }
let registered = false
export function usePwa() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null)
  useEffect(() => {
    if (!registered && import.meta.env.PROD) {
      registered = true
      registerSW({ onOfflineReady: () => updatePiano({ offlineReady: true }) })
      navigator.serviceWorker?.ready.then(() => updatePiano({ offlineReady: true })).catch(() => {})
    }
    const beforeInstall = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPrompt) }
    const installed = () => setPrompt(null)
    window.addEventListener('beforeinstallprompt', beforeInstall)
    window.addEventListener('appinstalled', installed)
    return () => { window.removeEventListener('beforeinstallprompt', beforeInstall); window.removeEventListener('appinstalled', installed) }
  }, [])
  return { canInstall: !!prompt, install: async () => {
    if (!prompt) return false
    await prompt.prompt()
    const choice = await prompt.userChoice
    setPrompt(null)
    return choice.outcome === 'accepted'
  } }
}
