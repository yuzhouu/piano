import { memo, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { useSelector } from '@tanstack/react-store'
import { pianoEngine } from '@/audio/engine'
import { pianoStore } from '@/state/piano-store'
import { notesForOctave } from '@/lib/notes'
import { cn } from '@/lib/utils'

type Note = ReturnType<typeof notesForOctave>[number]
const PianoKey = memo(function PianoKey({ note, position, total }: { note: Note; position: number; total: number }) {
  const active = useSelector(pianoStore, (state) => state.activeNotes.includes(note.midi))
  const labels = useSelector(pianoStore, (state) => state.showLabels)
  const locked = useSelector(pianoStore, (state) => state.childMode)
  const accessibleTap = () => {
    void pianoEngine.noteOn(`accessible:${note.midi}`, note.midi)
    window.setTimeout(() => pianoEngine.noteOff(`accessible:${note.midi}`), 500)
  }
  return <button
    type="button"
    className={cn('piano-key', note.black ? 'black-key' : 'white-key', active && 'key-active')}
    style={{ '--key-left': `${position / total * 100}%`, '--key-width': `${(note.black ? 0.62 : 1) / total * 100}%`, '--note-color': `var(--note-${note.midi % 7})` } as CSSProperties}
    data-note={note.midi} data-active={active} aria-label={`${note.label} ${note.name}`} aria-pressed={active}
    tabIndex={locked ? -1 : 0}
    onClick={(event) => { if (event.detail === 0) accessibleTap() }}
  >
    {!note.black && <span className="key-color-mark" aria-hidden="true" />}
    {labels && <span className="key-label"><span>{note.label}</span><span className="key-shortcut">{note.shortcut}</span></span>}
  </button>
})

export function PianoKeyboard() {
  const octave = useSelector(pianoStore, (state) => state.octave)
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 640px)').matches)
  const pointers = useRef(new Map<number, number | null>())
  useEffect(() => {
    const media = window.matchMedia('(max-width: 640px)')
    const change = () => { setCompact(media.matches); pianoEngine.stopAll(); pointers.current.clear() }
    media.addEventListener('change', change)
    return () => { media.removeEventListener('change', change); pianoEngine.stopAll() }
  }, [])
  useEffect(() => { pointers.current.clear() }, [octave])
  const notes = notesForOctave(octave, compact)
  const whiteCount = notes.filter((note) => !note.black).length
  let whiteIndex = 0
  const noteAt = (event: PointerEvent) => {
    const element = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-note]')
    return element ? Number(element.dataset.note) : null
  }
  const move = (event: PointerEvent) => {
    if (!pointers.current.has(event.pointerId)) return
    const next = noteAt(event)
    if (pointers.current.get(event.pointerId) === next) return
    pianoEngine.noteOff(`pointer:${event.pointerId}`)
    pointers.current.set(event.pointerId, next)
    if (next !== null) void pianoEngine.noteOn(`pointer:${event.pointerId}`, next)
  }
  const end = (event: PointerEvent) => { pointers.current.delete(event.pointerId); pianoEngine.noteOff(`pointer:${event.pointerId}`) }
  return <div className="piano-case">
    <div className="piano-rail" aria-hidden="true"><span className="rail-dot" /><span>LITTLE PIANIST</span><span className="rail-lines"><i /><i /><i /><i /><i /></span></div>
    <div className="piano-keyboard" role="group" aria-label="钢琴键盘"
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        if (event.button !== 0) return
        const note = noteAt(event)
        if (note === null) return
        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
        pointers.current.set(event.pointerId, note)
        void pianoEngine.noteOn(`pointer:${event.pointerId}`, note)
      }}
      onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}
    >
      {notes.map((note) => {
        const position = note.black ? whiteIndex - 0.31 : whiteIndex++
        return <PianoKey key={note.midi} note={note} position={position} total={whiteCount} />
      })}
    </div>
    <div className="piano-lip" />
  </div>
}
