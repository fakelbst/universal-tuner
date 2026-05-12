export type InstrumentId = 'guitar' | 'bass' | 'ukulele'

export type StringDefinition = {
  readonly id: string
  readonly note: string
  readonly frequency: number
}

export type InstrumentDefinition = {
  readonly id: InstrumentId
  readonly label: string
  readonly strings: readonly StringDefinition[]
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (Array.isArray(value)) {
    for (const item of value) {
      deepFreeze(item)
    }
  } else if (value !== null && typeof value === 'object') {
    for (const nestedValue of Object.values(value as Record<string, unknown>)) {
      deepFreeze(nestedValue)
    }
  }

  return Object.freeze(value)
}

const instrumentDefinitions = deepFreeze<Record<InstrumentId, InstrumentDefinition>>({
  guitar: {
    id: 'guitar',
    label: 'Guitar',
    strings: [
      { id: 'guitar-e2', note: 'E2', frequency: 82.41 },
      { id: 'guitar-a2', note: 'A2', frequency: 110.0 },
      { id: 'guitar-d3', note: 'D3', frequency: 146.83 },
      { id: 'guitar-g3', note: 'G3', frequency: 196.0 },
      { id: 'guitar-b3', note: 'B3', frequency: 246.94 },
      { id: 'guitar-e4', note: 'E4', frequency: 329.63 },
    ],
  },
  bass: {
    id: 'bass',
    label: 'Bass',
    strings: [
      { id: 'bass-e1', note: 'E1', frequency: 41.2 },
      { id: 'bass-a1', note: 'A1', frequency: 55.0 },
      { id: 'bass-d2', note: 'D2', frequency: 73.42 },
      { id: 'bass-g2', note: 'G2', frequency: 98.0 },
    ],
  },
  ukulele: {
    id: 'ukulele',
    label: 'Ukulele',
    strings: [
      { id: 'uke-g4', note: 'G4', frequency: 392.0 },
      { id: 'uke-c4', note: 'C4', frequency: 261.63 },
      { id: 'uke-e4', note: 'E4', frequency: 329.63 },
      { id: 'uke-a4', note: 'A4', frequency: 440.0 },
    ],
  },
})

export const instrumentOrder: readonly InstrumentId[] = Object.freeze(
  Object.keys(instrumentDefinitions) as InstrumentId[],
)

export function getInstrumentDefinition(id: InstrumentId): InstrumentDefinition {
  return instrumentDefinitions[id]
}
