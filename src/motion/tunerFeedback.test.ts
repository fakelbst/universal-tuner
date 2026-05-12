import { gsap } from 'gsap'
import { vi } from 'vitest'
import { runInTuneFeedback } from './tunerFeedback'

vi.mock('gsap', () => ({
  gsap: {
    fromTo: vi.fn(),
    set: vi.fn(),
  },
}))

test('skips the burst animation when reduced motion is enabled', () => {
  const root = document.createElement('div')
  const activeString = document.createElement('div')
  const noteLockup = document.createElement('div')
  const vibrate = vi.fn()

  Object.defineProperty(navigator, 'vibrate', {
    configurable: true,
    value: vibrate,
  })

  runInTuneFeedback({
    root,
    activeString,
    noteLockup,
    reducedMotion: true,
  })

  expect(gsap.fromTo).not.toHaveBeenCalled()
  expect(vibrate).not.toHaveBeenCalled()
})

test('vibrates once when haptics are available and reduced motion is off', () => {
  const root = document.createElement('div')
  const activeString = document.createElement('div')
  const noteLockup = document.createElement('div')
  const vibrate = vi.fn()

  Object.defineProperty(navigator, 'vibrate', {
    configurable: true,
    value: vibrate,
  })

  runInTuneFeedback({
    root,
    activeString,
    noteLockup,
    reducedMotion: false,
  })

  expect(vibrate).toHaveBeenCalledWith(18)
})
