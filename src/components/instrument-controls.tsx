import { useRef } from 'react'
import { useSelector } from '@tanstack/react-store'
import { Piano, Music2, Guitar, AudioLines, Volume2, VolumeX } from 'lucide-react'
import { instruments, type InstrumentId } from '@/audio/instruments'
import { pianoEngine } from '@/audio/engine'
import { pianoStore } from '@/state/piano-store'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

const icons = [Piano, Music2, AudioLines, Guitar]
export function InstrumentControls() {
  const instrument = useSelector(pianoStore, (state) => state.instrument)
  const volume = useSelector(pianoStore, (state) => state.volume)
  const lastVolume = useRef(volume || 55)
  return <div className="instrument-controls">
    <div className="instrument-picker">
      <span className="control-caption" id="instrument-label">选一种声音</span>
      <ToggleGroup type="single" variant="instrument" size="comfortable" spacing={1} value={instrument}
        aria-labelledby="instrument-label" onValueChange={(value) => { if (value) void pianoEngine.select(value as InstrumentId) }}>
        {instruments.map((item, index) => {
          const Icon = icons[index]
          return <ToggleGroupItem key={item.id} value={item.id} aria-label={item.label}><Icon data-icon="inline-start" />{item.label}</ToggleGroupItem>
        })}
      </ToggleGroup>
    </div>
    <div className="volume-control">
      <Button variant="ghost" size="icon" aria-label={volume ? '静音' : '取消静音'} onClick={() => {
        if (volume) { lastVolume.current = volume; pianoEngine.setVolume(0) } else pianoEngine.setVolume(lastVolume.current)
      }}>{volume ? <Volume2 /> : <VolumeX />}</Button>
      <Slider aria-label="音量" value={[volume]} max={80} step={1} onValueChange={([value]) => pianoEngine.setVolume(value)} className="w-24" />
      <output aria-label="当前音量">{volume}%</output>
    </div>
  </div>
}
