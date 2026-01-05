import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRunStore } from '../../stores/runStore';
import { getCardById } from '../../data/cards';
import { cn } from '../../utils/cn';
import type { CardData } from '../../game/types';

interface DeckViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeckViewer({ isOpen, onClose }: DeckViewerProps) {
  const deck = useRunStore(state => state.deck);
  const [filter, setFilter] = useState<'all' | 'shot' | 'read' | 'mental'>('all');

  // Get all cards in deck with their data
  const deckCards = deck
    .map(instance => {
      const card = getCardById(instance.cardId);
      if (!card) return null;
      const actualCard = instance.isUpgraded && card.upgradedVersion
        ? getCardById(card.upgradedVersion) || card
        : card;
      return { ...actualCard, instanceId: instance.id, isUpgraded: instance.isUpgraded };
    })
    .filter(Boolean) as (CardData & { instanceId: string; isUpgraded: boolean })[];

  // Apply filter
  const filteredCards = filter === 'all'
    ? deckCards
    : deckCards.filter(c => c.type === filter);

  // Sort by type, then by cost
  const sortedCards = [...filteredCards].sort((a, b) => {
    const typeOrder = { shot: 0, read: 1, mental: 2 };
    if (typeOrder[a.type] !== typeOrder[b.type]) {
      return typeOrder[a.type] - typeOrder[b.type];
    }
    return a.cost - b.cost;
  });

  // Count by type
  const counts = {
    all: deckCards.length,
    shot: deckCards.filter(c => c.type === 'shot').length,
    read: deckCards.filter(c => c.type === 'read').length,
    mental: deckCards.filter(c => c.type === 'mental').length,
  };

  const typeColors = {
    shot: 'from-green-600 to-green-800 border-green-400',
    read: 'from-blue-600 to-blue-800 border-blue-400',
    mental: 'from-purple-600 to-purple-800 border-purple-400',
  };

  const typeEmojis = {
    shot: '🏌️',
    read: '👁️',
    mental: '🧠',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/80"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative z-10 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 max-w-4xl w-full max-h-[80vh] flex flex-col"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Your Deck</h2>
                <p className="text-sm text-gray-400">{deckCards.length} cards total</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Filter tabs */}
            <div className="p-4 border-b border-slate-700 flex gap-2">
              {(['all', 'shot', 'read', 'mental'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    filter === type
                      ? 'bg-yellow-500 text-black'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  )}
                >
                  {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                  <span className="ml-1 opacity-70">({counts[type]})</span>
                </button>
              ))}
            </div>

            {/* Cards grid */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {sortedCards.map((card) => (
                  <div
                    key={card.instanceId}
                    className={cn(
                      'rounded-lg border-2 p-3 bg-gradient-to-b',
                      typeColors[card.type]
                    )}
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-white font-bold text-sm truncate flex-1">
                        {card.name}
                        {card.isUpgraded && <span className="text-yellow-300">+</span>}
                      </span>
                      <span className="w-5 h-5 rounded-full bg-black/30 flex items-center justify-center text-white text-xs font-bold ml-1">
                        {card.cost}
                      </span>
                    </div>

                    {/* Icon */}
                    <div className="text-2xl text-center my-2">
                      {typeEmojis[card.type]}
                    </div>

                    {/* Description */}
                    <div className="bg-black/30 rounded p-1.5 text-white text-xs leading-tight">
                      {card.description}
                    </div>

                    {/* Tags */}
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {card.exhaust && (
                        <span className="text-[9px] bg-red-500/50 px-1 rounded text-white">Exhaust</span>
                      )}
                      {card.shotCategory && card.type === 'shot' && (
                        <span className="text-[9px] bg-black/30 px-1 rounded text-white capitalize">
                          {card.shotCategory.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {sortedCards.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  No cards of this type in your deck
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
