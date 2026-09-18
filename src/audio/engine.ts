import playerUrl from 'webaudiofont/npm/dist/WebAudioFontPlayer.js?url'
import { getInstrument, type InstrumentId } from './instruments'
import { VoiceRegistry, type Voice } from './voice-registry'
import { pianoStore, savePreferences, updatePiano } from '@/state/piano-store'
import { frequency } from '@/lib/notes'

type Zone = { buffer?: AudioBuffer; file?: string; sample?: string; sampleRate: number }
type Preset = { zones: Zone[] }
type Player = {
  adjustPreset: (context: AudioContext, preset: Preset) => void
  queueWaveTable: (context: AudioContext, target: AudioNode, preset: Preset, when: number, pitch: number, duration: number, volume: number) => Voice | null
}
declare global {
  interface Window { WebAudioFontPlayer?: new () => Player; webkitAudioContext?: typeof AudioContext }
}
const scripts = new Map<string, Promise<void>>()
function loadScript(url: string) {
  const cached = scripts.get(url)
  if (cached) return cached
  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    const finish = (error?: Error) => {
      clearTimeout(timer)
      script.onload = script.onerror = null
      if (error) { script.remove(); scripts.delete(url); reject(error) } else resolve()
    }
    const timer = window.setTimeout(() => finish(new Error('音色加载超时')), 12000)
    script.src = url
    script.async = true
    script.onload = () => finish()
    script.onerror = () => finish(new Error('音色文件暂时无法加载'))
    document.head.append(script)
  })
  scripts.set(url, promise)
  return promise
}

export class PianoEngine {
  private context?: AudioContext
  private gain?: GainNode
  private player?: Player
  private presets = new Map<InstrumentId, Promise<Preset>>()
  private selectedPreset?: Preset
  private readyId?: InstrumentId
  private loadingId?: InstrumentId
  private loading?: Promise<void>
  private request = 0
  readonly voices = new VoiceRegistry((activeNotes) => updatePiano({ activeNotes }))

  // Called directly from the gesture, before any network/import await.
  private unlock() {
    if (!this.context) {
      const Context = window.AudioContext ?? window.webkitAudioContext
      if (!Context) throw new Error('当前浏览器不支持声音播放，请使用 Safari 或 Chrome')
      this.context = new Context({ latencyHint: 'interactive' })
      this.gain = this.context.createGain()
      const compressor = this.context.createDynamicsCompressor()
      compressor.threshold.value = -18
      compressor.knee.value = 18
      compressor.ratio.value = 8
      this.gain.connect(compressor).connect(this.context.destination)
      this.setVolume(pianoStore.get().volume)
    }
    if (this.context.state === 'suspended') void this.context.resume().catch(() => {
      updatePiano({ audioStatus: 'error', audioMessage: '声音尚未启用，请再次点击开始弹奏' })
    })
    return this.context
  }

  private async preset(id: InstrumentId, context: AudioContext): Promise<Preset> {
    const cached = this.presets.get(id)
    if (cached) return cached
    const promise = (async () => {
      const instrument = getInstrument(id)
      // `BASE_URL` includes the repository prefix on GitHub Pages (for example
      // `/piano/`). Dynamic script URLs do not get rewritten by Vite, so keep
      // the same base as the bundled player and the rest of the public assets.
      const soundfontUrl = `${import.meta.env.BASE_URL}soundfonts/${instrument.file}.js`
      await Promise.all([loadScript(playerUrl), loadScript(soundfontUrl)])
      if (!window.WebAudioFontPlayer) throw new Error('播放器加载失败')
      this.player ??= new window.WebAudioFontPlayer()
      const preset = (window as unknown as Record<string, Preset>)[`_tone_${instrument.file}`]
      if (!preset?.zones?.length) throw new Error('音色数据不完整')
      // Decode with rejection handling instead of the library's unbounded polling loader.
      await Promise.all(preset.zones.map(async (zone) => {
        if (zone.buffer) return
        if (zone.file) {
          const data = Uint8Array.from(atob(zone.file), (character) => character.charCodeAt(0))
          zone.buffer = await context.decodeAudioData(data.buffer)
        }
      }))
      this.player.adjustPreset(context, preset)
      if (preset.zones.some((zone) => !zone.buffer)) throw new Error('音色解码失败')
      return preset
    })()
    this.presets.set(id, promise)
    promise.catch(() => this.presets.delete(id))
    return promise
  }

  async activate(id = pianoStore.get().instrument) {
    let context: AudioContext
    try { context = this.unlock() } catch (error) {
      updatePiano({ audioStatus: 'error', audioMessage: String(error) }); return
    }
    if (this.readyId === id) return
    if (this.loadingId === id && this.loading) return this.loading
    const request = ++this.request
    this.loadingId = id
    updatePiano({ audioStatus: 'loading', audioMessage: '' })
    this.loading = (async () => {
      try {
        const preset = await this.preset(id, context)
        if (request !== this.request) return
        this.selectedPreset = preset
        this.readyId = id
        updatePiano({ audioStatus: 'ready', audioMessage: '' })
      } catch {
        if (request !== this.request) return
        this.selectedPreset = undefined
        this.readyId = id
        updatePiano({ audioStatus: 'fallback', audioMessage: '采样暂时不可用，正在使用基础合成音色。' })
      } finally {
        if (request === this.request) { this.loadingId = undefined; this.loading = undefined }
      }
    })()
    return this.loading
  }

  async select(id: InstrumentId) {
    this.stopAll()
    savePreferences({ instrument: id })
    await this.activate(id)
  }
  async retry() { this.readyId = undefined; await this.activate() }
  setVolume(volume: number) {
    const value = Math.min(80, Math.max(0, volume))
    savePreferences({ volume: value })
    if (this.gain && this.context) this.gain.gain.setTargetAtTime(value / 100 * 0.65, this.context.currentTime, 0.02)
  }
  async noteOn(source: string, midi: number) {
    if (midi < 36 || midi > 96) return
    const id = pianoStore.get().instrument
    const generation = this.voices.begin(source, midi)
    updatePiano({ lastNote: midi })
    await this.activate(id)
    if (!this.voices.isCurrent(source, generation) || pianoStore.get().instrument !== id) return
    if (!this.context || !this.gain || pianoStore.get().audioStatus === 'error') { this.voices.release(source); return }
    const voice = this.selectedPreset && this.player
      ? this.player.queueWaveTable(this.context, this.gain, this.selectedPreset, this.context.currentTime, midi, 30, 0.55)
      : this.fallback(midi, id)
    if (voice) this.voices.attach(source, generation, voice)
    else this.voices.release(source)
  }
  noteOff(source: string) { this.voices.release(source) }
  stopAll() { this.voices.clear() }
  private fallback(midi: number, id: InstrumentId): Voice {
    const context = this.context!
    const oscillator = context.createOscillator()
    const envelope = context.createGain()
    oscillator.type = id === 'guitar' ? 'triangle' : 'sine'
    oscillator.frequency.value = frequency(midi)
    const now = context.currentTime
    const decay = id === 'xylophone' ? 0.7 : id === 'music-box' ? 2 : 1.5
    envelope.gain.setValueAtTime(0, now)
    envelope.gain.linearRampToValueAtTime(0.25, now + 0.008)
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + decay)
    oscillator.connect(envelope).connect(this.gain!)
    oscillator.start()
    oscillator.stop(now + decay + 0.1)
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect() }
    let cancelled = false
    return { cancel: () => {
      if (cancelled) return
      cancelled = true
      envelope.gain.cancelAndHoldAtTime(context.currentTime)
      envelope.gain.setTargetAtTime(0, context.currentTime, 0.02)
      oscillator.stop(context.currentTime + 0.12)
    } }
  }
}
export const pianoEngine = new PianoEngine()
