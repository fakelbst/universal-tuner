import { vi } from 'vitest'
import { requestMicrophoneStream } from './microphoneInput'

test('requests a mono microphone stream with tuning-friendly constraints', async () => {
  const stream = { id: 'demo-stream' } as MediaStream
  const getUserMedia = vi.fn().mockResolvedValue(stream)

  vi.stubGlobal('navigator', {
    mediaDevices: { getUserMedia },
  })

  await expect(requestMicrophoneStream()).resolves.toBe(stream)
  expect(getUserMedia).toHaveBeenCalledWith({
    audio: {
      channelCount: 1,
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
    video: false,
  })
})
