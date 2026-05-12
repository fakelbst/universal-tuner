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
      onSelectManualString={controller.selectManualString}
      onSetInstrument={controller.setInstrument}
      onSetMode={controller.setMode}
      onSetTrackingMode={controller.setTrackingMode}
      onPlayReferenceString={controller.playReferenceString}
      onToggleTheme={controller.toggleTheme}
    />
  )
}
