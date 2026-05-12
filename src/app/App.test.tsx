import { render, screen } from '@testing-library/react'
import App from './App'

test('renders the tuner shell in tune mode by default', () => {
  render(<App />)

  expect(
    screen.getByRole('heading', { name: 'Universal Tuner' }),
  ).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Tune' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(screen.getByRole('button', { name: 'Reference' })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
  expect(screen.getByText('Microphone')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Enable Mic' })).toBeInTheDocument()
})
