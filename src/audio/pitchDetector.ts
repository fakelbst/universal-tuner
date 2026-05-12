const silenceThreshold = 0.01
const minDetectableFrequency = 60
const maxDetectableFrequency = 1000

export function detectPitchHz(samples: Float32Array, sampleRate: number): number | null {
  if (samples.length === 0) {
    return null
  }

  const rootMeanSquare = getRootMeanSquare(samples)

  if (rootMeanSquare < silenceThreshold) {
    return null
  }

  const minOffset = Math.floor(sampleRate / maxDetectableFrequency)
  const maxOffset = Math.min(
    Math.floor(sampleRate / minDetectableFrequency),
    samples.length - 1,
  )
  let bestOffset = -1
  let bestCorrelation = 0

  for (let offset = minOffset; offset <= maxOffset; offset += 1) {
    const correlation = getNormalizedCorrelation(samples, offset)

    if (correlation > bestCorrelation) {
      bestCorrelation = correlation
      bestOffset = offset
    }
  }

  if (bestOffset < 0 || bestCorrelation < 0.2) {
    return null
  }

  return sampleRate / bestOffset
}

function getRootMeanSquare(samples: Float32Array) {
  let sum = 0

  for (const sample of samples) {
    sum += sample * sample
  }

  return Math.sqrt(sum / samples.length)
}

function getNormalizedCorrelation(samples: Float32Array, offset: number) {
  let correlation = 0
  let leftEnergy = 0
  let rightEnergy = 0

  for (let index = 0; index < samples.length - offset; index += 1) {
    const left = samples[index]
    const right = samples[index + offset]

    correlation += left * right
    leftEnergy += left * left
    rightEnergy += right * right
  }

  if (leftEnergy === 0 || rightEnergy === 0) {
    return 0
  }

  return correlation / Math.sqrt(leftEnergy * rightEnergy)
}
