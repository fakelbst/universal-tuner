import { detectPitchHz } from './pitchDetector'

function createSineWave(frequency: number, sampleRate = 44100, sampleSize = 4096) {
  return Float32Array.from({ length: sampleSize }, (_, index) =>
    Math.sin((2 * Math.PI * frequency * index) / sampleRate),
  )
}

test('detects a 110hz waveform within one hertz', () => {
  const detected = detectPitchHz(createSineWave(110), 44100)

  expect(detected).not.toBeNull()
  expect(detected!).toBeGreaterThan(109)
  expect(detected!).toBeLessThan(111)
})

test('returns null for near-silent input', () => {
  expect(detectPitchHz(new Float32Array(2048), 44100)).toBeNull()
})
