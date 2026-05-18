import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { createBrowserAudioEngine } from '../audio/browserAudioEngine'
import type { AudioEngine } from '../audio/audioEngine'
import { getCentsOffset, getTuningDirection, resolveNearestString } from '../audio/noteMath'
import {
  getInstrumentDefinition,
  instrumentOrder,
  type InstrumentDefinition,
  type InstrumentId,
  type StringDefinition,
} from '../domain/instruments'
import {
  initialTunerState,
  tunerReducer,
  type TrackingMode,
  type TunerMode,
  type TunerState,
} from '../state/tunerReducer'

type StringLookup = {
  instrument: InstrumentDefinition
  string: StringDefinition
}

export function useTunerController(engine?: AudioEngine) {
  const [state, dispatch] = useReducer(tunerReducer, initialTunerState)
  const stateRef = useRef(state)
  const streamRef = useRef<MediaStream | null>(null)
  const stopListeningRef = useRef<(() => void) | null>(null)
  const automaticStringLockRef = useRef<string | null>(null)
  const resolvedEngine = useMemo(() => engine ?? createBrowserAudioEngine(), [engine])
  const instruments = useMemo(() => instrumentOrder.map(getInstrumentDefinition), [])
  const instrument = useMemo(
    () => getInstrumentDefinition(state.instrumentId),
    [state.instrumentId],
  )

  useEffect(() => {
    stateRef.current = state
  }, [state])

  const stopListening = useCallback(() => {
    stopListeningRef.current?.()
    stopListeningRef.current = null
  }, [])

  const handlePitch = useCallback((pitchHz: number | null) => {
    if (pitchHz == null) {
      automaticStringLockRef.current = null
      dispatch({ type: 'signal/unstable' })
      return
    }

    const currentState = stateRef.current
    const match = resolvePitchMatch(currentState, pitchHz, automaticStringLockRef.current)

    if (currentState.trackingMode === 'automatic') {
      automaticStringLockRef.current = match.string.id
    }

    dispatch({
      type: 'pitch/matched',
      stringId: match.string.id,
      note: match.string.note,
      centsOffset: match.centsOffset,
      direction: match.direction,
    })
  }, [])

  const startListening = useCallback(
    async (stream: MediaStream) => {
      stopListening()
      stopListeningRef.current = await resolvedEngine.startPitchStream(stream, handlePitch)
    },
    [handlePitch, resolvedEngine, stopListening],
  )

  async function enableMicrophone() {
    dispatch({ type: 'permission/requested' })

    try {
      const stream = await resolvedEngine.requestMicrophoneStream()
      streamRef.current = stream
      dispatch({ type: 'permission/granted' })

      if (stateRef.current.mode === 'tune') {
        await startListening(stream)
      }
    } catch (error) {
      dispatch({
        type:
          error instanceof Error && error.message === 'unsupported'
            ? 'permission/unsupported'
            : 'permission/denied',
      })
    }
  }

  async function setMode(mode: TunerMode) {
    automaticStringLockRef.current = null
    dispatch({ type: 'mode/set', mode })

    if (mode === 'reference') {
      stopListening()
      return
    }

    resolvedEngine.stopReferenceTone()

    if (streamRef.current) {
      await startListening(streamRef.current)
    }
  }

  async function playReferenceString(stringId: string) {
    const match = findStringAcrossInstruments(instruments, stringId)

    if (!match) {
      return
    }

    if (match.instrument.id !== stateRef.current.instrumentId) {
      dispatch({ type: 'instrument/set', instrumentId: match.instrument.id })
    }

    dispatch({
      type: 'reference/string-selected',
      stringId: match.string.id,
      note: match.string.note,
    })

    await resolvedEngine.playReferenceTone(match.string.frequency, match.instrument.id)
  }

  function setInstrument(instrumentId: InstrumentId) {
    automaticStringLockRef.current = null
    dispatch({ type: 'instrument/set', instrumentId })

    if (stateRef.current.trackingMode === 'manual') {
      const [firstString] = getInstrumentDefinition(instrumentId).strings

      if (firstString) {
        dispatch({
          type: 'manual-string/set',
          stringId: firstString.id,
          note: firstString.note,
        })
      }
    }
  }

  function setTrackingMode(trackingMode: TrackingMode) {
    automaticStringLockRef.current = null

    if (trackingMode === 'manual') {
      const currentInstrument = getInstrumentDefinition(stateRef.current.instrumentId)
      const currentString = findStringById(currentInstrument.strings, stateRef.current.activeStringId)
      const targetString = currentString ?? currentInstrument.strings[0]

      dispatch({
        type: 'tracking/set',
        trackingMode,
        stringId: targetString?.id ?? null,
        note: targetString?.note ?? null,
      })

      return
    }

    dispatch({ type: 'tracking/set', trackingMode })
  }

  function selectManualString(stringId: string) {
    automaticStringLockRef.current = null
    const currentInstrument = getInstrumentDefinition(stateRef.current.instrumentId)
    const string = findStringById(currentInstrument.strings, stringId)

    if (!string) {
      return
    }

    dispatch({
      type: 'manual-string/set',
      stringId: string.id,
      note: string.note,
    })
  }

  return {
    state,
    instrument,
    instruments,
    enableMicrophone,
    playReferenceString,
    setMode,
    setInstrument,
    setTrackingMode,
    selectManualString,
    toggleTheme: () => dispatch({ type: 'theme/toggled' }),
  }
}

function findStringAcrossInstruments(
  instruments: readonly InstrumentDefinition[],
  stringId: string,
): StringLookup | null {
  for (const instrument of instruments) {
    const string = instrument.strings.find((entry) => entry.id === stringId)

    if (string) {
      return { instrument, string }
    }
  }

  return null
}

function resolvePitchMatch(
  state: TunerState,
  pitchHz: number,
  automaticStringLockId: string | null,
) {
  const currentInstrument = getInstrumentDefinition(state.instrumentId)

  if (state.trackingMode === 'manual') {
    const targetString = findStringById(currentInstrument.strings, state.activeStringId)

    if (targetString) {
      return resolveStringMatch(targetString, pitchHz)
    }
  }

  const lockedString = findStringById(currentInstrument.strings, automaticStringLockId)

  if (lockedString) {
    return resolveStringMatch(lockedString, pitchHz)
  }

  return resolveNearestString(currentInstrument.strings, pitchHz)
}

function resolveStringMatch(string: StringDefinition, pitchHz: number) {
  const centsOffset = getCentsOffset(pitchHz, string.frequency)

  return {
    string,
    centsOffset,
    direction: getTuningDirection(centsOffset),
  }
}

function findStringById(
  strings: readonly StringDefinition[],
  stringId: string | null,
): StringDefinition | null {
  if (!stringId) {
    return null
  }

  return strings.find((entry) => entry.id === stringId) ?? null
}
