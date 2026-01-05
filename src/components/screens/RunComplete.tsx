import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRunStore } from '../../stores/runStore';
import { useGameStore } from '../../stores/gameStore';
import { useMetaStore } from '../../stores/metaStore';
import { Button } from '../ui/Button';

export function RunComplete() {
  const holesCompleted = useRunStore(state => state.holesCompleted);
  const strokesOverPar = useRunStore(state => state.strokesOverPar);
  const totalStrokes = useRunStore(state => state.totalStrokes);
  const holeHistory = useRunStore(state => state.holeHistory);
  const maxStrokesOver = useRunStore(state => state.maxStrokesOver);
  const abandonRun = useRunStore(state => state.abandonRun);
  const setScreen = useGameStore(state => state.setScreen);
  const recordWin = useMetaStore(state => state.recordWin);
  const recordLoss = useMetaStore(state => state.recordLoss);
  const addBirdie = useMetaStore(state => state.addBirdie);
  const addPar = useMetaStore(state => state.addPar);
  const addHolePlayed = useMetaStore(state => state.addHolePlayed);

  const isWin = holesCompleted >= 9 && strokesOverPar < maxStrokesOver;

  // Record stats on mount
  useEffect(() => {
    if (isWin) {
      recordWin(strokesOverPar);
    } else {
      recordLoss();
    }

    // Count birdies and pars
    holeHistory.forEach(hole => {
      addHolePlayed();
      if (hole.score <= -1) addBirdie();
      if (hole.score === 0) addPar();
    });
  }, []);

  const handleReturnToMenu = () => {
    abandonRun();
    setScreen('menu');
  };

  const scoreDisplay = strokesOverPar === 0
    ? 'E'
    : strokesOverPar > 0
    ? `+${strokesOverPar}`
    : strokesOverPar.toString();

  const birdies = holeHistory.filter(h => h.score <= -1).length;
  const pars = holeHistory.filter(h => h.score === 0).length;
  const bogeys = holeHistory.filter(h => h.score >= 1).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col items-center justify-center p-8">
      <motion.div
        className="text-center max-w-lg"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        {/* Result header */}
        <div className="text-6xl mb-4">
          {isWin ? '🏆' : '💔'}
        </div>
        <h1 className={`text-4xl font-bold mb-2 ${isWin ? 'text-yellow-400' : 'text-red-400'}`}>
          {isWin ? 'Tournament Complete!' : 'Run Over'}
        </h1>
        <p className="text-gray-400 mb-8">
          {isWin
            ? 'You survived the Back Nine!'
            : `Too many strokes over par (${strokesOverPar}/${maxStrokesOver})`}
        </p>

        {/* Final score */}
        <div className="bg-slate-800 rounded-xl p-6 mb-8">
          <div className="text-5xl font-bold text-white mb-2">{scoreDisplay}</div>
          <div className="text-gray-400 mb-4">{totalStrokes} total strokes</div>

          {/* Hole by hole */}
          <div className="grid grid-cols-9 gap-1 mb-4">
            {Array.from({ length: 9 }).map((_, i) => {
              const hole = holeHistory[i];
              if (!hole) {
                return (
                  <div key={i} className="text-center">
                    <div className="text-xs text-gray-500">{i + 1}</div>
                    <div className="text-gray-600">-</div>
                  </div>
                );
              }
              return (
                <div key={i} className="text-center">
                  <div className="text-xs text-gray-500">{i + 1}</div>
                  <div className={
                    hole.score <= -2 ? 'text-yellow-400' :
                    hole.score === -1 ? 'text-green-400' :
                    hole.score === 0 ? 'text-white' :
                    hole.score === 1 ? 'text-orange-400' :
                    'text-red-400'
                  }>
                    {hole.strokes}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-6 text-sm">
            <div>
              <span className="text-green-400">{birdies}</span>
              <span className="text-gray-400"> birdies</span>
            </div>
            <div>
              <span className="text-white">{pars}</span>
              <span className="text-gray-400"> pars</span>
            </div>
            <div>
              <span className="text-orange-400">{bogeys}</span>
              <span className="text-gray-400"> bogeys+</span>
            </div>
          </div>
        </div>

        <Button onClick={handleReturnToMenu} size="lg">
          Return to Menu
        </Button>
      </motion.div>
    </div>
  );
}
