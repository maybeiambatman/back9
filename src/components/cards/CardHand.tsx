import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Card } from './Card';
import { useRunStore } from '../../stores/runStore';
import { getCardById } from '../../data/cards';

interface CardHandProps {
  onCardPlayed?: (cardId: string) => void;
}

export function CardHand({ onCardPlayed }: CardHandProps) {
  const hand = useRunStore(state => state.hand);
  const playCard = useRunStore(state => state.playCard);
  const canPlayCard = useRunStore(state => state.canPlayCard);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (instanceId: string) => {
    setSelectedId(prev => prev === instanceId ? null : instanceId);
  };

  const handlePlay = (instanceId: string) => {
    if (!canPlayCard(instanceId)) return;

    playCard(instanceId);
    setSelectedId(null);
    onCardPlayed?.(instanceId);
  };

  return (
    <div className="relative h-64 w-full">
      <AnimatePresence>
        {hand.map((instance, index) => {
          const card = getCardById(instance.cardId);
          if (!card) return null;

          const actualCard = instance.isUpgraded && card.upgradedVersion
            ? getCardById(card.upgradedVersion) || card
            : card;

          return (
            <Card
              key={instance.id}
              card={actualCard}
              instanceId={instance.id}
              isPlayable={canPlayCard(instance.id)}
              isSelected={selectedId === instance.id}
              index={index}
              totalCards={hand.length}
              onSelect={handleSelect}
              onPlay={handlePlay}
            />
          );
        })}
      </AnimatePresence>

      {selectedId && (
        <div className="absolute bottom-56 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded">
          Click again to play
        </div>
      )}
    </div>
  );
}
