import { useEffect, useRef, type CSSProperties } from 'react'
import type { InstrumentDefinition, InstrumentId } from '../domain/instruments'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { runInTuneFeedback } from '../motion/tunerFeedback'
import type {
  TrackingMode,
  TunerMode,
  TunerState,
} from '../state/tunerReducer'

type TunerScreenProps = {
  state: TunerState
  instrument: InstrumentDefinition
  instruments: readonly InstrumentDefinition[]
  onEnableMicrophone: () => void | Promise<void>
  onSelectManualString: (stringId: string) => void
  onSetInstrument: (instrumentId: InstrumentId) => void
  onSetMode: (mode: TunerMode) => void | Promise<void>
  onSetTrackingMode: (trackingMode: TrackingMode) => void
  onPlayReferenceString: (stringId: string) => void | Promise<void>
  onToggleTheme: () => void
}

type MicrophoneCardState = {
  label: string
  pill: string
  description: string
  actionLabel: string
  actionDisabled: boolean
  tone: 'ready' | 'attention' | 'muted'
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

function getMicrophoneCardState(state: TunerState): MicrophoneCardState {
  if (state.permission === 'granted') {
    if (state.mode === 'reference') {
      return {
        label: 'Standby',
        pill: 'Ready',
        description: 'Microphone permission is on. Switch back to Tune whenever you want live pitch.',
        actionLabel: 'Mic Ready',
        actionDisabled: true,
        tone: 'ready',
      }
    }

    return {
      label: 'Listening',
      pill: 'Live',
      description: 'The input is open and waiting for your next pluck.',
      actionLabel: 'Mic Live',
      actionDisabled: true,
      tone: 'ready',
    }
  }

  if (state.permission === 'requesting') {
    return {
      label: 'Requesting',
      pill: 'Waiting',
      description: 'Your browser is asking for microphone access right now.',
      actionLabel: 'Waiting',
      actionDisabled: true,
      tone: 'attention',
    }
  }

  if (state.permission === 'denied') {
    return {
      label: 'Blocked',
      pill: 'Access Off',
      description: 'Microphone access is off. Check browser permissions and try again.',
      actionLabel: 'Try Again',
      actionDisabled: false,
      tone: 'muted',
    }
  }

  if (state.permission === 'unsupported') {
    return {
      label: 'Unavailable',
      pill: 'Browser',
      description: 'This browser does not expose microphone input for live tuning.',
      actionLabel: 'Unsupported',
      actionDisabled: true,
      tone: 'muted',
    }
  }

  return {
    label: 'Inactive',
    pill: 'Off',
    description: 'Enable the microphone to start tracking your pitch in real time.',
    actionLabel: 'Enable Mic',
    actionDisabled: false,
    tone: 'attention',
  }
}

function getTrackingCopy(trackingMode: TrackingMode) {
  if (trackingMode === 'manual') {
    return 'Manual stays locked to one string so you can fine tune it without jumping targets.'
  }

  return 'Automatic follows the closest detected string each time you pluck.'
}

function getPitchMeterMessage(state: TunerState) {
  if (state.centsOffset == null) {
    if (state.mode === 'reference') {
      return 'Reference mode keeps the pitch meter on standby.'
    }

    if (state.permission !== 'granted') {
      return 'Enable the microphone to see whether the note lands low or high.'
    }

    if (state.trackingMode === 'manual') {
      return 'Pluck the selected string to see how far below or above the target it lands.'
    }

    return 'Pluck a string and the meter will show whether the pitch lands low or high.'
  }

  if (Math.abs(state.centsOffset) <= 5) {
    return 'Locked in the sweet spot.'
  }

  return `${Math.abs(state.centsOffset)} cents ${state.centsOffset < 0 ? 'low' : 'high'}`
}

function getPitchMeterPosition(centsOffset: number | null) {
  if (centsOffset == null) {
    return 50
  }

  const clamped = Math.max(-50, Math.min(50, centsOffset))
  return ((clamped + 50) / 100) * 100
}

function getFooterCopy(state: TunerState) {
  if (state.mode === 'reference') {
    return 'Tap a string to hear the target note.'
  }

  if (state.trackingMode === 'manual') {
    return 'Tap a string to lock it, then tune until the marker rests in the center.'
  }

  return 'Automatic mode follows the closest string and centers when the pitch locks.'
}

export function TunerScreen({
  state,
  instrument,
  instruments,
  onEnableMicrophone,
  onSelectManualString,
  onSetInstrument,
  onSetMode,
  onSetTrackingMode,
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
  const pitchMeterStyle = {
    '--pitch-position': `${getPitchMeterPosition(state.centsOffset)}%`,
  } as CSSProperties
  const microphoneCard = getMicrophoneCardState(state)

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
        <p className="status-copy" data-status={state.status}>
          {getStatusLabel(state.status)}
        </p>
      </section>

      <section className="performance-stack">
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
              aria-pressed={string.id === state.activeStringId}
              onClick={() => {
                if (state.mode === 'reference') {
                  void onPlayReferenceString(string.id)
                  return
                }

                if (state.trackingMode === 'manual') {
                  onSelectManualString(string.id)
                }
              }}
            >
              <span className="string-note">{string.note}</span>
              <span className="string-line" />
            </button>
          ))}
        </section>

        <section className="pitch-meter" aria-label="Pitch offset meter">
          <div className="pitch-scale" aria-hidden="true">
            <span>Low</span>
            <span>In tune</span>
            <span>High</span>
          </div>
          <div
            className="pitch-track"
            data-has-signal={String(state.centsOffset !== null)}
            style={pitchMeterStyle}
          >
            <span className="pitch-track-glow" />
            <span className="pitch-track-center" />
            <span className="pitch-marker" />
          </div>
          <p className="pitch-caption">{getPitchMeterMessage(state)}</p>
        </section>
      </section>

      <section className="control-deck" aria-label="Tuner controls">
        <article className="info-card" data-tone={microphoneCard.tone}>
          <div className="info-card-header">
            <div>
              <p className="info-label">Microphone</p>
              <p className="info-value">{microphoneCard.label}</p>
            </div>
            <span className="info-pill">{microphoneCard.pill}</span>
          </div>
          <p className="info-copy">{microphoneCard.description}</p>
          <button
            type="button"
            className="panel-action"
            disabled={microphoneCard.actionDisabled}
            onClick={() => void onEnableMicrophone()}
          >
            {microphoneCard.actionLabel}
          </button>
        </article>

        <article className="info-card" data-tone="ready">
          <div className="info-card-header">
            <div>
              <p className="info-label">Tracking</p>
              <p className="info-value">
                {state.trackingMode === 'automatic' ? 'Automatic' : 'Manual'}
              </p>
            </div>
            <span className="info-pill">
              {state.trackingMode === 'automatic' ? 'Closest String' : 'Locked String'}
            </span>
          </div>
          <p className="info-copy">{getTrackingCopy(state.trackingMode)}</p>
          <div className="segmented-group segmented-group-inline" role="group" aria-label="Tracking mode">
            <button
              type="button"
              aria-pressed={state.trackingMode === 'automatic'}
              onClick={() => onSetTrackingMode('automatic')}
            >
              Automatic
            </button>
            <button
              type="button"
              aria-pressed={state.trackingMode === 'manual'}
              onClick={() => onSetTrackingMode('manual')}
            >
              Manual
            </button>
          </div>
        </article>
      </section>

      <footer className="status-footer">
        <span>{getFooterCopy(state)}</span>
      </footer>
    </main>
  )
}
