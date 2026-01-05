import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { useGameStore } from '../../stores/gameStore';
import { useRunStore } from '../../stores/runStore';
import { useMetaStore } from '../../stores/metaStore';
import { startingTrinkets } from '../../data/startingDecks';
import { cn } from '../../utils/cn';

export function MainMenu() {
  const setScreen = useGameStore(state => state.setScreen);
  const startNewRun = useRunStore(state => state.startNewRun);
  const incrementRuns = useMetaStore(state => state.incrementRuns);
  const meta = useMetaStore();

  const [selectedTrinket, setSelectedTrinket] = useState(startingTrinkets[0].id);
  const [showStats, setShowStats] = useState(false);

  const handleStartGame = () => {
    incrementRuns();
    startNewRun(selectedTrinket);
    setScreen('game');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      {/* Title */}
      <motion.div
        className="text-center mb-12"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <h1 className="text-6xl font-bold text-white mb-2">
          ⛳ Back Nine
        </h1>
        <p className="text-xl text-gray-400">
          A Golf Roguelike Deckbuilder
        </p>
      </motion.div>

      {/* Trinket Selection */}
      <motion.div
        className="bg-slate-800/50 rounded-xl p-6 mb-8 max-w-2xl w-full"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-xl font-bold text-white mb-4">Choose Your Caddie</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {startingTrinkets.map(trinket => (
            <button
              key={trinket.id}
              onClick={() => setSelectedTrinket(trinket.id)}
              className={cn(
                'p-4 rounded-lg text-left transition-all',
                'border-2',
                selectedTrinket === trinket.id
                  ? 'border-yellow-400 bg-yellow-400/10'
                  : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
              )}
            >
              <div className="font-bold text-white">{trinket.name}</div>
              <div className="text-sm text-gray-400">{trinket.description}</div>
              {trinket.flavorText && (
                <div className="text-xs text-gray-500 italic mt-1">{trinket.flavorText}</div>
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Buttons */}
      <motion.div
        className="flex flex-col gap-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Button onClick={handleStartGame} size="lg" className="min-w-[200px]">
          New Run
        </Button>
        <Button
          onClick={() => setShowStats(!showStats)}
          variant="secondary"
          size="lg"
        >
          {showStats ? 'Hide Stats' : 'Show Stats'}
        </Button>
      </motion.div>

      {/* Stats */}
      {showStats && (
        <motion.div
          className="mt-8 bg-slate-800/50 rounded-xl p-6 max-w-md w-full"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <h3 className="text-lg font-bold text-white mb-4">Career Stats</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Total Runs</div>
              <div className="text-white text-xl">{meta.totalRuns}</div>
            </div>
            <div>
              <div className="text-gray-400">Wins</div>
              <div className="text-green-400 text-xl">{meta.wins}</div>
            </div>
            <div>
              <div className="text-gray-400">Best Score</div>
              <div className="text-yellow-400 text-xl">
                {meta.bestScore === 999 ? '--' : (meta.bestScore > 0 ? `+${meta.bestScore}` : meta.bestScore)}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Holes Played</div>
              <div className="text-white text-xl">{meta.totalHolesPlayed}</div>
            </div>
            <div>
              <div className="text-gray-400">Total Birdies</div>
              <div className="text-blue-400 text-xl">{meta.totalBirdies}</div>
            </div>
            <div>
              <div className="text-gray-400">Holes in One</div>
              <div className="text-purple-400 text-xl">{meta.holesInOne}</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Footer */}
      <div className="absolute bottom-4 text-gray-600 text-sm">
        Built with React + TypeScript + Zustand
      </div>
    </div>
  );
}
