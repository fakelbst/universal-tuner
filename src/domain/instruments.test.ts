import { getInstrumentDefinition, instrumentOrder } from './instruments'

test('exposes the supported instrument order', () => {
  expect(instrumentOrder).toEqual(['guitar', 'bass', 'ukulele'])
})

test('returns six standard guitar strings from low to high', () => {
  expect(getInstrumentDefinition('guitar').strings.map((string) => string.note)).toEqual([
    'E2',
    'A2',
    'D3',
    'G3',
    'B3',
    'E4',
  ])
})

test('returns four standard bass strings from low to high', () => {
  expect(getInstrumentDefinition('bass').strings.map((string) => string.note)).toEqual([
    'E1',
    'A1',
    'D2',
    'G2',
  ])
})

test('returns four standard ukulele strings with re-entrant high G', () => {
  expect(getInstrumentDefinition('ukulele').strings.map((string) => string.note)).toEqual([
    'G4',
    'C4',
    'E4',
    'A4',
  ])
})

test('returns frozen instrument data', () => {
  const guitar = getInstrumentDefinition('guitar')

  expect(Object.isFrozen(guitar)).toBe(true)
  expect(Object.isFrozen(guitar.strings)).toBe(true)
  expect(guitar.strings.every((stringDefinition) => Object.isFrozen(stringDefinition))).toBe(true)
  expect(Object.isFrozen(instrumentOrder)).toBe(true)

  if (false) {
    // @ts-expect-error strings are readonly
    guitar.strings.push({ id: 'test', note: 'C0', frequency: 16.35 })
  }
})
