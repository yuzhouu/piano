import { useState } from 'react'
import { useSelector } from '@tanstack/react-store'
import { Piano, ShieldCheck, LockKeyhole, Maximize2, Minimize2, Play, LoaderCircle, Download, ChevronLeft, ChevronRight, Keyboard, Hand, Heart, Volume2, Info, RotateCcw } from 'lucide-react'
import { PianoKeyboard } from './piano-keyboard'
import { InstrumentControls } from './instrument-controls'
import { ParentGuide } from './parent-guide'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { pianoStore, savePreferences } from '@/state/piano-store'
import { pianoEngine } from '@/audio/engine'
import { getInstrument } from '@/audio/instruments'
import { midiName, solfege } from '@/lib/notes'
import { usePianoInput } from '@/hooks/use-piano-input'
import { requestFullscreen, useChildMode, useHoldToUnlock } from '@/hooks/use-child-mode'
import { usePwa } from '@/hooks/use-pwa'
import { cn } from '@/lib/utils'

function NoteFeedback() {
  const active = useSelector(pianoStore, (state) => state.activeNotes)
  return <div className={cn('note-feedback', active.length > 0 && 'is-playing')} aria-hidden="true">
    <span className="equalizer">{[0, 1, 2, 3, 4].map((value) => <i key={value} />)}</span>
    <span>{active.length ? active.map((note) => solfege(note)).join(' · ') : '每一个音符，都值得被听见'}</span>
    {active.length > 0 && <small>{active.map(midiName).join(' / ')}</small>}
  </div>
}

export function PianoRoom() {
  usePianoInput()
  const { locked, enter, leave } = useChildMode()
  const hold = useHoldToUnlock(leave)
  const pwa = usePwa()
  const [guide, setGuide] = useState(false)
  const [message, setMessage] = useState('')
  const status = useSelector(pianoStore, (state) => state.audioStatus)
  const audioMessage = useSelector(pianoStore, (state) => state.audioMessage)
  const instrument = useSelector(pianoStore, (state) => state.instrument)
  const octave = useSelector(pianoStore, (state) => state.octave)
  const labels = useSelector(pianoStore, (state) => state.showLabels)
  const fullscreen = useSelector(pianoStore, (state) => state.fullscreen)
  const offlineReady = useSelector(pianoStore, (state) => state.offlineReady)
  const changeOctave = (next: number) => { pianoEngine.stopAll(); savePreferences({ octave: next }) }
  return <div className={cn('piano-room', locked && 'room-locked')}>
    <header className="app-header">
      <a className="brand" href="/" onClick={(event) => event.preventDefault()} aria-label="小小钢琴家"><span className="brand-icon"><Piano size={23} strokeWidth={1.6} /></span><span>小小钢琴家<small>LITTLE PIANIST</small></span></a>
      <div className="header-actions">
        {locked ? <div className="unlock-control">
          <span className="locked-caption">儿童模式已开启</span>
          <Button variant="outline" size="comfortable" aria-label="长按 3 秒解锁" className="relative overflow-hidden"
            onPointerDown={(event) => { if (event.button !== 0) return; event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); hold.start() }}
            onPointerMove={(event) => { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) hold.stop() }}
            onPointerUp={hold.stop} onPointerCancel={hold.stop} onLostPointerCapture={hold.stop} onContextMenu={(event) => event.preventDefault()}>
            <span className="unlock-fill" style={{ transform: `scaleX(${hold.progress})` }} aria-hidden="true" /><LockKeyhole data-icon="inline-start" />{hold.progress > 0 ? `继续按住 ${Math.ceil(3 * (1 - hold.progress))} 秒` : '长按解锁'}
          </Button>
        </div> : <>
          <Button variant="ghost" size="comfortable" onClick={() => { pianoEngine.stopAll(); setGuide(true) }} className="guide-trigger">家长指南</Button>
          <Button variant="ghost" size="icon-lg" aria-label={fullscreen ? '退出全屏' : '进入全屏'} onClick={async () => {
            if (fullscreen) { await document.exitFullscreen(); return }
            if (!await requestFullscreen()) setMessage('当前浏览器不支持网页全屏，可添加到主屏幕后打开。')
          }}>{fullscreen ? <Minimize2 /> : <Maximize2 />}</Button>
          <Button size="comfortable" onClick={async () => { setMessage(''); if (!await enter()) setMessage('儿童模式已开启；设备防误退请使用引导式访问或应用固定。') }}><ShieldCheck data-icon="inline-start" />儿童模式</Button>
        </>}
      </div>
    </header>

    <main className="main-stage">
      <section className="introduction" aria-labelledby="piano-title">
        <h1 id="piano-title">小手指，<span>大音乐。</span></h1>
        <p>{locked ? '放心按，每一次好奇都有回响。' : '随意按下琴键，让好奇心变成旋律。'}</p>
        <div className="start-area" aria-live="polite">
          {status === 'idle' || status === 'error' ? <Button size="comfortable" onClick={() => void pianoEngine.activate()}><Play data-icon="inline-start" />开始弹奏</Button>
            : status === 'loading' ? <span className="sound-status"><LoaderCircle className="animate-spin" size={15} />正在准备{getInstrument(instrument).label}…</span>
              : <span className="sound-status"><span className="status-dot" />{getInstrument(instrument).label} · {status === 'fallback' ? '基础音色' : '声音已就绪'}</span>}
        </div>
      </section>

      <section className="instrument-stage" aria-label="演奏区">
        {!locked && <InstrumentControls />}
        <NoteFeedback />
        <PianoKeyboard />
        {!locked && <div className="piano-settings">
          <div className="play-hint"><Keyboard size={16} /><span>电脑键盘</span><span className="hint-divider">/</span><Hand size={15} /><span>鼠标或触摸</span></div>
          <div className="octave-control"><span>音区</span><Button variant="ghost" size="icon" disabled={octave === 3} onClick={() => changeOctave(octave - 1)} aria-label="降低八度"><ChevronLeft /></Button><output>{['低音', '中央', '高音'][octave - 3]} C{octave}</output><Button variant="ghost" size="icon" disabled={octave === 5} onClick={() => changeOctave(octave + 1)} aria-label="升高八度"><ChevronRight /></Button></div>
          <label className="labels-control" htmlFor="show-labels">琴键提示<Switch id="show-labels" checked={labels} onCheckedChange={(showLabels) => savePreferences({ showLabels })} /></label>
        </div>}
        {locked && <p className="child-hint"><ShieldCheck size={15} />页面误触保护已开启 · 家长长按右上角解锁</p>}
      </section>

      {(message || audioMessage) && <Alert className="mx-auto mt-5 max-w-xl"><Info /><AlertDescription>{audioMessage || message}{status === 'fallback' && !locked && <Button variant="link" onClick={() => void pianoEngine.retry()}><RotateCcw data-icon="inline-start" />重新加载采样</Button>}</AlertDescription></Alert>}
      {!locked && <div className="gentle-reminder"><Volume2 size={14} /><span>调低一点音量，给小耳朵多一点温柔。</span></div>}
    </main>

    <footer className="app-footer"><span className="footer-love"><Heart size={13} />为每一个好奇的小小音乐家</span>
      {!locked && <div className="footer-actions"><span className="offline-state">{offlineReady ? '离线已就绪' : '首次使用请保持联网'}</span><Button variant="ghost" size="sm" onClick={() => { if (pwa.canInstall) void pwa.install(); else setGuide(true) }}><Download data-icon="inline-start" />添加到主屏幕</Button></div>}
    </footer>
    <ParentGuide open={guide} setOpen={setGuide} />
  </div>
}
