import { getInstrumentDefinition } from '../domain/instruments'
import { getCentsOffset, getTuningDirection, resolveNearestString } from './noteMath'

test('returns zero cents for an exact pitch match', () => {
  expect(getCentsOffset(110, 110)).toBe(0)
})

test('classifies offsets inside tolerance as in tune', () => {
  expect(getTuningDirection(3)).toBe('in-tune')
  expect(getTuningDirection(-6)).toBe('flat')
  expect(getTuningDirection(7)).toBe('sharp')
})

test('resolves the closest guitar string for a detected pitch', () => {
  const match = resolveNearestString(getInstrumentDefinition('guitar').strings, 147.4)

  expect(match.string.note).toBe('D3')
  expect(match.direction).toBe('sharp')
})
