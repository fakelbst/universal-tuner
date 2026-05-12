import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { getInstrumentDefinition } from '../domain/instruments'
import { initialTunerState } from '../state/tunerReducer'
import { TunerScreen } from './TunerScreen'

const noop = vi.fn()

test('renders a microphone onboarding panel when permission is idle', () => {
  render(
    <TunerScreen
      state={initialTunerState}
      instrument={getInstrumentDefinition('guitar')}
      instruments={[getInstrumentDefinition('guitar')]}
      onEnableMicrophone={noop}
      onSetInstrument={noop}
      onSetMode={noop}
      onPlayReferenceString={noop}
      onToggleTheme={noop}
    />,
  )

  expect(screen.getByText('Enable Microphone')).toBeInTheDocument()
  expect(
    screen.getByText('Let Universal Tuner listen for your next pluck.'),
  ).toBeInTheDocument()
})

test('highlights the active string and shows in-tune copy', () => {
  render(
    <TunerScreen
      state={{
        ...initialTunerState,
        permission: 'granted',
        status: 'in-tune',
        activeStringId: 'guitar-a2',
        displayNote: 'A2',
      }}
      instrument={getInstrumentDefinition('guitar')}
      instruments={[getInstrumentDefinition('guitar')]}
      onEnableMicrophone={noop}
      onSetInstrument={noop}
      onSetMode={noop}
      onPlayReferenceString={noop}
      onToggleTheme={noop}
    />,
  )

  expect(screen.getByText('In Tune')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'A2' })).toHaveAttribute(
    'data-active',
    'true',
  )
})

test('shows reference guidance without microphone onboarding', () => {
  render(
    <TunerScreen
      state={{
        ...initialTunerState,
        mode: 'reference',
        status: 'reference',
      }}
      instrument={getInstrumentDefinition('guitar')}
      instruments={[getInstrumentDefinition('guitar')]}
      onEnableMicrophone={noop}
      onSetInstrument={noop}
      onSetMode={noop}
      onPlayReferenceString={noop}
      onToggleTheme={noop}
    />,
  )

  expect(screen.queryByText('Enable Microphone')).not.toBeInTheDocument()
  expect(screen.getByText('Tap a string to hear the target note.')).toBeInTheDocument()
})
