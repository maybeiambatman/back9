import { motion } from 'framer-motion';
import type { ShotResult } from '../../game/types';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

interface ShotResultModalProps {
  result: ShotResult;
  onDismiss: () => void;
}

const qualityColors: Record<string, string> = {
  perfect: 'text-yellow-400',
  good: 'text-green-400',
  okay: 'text-blue-400',
  poor: 'text-orange-400',
  disaster: 'text-red-400',
};

const qualityEmojis: Record<string, string> = {
  perfect: '🌟',
  good: '👍',
  okay: '😐',
  poor: '😬',
  disaster: '💥',
};

export function ShotResultModal({ result, onDismiss }: ShotResultModalProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-slate-800 rounded-xl p-8 shadow-2xl border border-slate-700 max-w-md w-full mx-4 text-center"
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 20 }}
      >
        {/* Quality indicator */}
        <div className="text-6xl mb-4">{qualityEmojis[result.quality]}</div>
        <h2 className={cn('text-3xl font-bold mb-2 capitalize', qualityColors[result.quality])}>
          {result.quality}!
        </h2>

        {/* Message */}
        <p className="text-white text-lg mb-6">{result.message}</p>

        {/* Details */}
        <div className="bg-black/30 rounded-lg p-4 mb-6 text-left">
          <div className="grid grid-cols-2 gap-2 text-sm">
            {result.holedOut ? (
              <div className="col-span-2 text-center text-2xl text-yellow-400">
                ⛳ HOLED OUT! ⛳
              </div>
            ) : (
              <>
                {result.onGreen ? (
                  <div className="text-gray-300">
                    <span className="text-gray-500">Putt distance: </span>
                    {Math.round(result.puttDistance)} ft
                  </div>
                ) : (
                  <div className="text-gray-300">
                    <span className="text-gray-500">Distance left: </span>
                    {Math.round(result.newDistance)} yds
                  </div>
                )}
                <div className="text-gray-300">
                  <span className="text-gray-500">Lie: </span>
                  <span className="capitalize">{result.newLie.replace('_', ' ')}</span>
                </div>
              </>
            )}
            {result.penalty > 0 && (
              <div className="col-span-2 text-red-400">
                +{result.penalty} penalty stroke{result.penalty > 1 ? 's' : ''}
              </div>
            )}
            {result.gainedStatus && (
              <div className="col-span-2 text-orange-400">
                Gained: {result.gainedStatus}
              </div>
            )}
          </div>
        </div>

        <Button onClick={onDismiss} size="lg">
          Continue
        </Button>
      </motion.div>
    </motion.div>
  );
}
