import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { createBrowserAudioEngine } from '../audio/browserAudioEngine'
import type { AudioEngine } from '../audio/audioEngine'
import { resolveNearestString } from '../audio/noteMath'
import {
  getInstrumentDefinition,
  instrumentOrder,
  type InstrumentDefinition,
  type InstrumentId,
  type StringDefinition,
} from '../domain/instruments'
import { initialTunerState, tunerReducer, type TunerMode } from '../state/tunerReducer'

type StringLookup = {
  instrument: InstrumentDefinition
  string: StringDefinition
}

export function useTunerController(engine?: AudioEngine) {
  const [state, dispatch] = useReducer(tunerReducer, initialTunerState)
  const stateRef = useRef(state)
  const streamRef = useRef<MediaStream | null>(null)
  const stopListeningRef = useRef<(() => void) | null>(null)
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
      dispatch({ type: 'signal/unstable' })
      return
    }

    const currentInstrument = getInstrumentDefinition(stateRef.current.instrumentId)
    const match = resolveNearestString(currentInstrument.strings, pitchHz)

    dispatch({
      type: 'pitch/matched',
      stringId: match.string.id,
      note: match.string.note,
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
      await startListening(stream)
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
    const match = findStringById(instruments, stringId)

    if (!match) {
      return
    }

    if (match.instrument.id !== state.instrumentId) {
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
    dispatch({ type: 'instrument/set', instrumentId })
  }

  return {
    state,
    instrument,
    instruments,
    enableMicrophone,
    playReferenceString,
    setMode,
    setInstrument,
    toggleTheme: () => dispatch({ type: 'theme/toggled' }),
  }
}

function findStringById(
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
