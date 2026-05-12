import { gsap } from 'gsap'

type FeedbackElements = {
  root: HTMLElement
  activeString: HTMLElement
  noteLockup: HTMLElement
  reducedMotion: boolean
}

export function runInTuneFeedback({
  root,
  activeString,
  noteLockup,
  reducedMotion,
}: FeedbackElements) {
  root.style.setProperty('--signal-flash', '1')

  if (reducedMotion) {
    gsap.set([activeString, noteLockup], { clearProps: 'transform' })
  } else {
    gsap.fromTo(
      activeString,
      { scaleY: 0.96, transformOrigin: 'center center' },
      { scaleY: 1, duration: 0.24, ease: 'power3.out' },
    )
    gsap.fromTo(
      noteLockup,
      { scale: 0.98 },
      { scale: 1, duration: 0.18, ease: 'power3.out' },
    )
    navigator.vibrate?.(18)
  }

  window.setTimeout(() => {
    root.style.removeProperty('--signal-flash')
  }, 220)
}
