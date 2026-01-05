import * as THREE from 'three';
import { ELEMENT_TYPES } from './elements.js';

export class ScoringSystem {
  constructor() {
    this.bonusRules = [
      {
        name: 'Green near water',
        check: (type, pos, placements) => {
          if (type !== 'green') return 0;
          const nearWater = placements.some(p =>
            p.type === 'pond' && this.distance(pos, p.position) < 4
          );
          return nearWater ? 30 : 0;
        }
      },
      {
        name: 'Green on elevation',
        check: (type, pos, placements) => {
          if (type !== 'green') return 0;
          return pos.y > 1 ? 25 : 0;
        }
      },
      {
        name: 'Bunker near green',
        check: (type, pos, placements) => {
          if (type !== 'bunker') return 0;
          const nearGreen = placements.some(p =>
            p.type === 'green' && this.distance(pos, p.position) < 4
          );
          return nearGreen ? 20 : 0;
        }
      },
      {
        name: 'Trees near fairway',
        check: (type, pos, placements) => {
          if (type !== 'tree' && type !== 'treecluster') return 0;
          const nearFairway = placements.some(p =>
            p.type === 'fairway' && this.distance(pos, p.position) < 3
          );
          return nearFairway ? 15 : 0;
        }
      },
      {
        name: 'Clubhouse near green',
        check: (type, pos, placements) => {
          if (type !== 'clubhouse') return 0;
          const nearGreen = placements.some(p =>
            p.type === 'green' && this.distance(pos, p.position) < 6
          );
          return nearGreen ? 30 : 0;
        }
      },
      {
        name: 'Bridge over water',
        check: (type, pos, placements) => {
          if (type !== 'bridge') return 0;
          const overWater = placements.some(p =>
            p.type === 'pond' && this.distance(pos, p.position) < 3
          );
          return overWater ? 35 : 0;
        }
      },
      {
        name: 'Bench with view',
        check: (type, pos, placements) => {
          if (type !== 'bench') return 0;
          const nearWater = placements.some(p =>
            p.type === 'pond' && this.distance(pos, p.position) < 4
          );
          const onHill = pos.y > 1;
          if (nearWater) return 15;
          if (onHill) return 10;
          return 0;
        }
      },
      {
        name: 'Complete hole',
        check: (type, pos, placements) => {
          // Only trigger when placing a green
          if (type !== 'green') return 0;

          const allPlacements = [...placements, { type, position: pos }];
          const hasTee = allPlacements.some(p => p.type === 'tee');
          const hasGreen = allPlacements.some(p => p.type === 'green');
          const hasFairway = allPlacements.some(p => p.type === 'fairway');

          // Check if tee connects to fairway connects to green
          if (hasTee && hasGreen && hasFairway) {
            const tee = allPlacements.find(p => p.type === 'tee');
            const green = allPlacements.find(p => p.type === 'green');

            // Check distance between tee and green
            const dist = this.distance(tee.position, green.position);
            if (dist >= 4 && dist <= 20) {
              return 50;
            }
          }

          return 0;
        }
      },
      {
        name: 'Path network',
        check: (type, pos, placements) => {
          if (type !== 'cartpath') return 0;
          const connectedPaths = placements.filter(p =>
            p.type === 'cartpath' && this.distance(pos, p.position) < 2.5
          );
          return connectedPaths.length > 0 ? 5 : 0;
        }
      },
      {
        name: 'Flower garden',
        check: (type, pos, placements) => {
          if (type !== 'flowers') return 0;
          const nearClubhouse = placements.some(p =>
            p.type === 'clubhouse' && this.distance(pos, p.position) < 4
          );
          return nearClubhouse ? 10 : 0;
        }
      }
    ];

    this.penaltyRules = [
      {
        name: 'Tee too close to green',
        check: (type, pos, placements) => {
          if (type !== 'tee' && type !== 'green') return 0;

          const otherType = type === 'tee' ? 'green' : 'tee';
          const other = placements.find(p => p.type === otherType);
          if (!other) return 0;

          const dist = this.distance(pos, other.position);
          if (dist < 4) return -30;
          return 0;
        }
      },
      {
        name: 'Tee too far from green',
        check: (type, pos, placements) => {
          if (type !== 'tee' && type !== 'green') return 0;

          const otherType = type === 'tee' ? 'green' : 'tee';
          const other = placements.find(p => p.type === otherType);
          if (!other) return 0;

          const dist = this.distance(pos, other.position);
          if (dist > 24) return -20;
          return 0;
        }
      },
      {
        name: 'Cluttered area',
        check: (type, pos, placements) => {
          const nearby = placements.filter(p => this.distance(pos, p.position) < 2);
          if (nearby.length > 4) return -15;
          return 0;
        }
      }
    ];
  }

  distance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  calculateBonusForPlacement(type, position, existingPlacements) {
    let bonus = 0;

    // Check all bonus rules
    for (const rule of this.bonusRules) {
      bonus += rule.check(type, position, existingPlacements);
    }

    // Check all penalty rules
    for (const rule of this.penaltyRules) {
      bonus += rule.check(type, position, existingPlacements);
    }

    return bonus;
  }

  calculateScore(placements) {
    let totalScore = 0;

    // Base points for each element
    for (const placement of placements) {
      const elementType = ELEMENT_TYPES[placement.type];
      if (elementType) {
        totalScore += elementType.basePoints;
      }
    }

    // Calculate bonuses for each placement
    for (let i = 0; i < placements.length; i++) {
      const placement = placements[i];
      const otherPlacements = placements.filter((_, idx) => idx !== i);

      // Check all bonus rules
      for (const rule of this.bonusRules) {
        totalScore += rule.check(placement.type, placement.position, otherPlacements);
      }

      // Check all penalty rules
      for (const rule of this.penaltyRules) {
        totalScore += rule.check(placement.type, placement.position, otherPlacements);
      }
    }

    return Math.max(0, totalScore);
  }

  recalculateScore(placements) {
    return this.calculateScore(placements);
  }
}
