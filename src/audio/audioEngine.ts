import type { InstrumentId } from '../domain/instruments'

export type PitchListener = (pitchHz: number | null) => void

export type AudioEngine = {
  requestMicrophoneStream: () => Promise<MediaStream>
  startPitchStream: (
    stream: MediaStream,
    onPitch: PitchListener,
  ) => Promise<() => void>
  playReferenceTone: (frequency: number, instrumentId: InstrumentId) => Promise<void>
  stopReferenceTone: () => void
}
