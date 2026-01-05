import type { HoleData } from './types';
import { createSeededRandom, pickRandom } from '../utils/random';

const holeNames = [
  'Pebble Beach 7th',
  'Augusta 12th',
  'St Andrews 17th',
  'TPC Sawgrass 17th',
  'Oakmont 3rd',
  'Bethpage Black 15th',
  'Torrey Pines 3rd',
  'Harbour Town 18th',
  'Pinehurst #2 5th',
  'Whistling Straits 17th',
  'Kiawah Ocean 17th',
  'Shadow Creek 15th',
];

const pinPositions: HoleData['pinPosition'][] = [
  'front_left', 'front_center', 'front_right',
  'center_left', 'center', 'center_right',
  'back_left', 'back_center', 'back_right',
];

const windDirections: HoleData['windDirection'][] = [
  'helping', 'hurting', 'left_to_right', 'right_to_left',
];

const greenSpeeds: HoleData['greenSpeed'][] = [
  'slow', 'medium', 'fast', 'lightning',
];

export function generateHole(holeNumber: number, seed: string): HoleData {
  const random = createSeededRandom(`${seed}-hole-${holeNumber}`);

  // Determine par based on probability
  const parRoll = random();
  let par: 3 | 4 | 5;
  if (parRoll < 0.2) {
    par = 3;
  } else if (parRoll < 0.8) {
    par = 4;
  } else {
    par = 5;
  }

  // Distance based on par
  let distance: number;
  switch (par) {
    case 3:
      distance = 150 + Math.floor(random() * 80); // 150-230
      break;
    case 4:
      distance = 380 + Math.floor(random() * 80); // 380-460
      break;
    case 5:
      distance = 500 + Math.floor(random() * 80); // 500-580
      break;
  }

  // Difficulty scales with hole number
  const baseDifficulty = Math.min(5, Math.ceil(holeNumber / 2)) as 1 | 2 | 3 | 4 | 5;
  const difficulty = Math.min(5, baseDifficulty + (random() < 0.3 ? 1 : 0)) as 1 | 2 | 3 | 4 | 5;

  // Hazards become more common later
  const hazardChance = 0.2 + (holeNumber * 0.05);

  const hole: HoleData = {
    id: `hole-${holeNumber}`,
    name: `Hole ${holeNumber}`,
    par,
    distance,
    description: getHoleDescription(par, difficulty),

    hasWaterOffTee: par !== 3 && random() < hazardChance,
    hasWaterByGreen: random() < hazardChance * 1.2,
    hasFairwayBunker: par !== 3 && random() < hazardChance * 1.5,
    hasGreensideBunker: random() < 0.6 + (difficulty * 0.05),

    windStrength: Math.floor(random() * 15) + (difficulty * 2),
    windDirection: pickRandom(windDirections, random),
    pinPosition: pickRandom(pinPositions, random),
    greenSpeed: pickRandom(greenSpeeds, random),

    difficulty,
    isElite: holeNumber === 5,
    isBoss: holeNumber === 9,
  };

  // Boss hole special mechanics
  if (hole.isBoss) {
    hole.name = pickRandom(holeNames, random);
    hole.windStrength = Math.min(25, hole.windStrength + 5);
    hole.hasGreensideBunker = true;
    if (par === 3) {
      hole.specialMechanic = { type: 'island_green' };
    }
  }

  return hole;
}

function getHoleDescription(par: number, difficulty: number): string {
  const descriptions: Record<number, string[]> = {
    3: [
      'A short but tricky par 3.',
      'Water guards the green.',
      'All carry over trouble.',
      'Pin tucked behind bunkers.',
      'The wind will be a factor.',
    ],
    4: [
      'A solid two-shot hole.',
      'Risk/reward off the tee.',
      'Fairway bunker in play.',
      'Approach is the key shot.',
      'Don\'t get greedy here.',
    ],
    5: [
      'A true three-shot hole.',
      'Reachable for the bold.',
      'Layup to your number.',
      'Water guards the green.',
      'Long but fair.',
    ],
  };

  const options = descriptions[par] || descriptions[4];
  return options[Math.min(difficulty - 1, options.length - 1)];
}
