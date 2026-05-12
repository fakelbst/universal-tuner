import { useEffect, useRef, type CSSProperties } from 'react'
import type { InstrumentDefinition, InstrumentId } from '../domain/instruments'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { runInTuneFeedback } from '../motion/tunerFeedback'
import type { TunerMode, TunerState } from '../state/tunerReducer'

type TunerScreenProps = {
  state: TunerState
  instrument: InstrumentDefinition
  instruments: readonly InstrumentDefinition[]
  onEnableMicrophone: () => void | Promise<void>
  onSetInstrument: (instrumentId: InstrumentId) => void
  onSetMode: (mode: TunerMode) => void | Promise<void>
  onPlayReferenceString: (stringId: string) => void | Promise<void>
  onToggleTheme: () => void
}

function getStatusLabel(status: TunerState['status']) {
  switch (status) {
    case 'tune-up':
      return 'Tune Up'
    case 'tune-down':
      return 'Tune Down'
    case 'in-tune':
      return 'In Tune'
    case 'signal-unstable':
      return 'Hold the note a little longer'
    case 'reference':
      return 'Tap a String'
    case 'listening':
      return 'Listening'
    case 'mic-blocked':
      return 'Mic Blocked'
    default:
      return 'Ready'
  }
}

function getPermissionCopy(permission: TunerState['permission']) {
  if (permission === 'denied' || permission === 'unsupported') {
    return 'Microphone access is off. Check browser permissions and try again.'
  }

  if (permission === 'requesting') {
    return 'Waiting for your browser permission.'
  }

  return 'Let Universal Tuner listen for your next pluck.'
}

export function TunerScreen({
  state,
  instrument,
  instruments,
  onEnableMicrophone,
  onSetInstrument,
  onSetMode,
  onPlayReferenceString,
  onToggleTheme,
}: TunerScreenProps) {
  const rootRef = useRef<HTMLElement | null>(null)
  const activeStringRef = useRef<HTMLButtonElement | null>(null)
  const noteLockupRef = useRef<HTMLElement | null>(null)
  const reducedMotion = useReducedMotion()
  const stringFieldStyle = {
    '--string-count': instrument.strings.length,
  } as CSSProperties

  useEffect(() => {
    if (
      state.status === 'in-tune' &&
      rootRef.current &&
      activeStringRef.current &&
      noteLockupRef.current
    ) {
      runInTuneFeedback({
        root: rootRef.current,
        activeString: activeStringRef.current,
        noteLockup: noteLockupRef.current,
        reducedMotion,
      })
    }
  }, [reducedMotion, state.activeStringId, state.status])

  return (
    <main ref={rootRef} className="app-shell" data-theme={state.theme}>
      <header className="control-bar">
        <div className="brand-lockup">
          <p className="eyebrow">Practice</p>
          <h1>Universal Tuner</h1>
        </div>

        <div className="toolbar">
          <div className="segmented-group" role="group" aria-label="Instrument">
            {instruments.map((entry) => (
              <button
                key={entry.id}
                type="button"
                aria-pressed={entry.id === instrument.id}
                onClick={() => onSetInstrument(entry.id)}
              >
                {entry.label}
              </button>
            ))}
          </div>

          <div className="segmented-group" role="group" aria-label="Mode">
            <button
              type="button"
              aria-pressed={state.mode === 'tune'}
              onClick={() => void onSetMode('tune')}
            >
              Tune
            </button>
            <button
              type="button"
              aria-pressed={state.mode === 'reference'}
              onClick={() => void onSetMode('reference')}
            >
              Reference
            </button>
          </div>

          <button
            type="button"
            className="theme-button"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
          >
            {state.theme === 'light' ? 'Dark' : 'Light'}
          </button>
        </div>
      </header>

      <section ref={noteLockupRef} className="note-lockup" aria-live="polite">
        <p className="instrument-label">{instrument.label}</p>
        <p className="current-note">{state.displayNote ?? instrument.strings[0].note}</p>
        <p className="status-copy">{getStatusLabel(state.status)}</p>
      </section>

      <section
        className="string-field"
        aria-label={`${instrument.label} strings`}
        style={stringFieldStyle}
      >
        {instrument.strings.map((string) => (
          <button
            key={string.id}
            ref={string.id === state.activeStringId ? activeStringRef : undefined}
            type="button"
            className="string-button"
            data-active={String(string.id === state.activeStringId)}
            aria-label={string.note}
            onClick={() => {
              if (state.mode === 'reference') {
                void onPlayReferenceString(string.id)
              }
            }}
          >
            <span className="string-note">{string.note}</span>
            <span className="string-line" />
          </button>
        ))}
      </section>

      {state.mode === 'tune' && state.permission !== 'granted' ? (
        <section className="permission-panel" aria-label="Microphone access">
          <p>{getPermissionCopy(state.permission)}</p>
          <button
            type="button"
            className="primary-action"
            onClick={() => void onEnableMicrophone()}
          >
            Enable Microphone
          </button>
        </section>
      ) : (
        <footer className="status-footer">
          <span>
            {state.mode === 'reference'
              ? 'Tap a string to hear the target note.'
              : 'Pluck a string and adjust until it locks.'}
          </span>
        </footer>
      )}
    </main>
  )
}
