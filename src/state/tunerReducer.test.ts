import { initialTunerState, tunerReducer } from './tunerReducer'

test('toggles the theme from light to dark', () => {
  const next = tunerReducer(initialTunerState, { type: 'theme/toggled' })

  expect(next.theme).toBe('dark')
})

test('switches to reference mode and stores the tapped string', () => {
  const referenceState = tunerReducer(initialTunerState, {
    type: 'mode/set',
    mode: 'reference',
  })

  const next = tunerReducer(referenceState, {
    type: 'reference/string-selected',
    stringId: 'guitar-a2',
    note: 'A2',
  })

  expect(next.mode).toBe('reference')
  expect(next.activeStringId).toBe('guitar-a2')
  expect(next.displayNote).toBe('A2')
})

test('records an in-tune live pitch match', () => {
  const next = tunerReducer(initialTunerState, {
    type: 'pitch/matched',
    stringId: 'guitar-d3',
    note: 'D3',
    centsOffset: 0,
    direction: 'in-tune',
  })

  expect(next.activeStringId).toBe('guitar-d3')
  expect(next.status).toBe('in-tune')
  expect(next.displayNote).toBe('D3')
  expect(next.centsOffset).toBe(0)
})

test('enters manual tracking with the selected string', () => {
  const next = tunerReducer(initialTunerState, {
    type: 'tracking/set',
    trackingMode: 'manual',
    stringId: 'guitar-e2',
    note: 'E2',
  })

  expect(next.trackingMode).toBe('manual')
  expect(next.activeStringId).toBe('guitar-e2')
  expect(next.displayNote).toBe('E2')
})

test('returns to listening when switching from reference back to tune', () => {
  const listeningState = {
    ...initialTunerState,
    permission: 'granted' as const,
    status: 'reference' as const,
    mode: 'reference' as const,
  }

  const next = tunerReducer(listeningState, {
    type: 'mode/set',
    mode: 'tune',
  })

  expect(next.status).toBe('listening')
})
