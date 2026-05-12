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
    direction: 'in-tune',
  })

  expect(next.activeStringId).toBe('guitar-d3')
  expect(next.status).toBe('in-tune')
  expect(next.displayNote).toBe('D3')
})
