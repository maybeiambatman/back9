import { useRunStore } from '../../stores/runStore';
import { HoleEncounter } from './HoleEncounter';
import { RewardScreen } from './RewardScreen';
import { RunComplete } from './RunComplete';

export function GameScreen() {
  const isActive = useRunStore(state => state.isActive);
  const gamePhase = useRunStore(state => state.gamePhase);
  const holesCompleted = useRunStore(state => state.holesCompleted);
  const strokesOverPar = useRunStore(state => state.strokesOverPar);
  const maxStrokesOver = useRunStore(state => state.maxStrokesOver);

  // Check if run is over
  const runOver = !isActive || holesCompleted >= 9 || strokesOverPar >= maxStrokesOver;

  if (runOver) {
    return <RunComplete />;
  }

  if (gamePhase === 'reward') {
    return <RewardScreen />;
  }

  return <HoleEncounter />;
}
