export async function requestMicrophoneStream(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('unsupported')
  }

  return navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
    video: false,
  })
}

export function createAnalyserNode(
  context: AudioContext,
  stream: MediaStream,
): { analyser: AnalyserNode; source: MediaStreamAudioSourceNode } {
  const source = context.createMediaStreamSource(stream)
  const analyser = context.createAnalyser()

  analyser.fftSize = 2048
  analyser.smoothingTimeConstant = 0.2
  source.connect(analyser)

  return { analyser, source }
}
