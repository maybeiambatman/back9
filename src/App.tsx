import { useGameStore } from './stores/gameStore'
import { MainMenu } from './components/screens/MainMenu'
import { GameScreen } from './components/screens/GameScreen'

function App() {
  const screen = useGameStore((state) => state.screen)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {screen === 'menu' && <MainMenu />}
      {screen === 'game' && <GameScreen />}
    </div>
  )
}

export default App
