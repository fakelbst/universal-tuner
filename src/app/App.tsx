import { useTunerController } from '../hooks/useTunerController'
import { TunerScreen } from './TunerScreen'

export default function App() {
  const controller = useTunerController()

  return (
    <TunerScreen
      state={controller.state}
      instrument={controller.instrument}
      instruments={controller.instruments}
      onEnableMicrophone={controller.enableMicrophone}
      onSetInstrument={controller.setInstrument}
      onSetMode={controller.setMode}
      onPlayReferenceString={controller.playReferenceString}
      onToggleTheme={controller.toggleTheme}
    />
  )
}
