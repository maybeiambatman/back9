import { motion } from 'framer-motion';
import { useState } from 'react';
import type { CardData } from '../../game/types';
import { cn } from '../../utils/cn';

interface CardProps {
  card: CardData;
  instanceId: string;
  isPlayable: boolean;
  isSelected: boolean;
  index: number;
  totalCards: number;
  onSelect: (instanceId: string) => void;
  onPlay: (instanceId: string) => void;
}

export function Card({
  card,
  instanceId,
  isPlayable,
  isSelected,
  index,
  totalCards,
  onSelect,
  onPlay,
}: CardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Calculate fan position
  const centerIndex = (totalCards - 1) / 2;
  const offset = index - centerIndex;
  const rotation = offset * 3;
  const xOffset = offset * 80;
  const yOffset = Math.abs(offset) * 10;

  const typeColors = {
    shot: 'from-green-600 to-green-800',
    read: 'from-blue-600 to-blue-800',
    mental: 'from-purple-600 to-purple-800',
  };

  const typeEmojis = {
    shot: '🏌️',
    read: '👁️',
    mental: '🧠',
  };

  const rarityBorders = {
    common: 'border-gray-400',
    uncommon: 'border-blue-400',
    rare: 'border-yellow-400',
    special: 'border-purple-400',
  };

  return (
    <motion.div
      className={cn(
        'absolute w-36 h-52 cursor-pointer select-none',
        'rounded-lg border-2 shadow-lg',
        'bg-gradient-to-b',
        typeColors[card.type],
        rarityBorders[card.rarity],
        !isPlayable && 'opacity-50 cursor-not-allowed',
        isSelected && 'ring-4 ring-yellow-400'
      )}
      style={{
        left: '50%',
        bottom: 0,
        transformOrigin: 'bottom center',
      }}
      initial={false}
      animate={{
        x: xOffset - 72,
        y: isHovered ? -40 - yOffset : isSelected ? -60 : -yOffset,
        rotate: isHovered ? 0 : rotation,
        scale: isHovered ? 1.1 : 1,
        zIndex: isHovered || isSelected ? 100 : index,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        if (!isPlayable) return;
        if (isSelected) {
          onPlay(instanceId);
        } else {
          onSelect(instanceId);
        }
      }}
    >
      <div className="p-2 h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start">
          <span className="text-white font-bold text-sm truncate flex-1">
            {card.name}
            {card.isUpgraded && <span className="text-yellow-300">+</span>}
          </span>
          <span className={cn(
            'w-6 h-6 rounded-full flex items-center justify-center',
            'bg-black/30 text-white font-bold text-sm'
          )}>
            {card.cost}
          </span>
        </div>

        {/* Card art placeholder */}
        <div className="flex-1 my-2 bg-black/20 rounded flex items-center justify-center">
          <span className="text-4xl">{typeEmojis[card.type]}</span>
        </div>

        {/* Description */}
        <div className="bg-black/30 rounded p-1.5 text-white text-xs leading-tight min-h-[40px]">
          {card.description}
        </div>

        {/* Tags */}
        <div className="flex gap-1 mt-1 flex-wrap">
          {card.exhaust && (
            <span className="text-[10px] bg-red-500/50 px-1 rounded text-white">Exhaust</span>
          )}
          {card.ethereal && (
            <span className="text-[10px] bg-purple-500/50 px-1 rounded text-white">Ethereal</span>
          )}
          {card.shotCategory && card.type === 'shot' && (
            <span className="text-[10px] bg-green-500/30 px-1 rounded text-white capitalize">
              {card.shotCategory.replace('_', ' ')}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
