import type { TuningDirection } from '../audio/noteMath'
import type { InstrumentId } from '../domain/instruments'

export type ThemeMode = 'light' | 'dark'
export type TunerMode = 'tune' | 'reference'
export type TrackingMode = 'automatic' | 'manual'
export type PermissionState = 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported'
export type TunerStatus =
  | 'idle'
  | 'listening'
  | 'tune-up'
  | 'tune-down'
  | 'in-tune'
  | 'signal-unstable'
  | 'mic-blocked'
  | 'reference'

export type TunerState = {
  instrumentId: InstrumentId
  mode: TunerMode
  theme: ThemeMode
  permission: PermissionState
  status: TunerStatus
  trackingMode: TrackingMode
  activeStringId: string | null
  displayNote: string | null
  centsOffset: number | null
}

export type TunerAction =
  | { type: 'theme/toggled' }
  | { type: 'mode/set'; mode: TunerMode }
  | {
      type: 'tracking/set'
      trackingMode: TrackingMode
      stringId?: string | null
      note?: string | null
    }
  | { type: 'instrument/set'; instrumentId: InstrumentId }
  | { type: 'manual-string/set'; stringId: string; note: string }
  | { type: 'permission/requested' }
  | { type: 'permission/granted' }
  | { type: 'permission/denied' }
  | { type: 'permission/unsupported' }
  | { type: 'signal/unstable' }
  | { type: 'reference/string-selected'; stringId: string; note: string }
  | {
      type: 'pitch/matched'
      stringId: string
      note: string
      centsOffset: number
      direction: TuningDirection
    }

export const initialTunerState: TunerState = {
  instrumentId: 'guitar',
  mode: 'tune',
  theme: 'light',
  permission: 'idle',
  status: 'idle',
  trackingMode: 'automatic',
  activeStringId: null,
  displayNote: null,
  centsOffset: null,
}

export function tunerReducer(state: TunerState, action: TunerAction): TunerState {
  switch (action.type) {
    case 'theme/toggled':
      return {
        ...state,
        theme: state.theme === 'light' ? 'dark' : 'light',
      }
    case 'mode/set':
      return {
        ...state,
        mode: action.mode,
        status:
          action.mode === 'reference'
            ? 'reference'
            : state.permission === 'granted'
              ? 'listening'
              : state.status,
      }
    case 'tracking/set':
      return {
        ...state,
        trackingMode: action.trackingMode,
        activeStringId: action.stringId ?? state.activeStringId,
        displayNote: action.note ?? state.displayNote,
        centsOffset: null,
        status:
          state.mode === 'reference'
            ? 'reference'
            : state.permission === 'granted'
              ? 'listening'
              : state.status,
      }
    case 'instrument/set':
      return {
        ...state,
        instrumentId: action.instrumentId,
        activeStringId: null,
        displayNote: null,
        centsOffset: null,
      }
    case 'manual-string/set':
      return {
        ...state,
        activeStringId: action.stringId,
        displayNote: action.note,
        centsOffset: null,
        status:
          state.mode === 'reference'
            ? 'reference'
            : state.permission === 'granted'
              ? 'listening'
              : state.status,
      }
    case 'permission/requested':
      return { ...state, permission: 'requesting' }
    case 'permission/granted':
      return {
        ...state,
        permission: 'granted',
        status: state.mode === 'reference' ? 'reference' : 'listening',
      }
    case 'permission/denied':
      return { ...state, permission: 'denied', status: 'mic-blocked' }
    case 'permission/unsupported':
      return { ...state, permission: 'unsupported', status: 'mic-blocked' }
    case 'signal/unstable':
      return { ...state, status: 'signal-unstable', centsOffset: null }
    case 'reference/string-selected':
      return {
        ...state,
        mode: 'reference',
        status: 'reference',
        activeStringId: action.stringId,
        displayNote: action.note,
        centsOffset: null,
      }
    case 'pitch/matched':
      return {
        ...state,
        activeStringId: action.stringId,
        displayNote: action.note,
        centsOffset: action.centsOffset,
        status: mapDirectionToStatus(action.direction),
      }
  }
}

function mapDirectionToStatus(direction: TuningDirection): TunerStatus {
  if (direction === 'flat') {
    return 'tune-up'
  }

  if (direction === 'sharp') {
    return 'tune-down'
  }

  return 'in-tune'
}
