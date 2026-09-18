import { describe, expect, it, vi } from 'vitest'
import { VoiceRegistry } from './voice-registry'

describe('VoiceRegistry', () => {
  it('keeps sources independent and cancels stale async voices', () => {
    const changed = vi.fn()
    const registry = new VoiceRegistry(changed, 2)
    const first = registry.begin('finger-a', 60)
    const second = registry.begin('finger-b', 64)
    const cancelA = vi.fn()
    const cancelB = vi.fn()
    expect(registry.attach('finger-a', first, { cancel: cancelA })).toBe(true)
    expect(registry.attach('finger-b', second, { cancel: cancelB })).toBe(true)
    registry.release('finger-a')
    expect(cancelA).toHaveBeenCalledOnce()
    expect(registry.notes).toEqual([64])
    expect(registry.attach('finger-a', first, { cancel: cancelA })).toBe(false)
    expect(cancelA).toHaveBeenCalledTimes(2)
  })
  it('enforces a voice limit by releasing the oldest source', () => {
    const cancel = vi.fn()
    const registry = new VoiceRegistry(() => {}, 1)
    registry.begin('a', 60)
    registry.attach('a', 1, { cancel })
    registry.begin('b', 62)
    expect(cancel).toHaveBeenCalledOnce()
    expect(registry.notes).toEqual([62])
  })
})
