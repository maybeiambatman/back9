import type {
  HoleState,
  TrinketData,
  ShotResult,
  ShotQuality,
  CardData,
  Lie,
} from './types';
import { getCardById } from '../data/cards';

export function resolveShot(
  hole: HoleState,
  trinkets: TrinketData[]
): ShotResult {
  const playedCards = hole.playedCards;
  const cardDatas = playedCards
    .map(c => getCardById(c.cardId))
    .filter(Boolean) as CardData[];

  // Find primary shot card
  const shotCard = cardDatas.find(c => c.type === 'shot');

  // If no shot card played, disaster
  if (!shotCard) {
    return {
      quality: 'disaster',
      strokesUsed: 1,
      newDistance: hole.distanceRemaining,
      newLie: hole.currentLie,
      puttDistance: hole.puttDistance,
      onGreen: false,
      holedOut: false,
      penalty: 0,
      gainedStatus: 'rattled',
      message: 'No shot played! Ball stays put.',
    };
  }

  // Calculate accuracy modifier from all played cards
  let accuracyMod = 0;
  let ignoresWind = false;

  cardDatas.forEach(card => {
    accuracyMod += card.accuracyModifier || 0;
    if (card.ignoresWind) ignoresWind = true;
    if (card.bonusAfterReveal) {
      if (hole.windRevealed || hole.breakRevealed || hole.lieRevealed) {
        accuracyMod += card.bonusAfterReveal;
      }
    }
  });

  // Apply status effects
  hole.statuses.forEach(status => {
    switch (status.type) {
      case 'focused':
        accuracyMod += 0.2;
        break;
      case 'dialed_in':
        accuracyMod += 0.1;
        break;
      case 'rattled':
        accuracyMod -= 0.15;
        break;
      case 'hot_putter':
        if (hole.currentPhase === 'putt') {
          accuracyMod += 0.15;
        }
        break;
    }
  });

  // Apply trinket effects
  trinkets.forEach(trinket => {
    const effect = trinket.effect;
    if (effect.type === 'putt_bonus' && hole.currentPhase === 'putt') {
      accuracyMod += effect.percent / 100;
    }
    if (effect.type === 'approach_bonus' && hole.currentPhase === 'approach') {
      accuracyMod += effect.percent / 100;
    }
    if (effect.type === 'reduce_wind' && !ignoresWind) {
      // Reduce the wind penalty we'd otherwise apply
      accuracyMod += 0.05;
    }
  });

  // Apply wind penalty if not ignored and not revealed
  if (!ignoresWind && !hole.windRevealed && hole.holeData.windStrength > 10) {
    accuracyMod -= 0.1;
  }

  // Apply lie penalty
  accuracyMod += getLiePenalty(hole.currentLie);

  // Route to phase-specific resolver
  switch (hole.currentPhase) {
    case 'tee':
      return resolveTeeShot(hole, shotCard, accuracyMod, ignoresWind);
    case 'approach':
      return resolveApproach(hole, shotCard, accuracyMod);
    case 'short_game':
      return resolveShortGame(hole, shotCard, accuracyMod);
    case 'putt':
      return resolvePutt(hole, shotCard, accuracyMod);
    default:
      throw new Error(`Unknown phase: ${hole.currentPhase}`);
  }
}

function getLiePenalty(lie: Lie): number {
  switch (lie) {
    case 'tee':
    case 'fairway':
    case 'green':
      return 0;
    case 'fringe':
      return -0.02;
    case 'light_rough':
      return -0.05;
    case 'rough':
      return -0.1;
    case 'heavy_rough':
      return -0.2;
    case 'bunker':
    case 'greenside_bunker':
      return -0.1;
    default:
      return 0;
  }
}

function rollQuality(baseAccuracy: number): ShotQuality {
  const roll = Math.random();
  const accuracy = Math.max(0.1, Math.min(0.95, baseAccuracy));

  if (roll < accuracy * 0.15) return 'perfect';
  if (roll < accuracy * 0.5) return 'good';
  if (roll < accuracy * 0.85) return 'okay';
  if (roll < accuracy + 0.1) return 'poor';
  return 'disaster';
}

function resolveTeeShot(
  hole: HoleState,
  card: CardData,
  accuracyMod: number,
  ignoresWind: boolean
): ShotResult {
  const baseAccuracy = 0.7 + accuracyMod;
  const quality = rollQuality(baseAccuracy);

  const distanceHit = Math.abs(card.distance || 0);
  let newDistance = Math.max(0, hole.distanceRemaining - distanceHit);
  let newLie: Lie = 'fairway';
  let penalty = 0;
  let gainedStatus: ShotResult['gainedStatus'];
  let message = '';

  // Apply wind if not ignored
  if (!ignoresWind && hole.holeData.windStrength > 5) {
    const windEffect = hole.holeData.windStrength * (Math.random() - 0.5) * 2;
    newDistance += windEffect;
  }

  switch (quality) {
    case 'perfect':
      message = 'Striped it down the middle!';
      newDistance -= 10;
      break;
    case 'good':
      message = 'Good drive, in the fairway.';
      break;
    case 'okay':
      message = 'Found the light rough.';
      newLie = Math.random() < 0.3 ? 'light_rough' : 'fairway';
      break;
    case 'poor':
      message = 'Pulled it into the rough.';
      newLie = 'rough';
      newDistance += 15;
      break;
    case 'disaster':
      if (hole.holeData.hasWaterOffTee && Math.random() < 0.4) {
        message = 'In the water! Penalty stroke.';
        newLie = 'fairway';
        newDistance = hole.distanceRemaining - distanceHit + 50;
        penalty = 1;
      } else {
        message = 'Deep in the trees!';
        newLie = 'heavy_rough';
        newDistance += 30;
      }
      gainedStatus = 'rattled';
      break;
  }

  // Check if par 3 and might be on green
  if (hole.holeData.par === 3 && newDistance <= 0) {
    const puttDistances: Record<ShotQuality, () => number> = {
      perfect: () => 3 + Math.random() * 7,
      good: () => 15 + Math.random() * 15,
      okay: () => 25 + Math.random() * 20,
      poor: () => 0,
      disaster: () => 0,
    };

    if (quality === 'perfect' || quality === 'good' || quality === 'okay') {
      return {
        quality,
        strokesUsed: 1 + penalty,
        newDistance: 0,
        newLie: 'green',
        puttDistance: puttDistances[quality](),
        onGreen: true,
        holedOut: false,
        penalty,
        gainedStatus,
        message,
      };
    }
  }

  return {
    quality,
    strokesUsed: 1 + penalty,
    newDistance: Math.max(0, newDistance),
    newLie,
    puttDistance: 0,
    onGreen: false,
    holedOut: false,
    penalty,
    gainedStatus,
    message,
  };
}

function resolveApproach(
  hole: HoleState,
  card: CardData,
  accuracyMod: number
): ShotResult {
  const baseAccuracy = 0.65 + accuracyMod;

  const idealDistance = hole.distanceRemaining;
  const cardDistance = Math.abs(card.distance || 0);
  const clubFit = 1 - Math.abs(idealDistance - cardDistance) / 50;
  const adjustedAccuracy = baseAccuracy * Math.max(0.5, clubFit);

  const quality = rollQuality(adjustedAccuracy);
  const missChance = card.missGreenChance || 0.2;
  const closeChance = card.closeChance || 0.1;

  let message = '';
  let newLie: Lie = 'green';
  let puttDistance = 25;
  let onGreen = true;
  let penalty = 0;
  let gainedStatus: ShotResult['gainedStatus'];

  switch (quality) {
    case 'perfect':
      message = 'Stuck it close!';
      puttDistance = Math.random() < closeChance ? 2 + Math.random() * 3 : 4 + Math.random() * 6;
      break;
    case 'good':
      message = 'On the green, good shot.';
      puttDistance = Math.random() < closeChance ? 8 + Math.random() * 7 : 15 + Math.random() * 15;
      break;
    case 'okay':
      if (Math.random() < missChance) {
        message = 'Just missed the green.';
        onGreen = false;
        newLie = 'fringe';
        puttDistance = 0;
      } else {
        message = 'On the green, long putt.';
        puttDistance = 25 + Math.random() * 25;
      }
      break;
    case 'poor':
      message = 'Missed the green.';
      onGreen = false;
      newLie = Math.random() < 0.5 ? 'rough' : 'greenside_bunker';
      puttDistance = 0;
      break;
    case 'disaster':
      if (hole.holeData.hasWaterByGreen && Math.random() < 0.4) {
        message = 'In the water! Penalty stroke.';
        onGreen = false;
        newLie = 'rough';
        penalty = 1;
      } else if (hole.holeData.hasGreensideBunker) {
        message = 'Buried in the bunker.';
        onGreen = false;
        newLie = 'greenside_bunker';
      } else {
        message = 'Way off target.';
        onGreen = false;
        newLie = 'heavy_rough';
      }
      gainedStatus = 'rattled';
      break;
  }

  return {
    quality,
    strokesUsed: 1 + penalty,
    newDistance: onGreen ? 0 : 15 + Math.random() * 20,
    newLie,
    puttDistance,
    onGreen,
    holedOut: false,
    penalty,
    gainedStatus,
    message,
  };
}

function resolveShortGame(
  _hole: HoleState,
  card: CardData,
  accuracyMod: number
): ShotResult {
  const baseAccuracy = 0.6 + accuracyMod;
  const quality = rollQuality(baseAccuracy);
  const closeChance = card.closeChance || 0.3;

  let message = '';
  let puttDistance = 15;
  let onGreen = true;
  let newLie: Lie = 'green';
  let holedOut = false;
  let gainedStatus: ShotResult['gainedStatus'];

  switch (quality) {
    case 'perfect':
      if (Math.random() < 0.08) {
        message = 'HOLED IT!';
        holedOut = true;
        puttDistance = 0;
      } else {
        message = 'Tap-in!';
        puttDistance = 1 + Math.random() * 2;
      }
      break;
    case 'good':
      message = 'Nice up!';
      puttDistance = Math.random() < closeChance ? 2 + Math.random() * 3 : 5 + Math.random() * 6;
      break;
    case 'okay':
      message = 'On the green.';
      puttDistance = 10 + Math.random() * 15;
      break;
    case 'poor':
      message = 'Chunked it.';
      puttDistance = 20 + Math.random() * 20;
      break;
    case 'disaster':
      if (Math.random() < 0.3) {
        message = 'Skulled it over the green!';
        onGreen = false;
        newLie = 'fringe';
        puttDistance = 0;
      } else {
        message = 'Terrible contact.';
        puttDistance = 30 + Math.random() * 20;
      }
      gainedStatus = 'rattled';
      break;
  }

  return {
    quality,
    strokesUsed: 1,
    newDistance: onGreen ? 0 : 10,
    newLie,
    puttDistance,
    onGreen,
    holedOut,
    penalty: 0,
    gainedStatus,
    message,
  };
}

function resolvePutt(
  hole: HoleState,
  card: CardData,
  accuracyMod: number
): ShotResult {
  const distance = hole.puttDistance;

  const baseMakeChance = getMakeChance(distance);
  const adjustedMakeChance = Math.min(0.99, baseMakeChance + accuracyMod);

  const breakBonus = hole.breakRevealed ? 0.1 : 0;
  const finalMakeChance = adjustedMakeChance + breakBonus;

  const madeIt = Math.random() < finalMakeChance;

  if (madeIt) {
    return {
      quality: 'perfect',
      strokesUsed: 1,
      newDistance: 0,
      newLie: 'green',
      puttDistance: 0,
      onGreen: true,
      holedOut: true,
      penalty: 0,
      message: distance < 5 ? 'Tap-in!' : distance < 15 ? 'Drained it!' : 'What a putt!',
    };
  }

  const isLag = card.id?.includes('lag');
  const missQuality = Math.random();

  let newPuttDistance: number;
  let message: string;
  let quality: ShotQuality;

  if (isLag || missQuality < 0.6) {
    newPuttDistance = 1 + Math.random() * 2;
    message = 'Good lag, tap-in coming.';
    quality = 'good';
  } else if (missQuality < 0.85) {
    newPuttDistance = 3 + Math.random() * 4;
    message = 'Decent leave.';
    quality = 'okay';
  } else {
    newPuttDistance = 5 + Math.random() * 6;
    message = 'Yikes, that ran by.';
    quality = 'poor';
  }

  return {
    quality,
    strokesUsed: 1,
    newDistance: 0,
    newLie: 'green',
    puttDistance: newPuttDistance,
    onGreen: true,
    holedOut: false,
    penalty: 0,
    message,
  };
}

function getMakeChance(distanceFeet: number): number {
  if (distanceFeet <= 2) return 0.98;
  if (distanceFeet <= 3) return 0.95;
  if (distanceFeet <= 5) return 0.77;
  if (distanceFeet <= 8) return 0.55;
  if (distanceFeet <= 10) return 0.40;
  if (distanceFeet <= 15) return 0.25;
  if (distanceFeet <= 20) return 0.15;
  if (distanceFeet <= 30) return 0.08;
  if (distanceFeet <= 40) return 0.05;
  return 0.03;
}
