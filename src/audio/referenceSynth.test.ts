import { vi } from 'vitest'
import { playReferenceTone } from './referenceSynth'

class FakeGainNode {
  gain = {
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  }

  connect = vi.fn()
}

class FakeOscillatorNode {
  type: OscillatorType = 'sine'
  frequency = { setValueAtTime: vi.fn() }
  connect = vi.fn()
  start = vi.fn()
  stop = vi.fn()
}

class FakeAudioContext {
  currentTime = 10
  destination = {}

  createGain = () => new FakeGainNode()
  createOscillator = () => new FakeOscillatorNode()
}

test('schedules a bright guitar reference note at the requested frequency', () => {
  const context = new FakeAudioContext() as unknown as AudioContext
  const result = playReferenceTone(context, 110, 'guitar')

  expect(result.oscillator.type).toBe('triangle')
  expect(result.oscillator.frequency.setValueAtTime).toHaveBeenCalledWith(110, 10)
  expect(result.oscillator.start).toHaveBeenCalledWith(10)
})
