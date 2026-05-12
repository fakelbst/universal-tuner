import type { InstrumentId } from '../domain/instruments'
import type { AudioEngine, PitchListener } from './audioEngine'
import { createAnalyserNode, requestMicrophoneStream } from './microphoneInput'
import { detectPitchHz } from './pitchDetector'
import { playReferenceTone } from './referenceSynth'

export function createBrowserAudioEngine(): AudioEngine {
  let context: AudioContext | null = null
  let currentReference: OscillatorNode | null = null

  async function ensureContext() {
    context ??= new AudioContext()

    if (context.state === 'suspended') {
      await context.resume()
    }

    return context
  }

  return {
    requestMicrophoneStream,
    async startPitchStream(stream: MediaStream, onPitch: PitchListener) {
      const audioContext = await ensureContext()
      const { analyser, source } = createAnalyserNode(audioContext, stream)
      const frame = new Float32Array(analyser.fftSize)
      let cancelled = false

      function tick() {
        if (cancelled) {
          return
        }

        analyser.getFloatTimeDomainData(frame)
        onPitch(detectPitchHz(frame, audioContext.sampleRate))
        window.requestAnimationFrame(tick)
      }

      tick()

      return () => {
        cancelled = true
        source.disconnect()
      }
    },
    async playReferenceTone(frequency: number, instrumentId: InstrumentId) {
      const audioContext = await ensureContext()
      const result = playReferenceTone(audioContext, frequency, instrumentId)
      currentReference = result.oscillator
    },
    stopReferenceTone() {
      currentReference?.stop()
      currentReference = null
    },
  }
}
