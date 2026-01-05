import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRunStore } from '../../stores/runStore';
import { getRewardCards } from '../../data/cards';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';
import type { CardData } from '../../game/types';

export function RewardScreen() {
  const addCardToDeck = useRunStore(state => state.addCardToDeck);
  const startHole = useRunStore(state => state.startHole);
  const setGamePhase = useRunStore(state => state.setGamePhase);
  const holesCompleted = useRunStore(state => state.holesCompleted);
  const holeHistory = useRunStore(state => state.holeHistory);

  const [rewards] = useState(() => getRewardCards(3));

  const lastHole = holeHistory[holeHistory.length - 1];
  const scoreText = lastHole
    ? lastHole.score <= -2
      ? 'Eagle!'
      : lastHole.score === -1
      ? 'Birdie!'
      : 'Great hole!'
    : 'Great hole!';

  const handleSelectCard = (card: CardData) => {
    addCardToDeck(card.id);
    proceedToNextHole();
  };

  const handleSkip = () => {
    proceedToNextHole();
  };

  const proceedToNextHole = () => {
    if (holesCompleted >= 9) {
      setGamePhase('hole');
    } else {
      startHole();
    }
  };

  const typeColors = {
    shot: 'from-green-600 to-green-800 border-green-400',
    read: 'from-blue-600 to-blue-800 border-blue-400',
    mental: 'from-purple-600 to-purple-800 border-purple-400',
  };

  const rarityGlow = {
    common: '',
    uncommon: 'shadow-blue-500/50',
    rare: 'shadow-yellow-500/50',
    special: 'shadow-purple-500/50',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col items-center justify-center p-8">
      <motion.div
        className="text-center mb-8"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <h1 className="text-4xl font-bold text-yellow-400 mb-2">{scoreText}</h1>
        <p className="text-gray-400">Choose a card to add to your deck</p>
      </motion.div>

      <div className="flex gap-6 mb-8 flex-wrap justify-center">
        {rewards.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleSelectCard(card)}
            className={cn(
              'w-48 h-72 rounded-xl border-2 cursor-pointer',
              'bg-gradient-to-b p-4 flex flex-col',
              'transform transition-transform hover:scale-105 hover:-translate-y-2',
              'shadow-lg',
              typeColors[card.type],
              rarityGlow[card.rarity]
            )}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-2">
              <span className="text-white font-bold text-lg flex-1">{card.name}</span>
              <span className="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-white font-bold">
                {card.cost}
              </span>
            </div>

            {/* Card type */}
            <div className="text-xs text-white/60 uppercase tracking-wider mb-2">
              {card.type} {card.shotCategory && `• ${card.shotCategory.replace('_', ' ')}`}
            </div>

            {/* Art placeholder */}
            <div className="flex-1 bg-black/20 rounded-lg flex items-center justify-center mb-3">
              <span className="text-5xl">
                {card.type === 'shot' && '🏌️'}
                {card.type === 'read' && '👁️'}
                {card.type === 'mental' && '🧠'}
              </span>
            </div>

            {/* Description */}
            <div className="bg-black/30 rounded-lg p-2 text-white text-sm">
              {card.description}
            </div>

            {/* Tags */}
            <div className="flex gap-1 mt-2">
              {card.exhaust && (
                <span className="text-xs bg-red-500/50 px-1.5 py-0.5 rounded">Exhaust</span>
              )}
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded capitalize',
                card.rarity === 'common' && 'bg-gray-500/50',
                card.rarity === 'uncommon' && 'bg-blue-500/50',
                card.rarity === 'rare' && 'bg-yellow-500/50'
              )}>
                {card.rarity}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Button onClick={handleSkip} variant="secondary">
          Skip Reward
        </Button>
      </motion.div>
    </div>
  );
}
