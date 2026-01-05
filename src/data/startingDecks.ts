import type { TrinketData } from '../game/types';

export const startingTrinkets: TrinketData[] = [
  {
    id: 'veteran_looper',
    name: 'Veteran Looper',
    description: '+1 max confidence. Start with Yardage Book.',
    flavorText: '"I\'ve walked these fairways a thousand times."',
    rarity: 'common',
    isStartingTrinket: true,
    effect: { type: 'max_confidence_bonus', amount: 1 },
    starterDeckModifier: {
      addCards: ['yardage_book'],
    },
  },
  {
    id: 'aggressive_caddie',
    name: 'Aggressive Caddie',
    description: '+20% putt bonus. Start with Attack the Pin.',
    flavorText: '"Go for it. You\'ve got this."',
    rarity: 'common',
    isStartingTrinket: true,
    effect: { type: 'putt_bonus', percent: 20 },
    starterDeckModifier: {
      addCards: ['attack_pin'],
    },
  },
  {
    id: 'conservative_caddie',
    name: 'Conservative Caddie',
    description: 'Start with 2 Safe Play. Extra Smart Play.',
    flavorText: '"Fairways and greens. That\'s the game."',
    rarity: 'common',
    isStartingTrinket: true,
    effect: { type: 'starting_safe_play', amount: 2 },
    starterDeckModifier: {
      addCards: ['smart_play'],
    },
  },
  {
    id: 'putting_specialist',
    name: 'Putting Specialist',
    description: '+25% putt bonus. Start with Hot Putter card.',
    flavorText: '"The money\'s made on the green."',
    rarity: 'common',
    isStartingTrinket: true,
    effect: { type: 'putt_bonus', percent: 25 },
    starterDeckModifier: {
      addCards: ['hot_putter'],
    },
  },
  {
    id: 'rookie_caddie',
    name: 'Rookie Caddie',
    description: 'Extra card reward choices. Start with Deep Breath.',
    flavorText: '"I\'m still learning, but I\'ll give it my all!"',
    rarity: 'common',
    isStartingTrinket: true,
    effect: { type: 'extra_card_reward' },
    starterDeckModifier: {
      addCards: ['deep_breath'],
    },
  },
];

export const baseStarterDeck: string[] = [
  'driver',
  'safe_drive',
  'stock_iron',
  'stock_iron',
  'bump_run',
  'lag_putt',
  'aggressive_putt',
  'check_wind',
  'deep_breath',
  'safe_play',
];

export function createStarterDeck(trinketId: string): string[] {
  const trinket = startingTrinkets.find(t => t.id === trinketId);
  let deck = [...baseStarterDeck];

  if (trinket?.starterDeckModifier) {
    const mod = trinket.starterDeckModifier;

    if (mod.removeCards) {
      deck = deck.filter(id => !mod.removeCards!.includes(id));
    }

    if (mod.addCards) {
      deck.push(...mod.addCards);
    }
  }

  return deck;
}

export function getStartingTrinketById(id: string): TrinketData | undefined {
  return startingTrinkets.find(t => t.id === id);
}
