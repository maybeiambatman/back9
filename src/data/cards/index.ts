import { shotCards } from './shotCards';
import { readCards } from './readCards';
import { mentalCards } from './mentalCards';
import type { CardData } from '../../game/types';

export const allCards: CardData[] = [
  ...shotCards,
  ...readCards,
  ...mentalCards,
];

const cardMap = new Map<string, CardData>();
allCards.forEach(card => cardMap.set(card.id, card));

export function getCardById(id: string): CardData | undefined {
  return cardMap.get(id);
}

export function getCardsByType(type: CardData['type']): CardData[] {
  return allCards.filter(c => c.type === type);
}

export function getCardsByRarity(rarity: CardData['rarity']): CardData[] {
  return allCards.filter(c => c.rarity === rarity);
}

export function getRewardCards(count: number = 3): CardData[] {
  const eligible = allCards.filter(c => !c.isUpgraded && c.rarity !== 'special');
  const shuffled = [...eligible].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export { shotCards, readCards, mentalCards };
