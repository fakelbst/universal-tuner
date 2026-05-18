import { act, renderHook } from '@testing-library/react'
import { vi } from 'vitest'
import type { AudioEngine } from '../audio/audioEngine'
import { useTunerController } from './useTunerController'

function createFakeEngine(): AudioEngine & { emitPitch: (pitchHz: number | null) => void } {
  let listener: ((pitchHz: number | null) => void) | null = null

  return {
    requestMicrophoneStream: vi.fn().mockResolvedValue({ id: 'stream' } as MediaStream),
    startPitchStream: vi.fn().mockImplementation(async (_stream, onPitch) => {
      listener = onPitch

      return () => {
        listener = null
      }
    }),
    playReferenceTone: vi.fn().mockResolvedValue(undefined),
    stopReferenceTone: vi.fn(),
    emitPitch(pitchHz: number | null) {
      listener?.(pitchHz)
    },
  } as AudioEngine & { emitPitch: (pitchHz: number | null) => void }
}

test('requests microphone access and enters listening mode', async () => {
  const engine = createFakeEngine()
  const { result } = renderHook(() => useTunerController(engine))

  await act(async () => {
    await result.current.enableMicrophone()
  })

  expect(result.current.state.permission).toBe('granted')
  expect(result.current.state.status).toBe('listening')
})

test('maps live pitch input to an in-tune guitar string', async () => {
  const engine = createFakeEngine()
  const { result } = renderHook(() => useTunerController(engine))

  await act(async () => {
    await result.current.enableMicrophone()
  })

  act(() => {
    engine.emitPitch(110)
  })

  expect(result.current.state.activeStringId).toBe('guitar-a2')
  expect(result.current.state.status).toBe('in-tune')
  expect(result.current.state.centsOffset).toBe(0)
})

test('maps live pitch input against the selected instrument', async () => {
  const engine = createFakeEngine()
  const { result } = renderHook(() => useTunerController(engine))

  act(() => {
    result.current.setInstrument('bass')
  })

  await act(async () => {
    await result.current.enableMicrophone()
  })

  act(() => {
    engine.emitPitch(55)
  })

  expect(result.current.state.activeStringId).toBe('bass-a1')
  expect(result.current.state.status).toBe('in-tune')
})

test('keeps automatic tracking locked to one string until the signal drops', async () => {
  const engine = createFakeEngine()
  const { result } = renderHook(() => useTunerController(engine))

  await act(async () => {
    await result.current.enableMicrophone()
  })

  act(() => {
    engine.emitPitch(110)
  })

  expect(result.current.state.activeStringId).toBe('guitar-a2')
  expect(result.current.state.displayNote).toBe('A2')
  expect(result.current.state.status).toBe('in-tune')

  act(() => {
    engine.emitPitch(146.83)
  })

  expect(result.current.state.activeStringId).toBe('guitar-a2')
  expect(result.current.state.displayNote).toBe('A2')
  expect(result.current.state.status).toBe('tune-down')

  act(() => {
    engine.emitPitch(null)
  })

  act(() => {
    engine.emitPitch(146.83)
  })

  expect(result.current.state.activeStringId).toBe('guitar-d3')
  expect(result.current.state.displayNote).toBe('D3')
  expect(result.current.state.status).toBe('in-tune')
})

test('plays the selected reference note in reference mode', async () => {
  const engine = createFakeEngine()
  const { result } = renderHook(() => useTunerController(engine))

  await act(async () => {
    await result.current.setMode('reference')
    await result.current.playReferenceString('uke-a4')
  })

  expect(engine.playReferenceTone).toHaveBeenCalledWith(440, 'ukulele')
  expect(result.current.state.displayNote).toBe('A4')
})

test('locks tracking to the selected manual string', async () => {
  const engine = createFakeEngine()
  const { result } = renderHook(() => useTunerController(engine))

  await act(async () => {
    await result.current.enableMicrophone()
  })

  act(() => {
    result.current.setTrackingMode('manual')
    result.current.selectManualString('guitar-d3')
  })

  act(() => {
    engine.emitPitch(110)
  })

  expect(result.current.state.trackingMode).toBe('manual')
  expect(result.current.state.activeStringId).toBe('guitar-d3')
  expect(result.current.state.displayNote).toBe('D3')
  expect(result.current.state.status).toBe('tune-up')
})
