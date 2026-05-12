import type { StringDefinition } from '../domain/instruments'

export type TuningDirection = 'flat' | 'sharp' | 'in-tune'

export type StringMatch = {
  string: StringDefinition
  centsOffset: number
  direction: TuningDirection
}

export function getCentsOffset(pitchHz: number, targetHz: number): number {
  return Math.round(1200 * Math.log2(pitchHz / targetHz))
}

export function getTuningDirection(centsOffset: number, tolerance = 5): TuningDirection {
  if (Math.abs(centsOffset) <= tolerance) {
    return 'in-tune'
  }

  return centsOffset < 0 ? 'flat' : 'sharp'
}

export function resolveNearestString(
  strings: readonly StringDefinition[],
  pitchHz: number,
): StringMatch {
  if (strings.length === 0) {
    throw new Error('Cannot resolve a pitch without string definitions')
  }

  return strings.reduce<StringMatch>((closest, string) => {
    const centsOffset = getCentsOffset(pitchHz, string.frequency)
    const candidate = {
      string,
      centsOffset,
      direction: getTuningDirection(centsOffset),
    }

    return Math.abs(candidate.centsOffset) < Math.abs(closest.centsOffset)
      ? candidate
      : closest
  }, createStringMatch(strings[0], pitchHz))
}

function createStringMatch(string: StringDefinition, pitchHz: number): StringMatch {
  const centsOffset = getCentsOffset(pitchHz, string.frequency)

  return {
    string,
    centsOffset,
    direction: getTuningDirection(centsOffset),
  }
}
