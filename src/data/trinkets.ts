import type { TrinketData } from '../game/types';

export const foundTrinkets: TrinketData[] = [
  // Common
  {
    id: 'lucky_ball_marker',
    name: 'Lucky Ball Marker',
    description: 'Always reveal wind at hole start.',
    rarity: 'common',
    effect: { type: 'reveal_wind' },
  },
  {
    id: 'range_finder',
    name: 'Range Finder',
    description: 'Always reveal exact distance.',
    rarity: 'common',
    effect: { type: 'reveal_distance' },
  },
  {
    id: 'putting_gloves',
    name: 'Putting Gloves',
    description: '+10% putt make chance.',
    rarity: 'common',
    effect: { type: 'putt_bonus', percent: 10 },
  },
  {
    id: 'lucky_tee',
    name: 'Lucky Tee',
    description: 'Start each hole with 1 Safe Play.',
    rarity: 'common',
    effect: { type: 'starting_safe_play', amount: 1 },
  },

  // Uncommon
  {
    id: 'green_reading_book',
    name: 'Green Reading Book',
    description: 'Always reveal break on greens.',
    rarity: 'uncommon',
    effect: { type: 'reveal_break' },
  },
  {
    id: 'wind_gauge',
    name: 'Wind Gauge',
    description: 'Reduce wind effect by 30%.',
    rarity: 'uncommon',
    effect: { type: 'reduce_wind', percent: 30 },
  },
  {
    id: 'iron_covers',
    name: 'Iron Covers',
    description: '+15% approach accuracy.',
    rarity: 'uncommon',
    effect: { type: 'approach_bonus', percent: 15 },
  },
  {
    id: 'birdie_charm',
    name: 'Birdie Charm',
    description: 'Gain 1 confidence after birdie.',
    rarity: 'uncommon',
    effect: { type: 'birdie_bonus_confidence', amount: 1 },
  },

  // Rare
  {
    id: 'masters_jacket',
    name: 'Masters Jacket',
    description: '+2 max confidence.',
    rarity: 'rare',
    effect: { type: 'max_confidence_bonus', amount: 2 },
  },
  {
    id: 'claret_jug',
    name: 'Claret Jug',
    description: '+3 max strokes over par allowed.',
    rarity: 'rare',
    effect: { type: 'max_strokes_bonus', amount: 3 },
  },
  {
    id: 'tour_card',
    name: 'Tour Card',
    description: 'Start each hole Dialed In.',
    rarity: 'rare',
    effect: { type: 'starting_status', status: 'dialed_in' },
  },

  // Boss
  {
    id: 'golden_putter',
    name: 'Golden Putter',
    description: '+35% putt make chance.',
    rarity: 'boss',
    effect: { type: 'putt_bonus', percent: 35 },
  },
  {
    id: 'championship_belt',
    name: 'Championship Belt',
    description: 'Heal 2 strokes after boss holes.',
    rarity: 'boss',
    effect: { type: 'heal_after_boss', amount: 2 },
  },
];

export function getTrinketById(id: string): TrinketData | undefined {
  return foundTrinkets.find(t => t.id === id);
}

export function getTrinketsByRarity(rarity: TrinketData['rarity']): TrinketData[] {
  return foundTrinkets.filter(t => t.rarity === rarity);
}
