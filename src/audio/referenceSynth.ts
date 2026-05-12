import type { InstrumentId } from '../domain/instruments'

type SynthVoice = {
  type: OscillatorType
  attack: number
  decay: number
}

export type ScheduledReferenceTone = {
  oscillator: OscillatorNode
  gainNode: GainNode
}

const synthVoices: Record<InstrumentId, SynthVoice> = {
  guitar: { type: 'triangle', attack: 0.01, decay: 1 },
  bass: { type: 'sawtooth', attack: 0.015, decay: 1.4 },
  ukulele: { type: 'triangle', attack: 0.008, decay: 0.7 },
}

export function playReferenceTone(
  context: AudioContext,
  frequency: number,
  instrumentId: InstrumentId,
): ScheduledReferenceTone {
  const voice = synthVoices[instrumentId]
  const oscillator = context.createOscillator()
  const gainNode = context.createGain()
  const startTime = context.currentTime

  oscillator.type = voice.type
  oscillator.frequency.setValueAtTime(frequency, startTime)

  gainNode.gain.setValueAtTime(0.0001, startTime)
  gainNode.gain.linearRampToValueAtTime(0.2, startTime + voice.attack)
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + voice.decay)

  oscillator.connect(gainNode)
  gainNode.connect(context.destination)
  oscillator.start(startTime)
  oscillator.stop(startTime + voice.decay + 0.05)

  return { oscillator, gainNode }
}
