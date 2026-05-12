import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { getInstrumentDefinition } from '../domain/instruments'
import { initialTunerState, type TunerState } from '../state/tunerReducer'
import { TunerScreen } from './TunerScreen'

const noop = vi.fn()

function renderScreen(state: TunerState = initialTunerState) {
  return render(
    <TunerScreen
      state={state}
      instrument={getInstrumentDefinition('guitar')}
      instruments={[getInstrumentDefinition('guitar')]}
      onEnableMicrophone={noop}
      onSelectManualString={noop}
      onSetInstrument={noop}
      onSetMode={noop}
      onSetTrackingMode={noop}
      onPlayReferenceString={noop}
      onToggleTheme={noop}
    />,
  )
}

test('renders microphone and tracking cards when idle', () => {
  renderScreen()

  expect(screen.getByText('Microphone')).toBeInTheDocument()
  expect(screen.getByText('Enable Mic')).toBeInTheDocument()
  expect(screen.getByText('Tracking')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Automatic' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('highlights the active string and shows an in-tune meter message', () => {
  renderScreen({
    ...initialTunerState,
    permission: 'granted',
    status: 'in-tune',
    activeStringId: 'guitar-a2',
    displayNote: 'A2',
    centsOffset: 0,
  })

  expect(screen.getByText('In Tune')).toBeInTheDocument()
  expect(screen.getByText('Locked in the sweet spot.')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'A2' })).toHaveAttribute(
    'data-active',
    'true',
  )
})

test('shows manual mode guidance and tracking state', () => {
  renderScreen({
    ...initialTunerState,
    trackingMode: 'manual',
    permission: 'granted',
    activeStringId: 'guitar-e2',
    displayNote: 'E2',
  })

  expect(screen.getByRole('button', { name: 'Manual' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(
    screen.getByText(
      'Manual stays locked to one string so you can fine tune it without jumping targets.',
    ),
  ).toBeInTheDocument()
  expect(
    screen.getByText(
      'Tap a string to lock it, then tune until the marker rests in the center.',
    ),
  ).toBeInTheDocument()
})

test('shows reference guidance without a live pitch reading', () => {
  renderScreen({
    ...initialTunerState,
    mode: 'reference',
    status: 'reference',
  })

  expect(screen.getByText('Tap a string to hear the target note.')).toBeInTheDocument()
  expect(
    screen.getByText('Reference mode keeps the pitch meter on standby.'),
  ).toBeInTheDocument()
})
