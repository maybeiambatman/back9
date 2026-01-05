// ============================================
// CARD TYPES
// ============================================

export type CardType = 'shot' | 'read' | 'mental';
export type CardRarity = 'common' | 'uncommon' | 'rare' | 'special';
export type ShotCategory = 'tee' | 'approach' | 'short_game' | 'putt' | 'bunker' | 'any';

export interface CardData {
  id: string;
  name: string;
  description: string;
  type: CardType;
  rarity: CardRarity;
  cost: number;

  // Flags
  exhaust?: boolean;
  ethereal?: boolean;
  innate?: boolean;

  // Shot card properties
  shotCategory?: ShotCategory;
  distance?: number;
  accuracyModifier?: number;
  missGreenChance?: number;
  closeChance?: number;
  ignoresWind?: boolean;
  ignoresLie?: boolean;

  // Read card properties
  revealsWind?: boolean;
  revealsBreak?: boolean;
  revealsLie?: boolean;
  revealsDistance?: boolean;
  bonusAfterReveal?: number;

  // Mental card properties
  confidenceGain?: number;
  safePlayGain?: number;
  drawCards?: number;
  discardCards?: number;
  applyStatus?: StatusType;
  removeStatus?: StatusType;

  // Special effects
  effect?: CardEffect;

  // Upgrade
  upgradedVersion?: string;
  isUpgraded?: boolean;
}

export interface CardInstance {
  id: string;
  cardId: string;
  isUpgraded: boolean;
}

export type CardEffect =
  | { type: 'guarantee_two_putt' }
  | { type: 'prevent_disaster' }
  | { type: 'max_bogey' }
  | { type: 'draw_if_birdie'; amount: number }
  | { type: 'refund_if_par'; amount: number }
  | { type: 'double_safe_play' };

// ============================================
// STATUS EFFECTS
// ============================================

export type StatusType =
  | 'focused'
  | 'dialed_in'
  | 'hot_putter'
  | 'rattled'
  | 'nervous'
  | 'in_your_head';

export interface StatusEffect {
  type: StatusType;
  duration: 'shot' | 'phase' | 'hole' | 'permanent';
  stacks?: number;
}

// ============================================
// HOLE & PHASE TYPES
// ============================================

export type Phase = 'tee' | 'approach' | 'short_game' | 'putt';
export type Lie = 'tee' | 'fairway' | 'light_rough' | 'rough' | 'heavy_rough' |
                  'bunker' | 'greenside_bunker' | 'fringe' | 'green' | 'water';

export type ShotQuality = 'perfect' | 'good' | 'okay' | 'poor' | 'disaster';

export interface HoleData {
  id: string;
  name: string;
  par: 3 | 4 | 5;
  distance: number;
  description: string;

  hasWaterOffTee: boolean;
  hasWaterByGreen: boolean;
  hasFairwayBunker: boolean;
  hasGreensideBunker: boolean;

  windStrength: number;
  windDirection: 'helping' | 'hurting' | 'left_to_right' | 'right_to_left';
  pinPosition: 'front_left' | 'front_center' | 'front_right' | 'center_left' | 'center' | 'center_right' | 'back_left' | 'back_center' | 'back_right';
  greenSpeed: 'slow' | 'medium' | 'fast' | 'lightning';

  difficulty: 1 | 2 | 3 | 4 | 5;
  isElite: boolean;
  isBoss: boolean;

  specialMechanic?: HoleSpecialMechanic;
}

export type HoleSpecialMechanic =
  | { type: 'island_green' }
  | { type: 'road_hole'; bunkerPenalty: number }
  | { type: 'tiny_green'; bunkerChance: number }
  | { type: 'changing_wind' };

export interface HoleState {
  holeData: HoleData;
  currentPhase: Phase;
  distanceRemaining: number;
  currentLie: Lie;
  puttDistance: number;
  strokesTaken: number;

  windRevealed: boolean;
  breakRevealed: boolean;
  lieRevealed: boolean;

  statuses: StatusEffect[];
  safePlayStacks: number;

  playedCards: CardInstance[];
}

export interface ShotResult {
  quality: ShotQuality;
  strokesUsed: number;
  newDistance: number;
  newLie: Lie;
  puttDistance: number;
  onGreen: boolean;
  holedOut: boolean;
  penalty: number;
  gainedStatus?: StatusType;
  message: string;
}

// ============================================
// MAP & RUN TYPES
// ============================================

export type MapNodeType = 'hole' | 'elite' | 'boss' | 'rest' | 'shop' | 'event';

export interface MapNode {
  id: string;
  type: MapNodeType;
  row: number;
  col: number;
  connections: string[];
  visited: boolean;
  holeData?: HoleData;
  eventId?: string;
}

export interface CourseMap {
  nodes: MapNode[];
  currentNodeId: string | null;
  availableNodeIds: string[];
}

// ============================================
// TRINKET TYPES
// ============================================

export interface TrinketData {
  id: string;
  name: string;
  description: string;
  flavorText?: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'boss';

  isStartingTrinket?: boolean;
  starterDeckModifier?: StarterDeckMod;

  effect: TrinketEffect;
}

export type TrinketEffect =
  | { type: 'max_confidence_bonus'; amount: number }
  | { type: 'starting_safe_play'; amount: number }
  | { type: 'starting_status'; status: StatusType }
  | { type: 'reveal_wind' }
  | { type: 'reveal_distance' }
  | { type: 'reveal_break' }
  | { type: 'reduce_wind'; percent: number }
  | { type: 'putt_bonus'; percent: number }
  | { type: 'approach_bonus'; percent: number }
  | { type: 'birdie_bonus_confidence'; amount: number }
  | { type: 'bogey_draw_cards'; amount: number }
  | { type: 'extra_card_reward' }
  | { type: 'heal_after_boss'; amount: number }
  | { type: 'max_strokes_bonus'; amount: number };

export interface StarterDeckMod {
  addCards?: string[];
  removeCards?: string[];
  upgradeCards?: string[];
}

// ============================================
// CONSUMABLE TYPES
// ============================================

export interface ConsumableData {
  id: string;
  name: string;
  description: string;
  effect: ConsumableEffect;
}

export type ConsumableEffect =
  | { type: 'mulligan' }
  | { type: 'reveal_all' }
  | { type: 'gain_confidence'; amount: number }
  | { type: 'skip_hole' }
  | { type: 'putt_bonus'; percent: number }
  | { type: 'remove_status'; status: StatusType }
  | { type: 'gain_status'; status: StatusType };

// ============================================
// RUN STATE
// ============================================

export interface RunState {
  isActive: boolean;
  seed: string;

  strokesOverPar: number;
  maxStrokesOver: number;
  holesCompleted: number;
  totalStrokes: number;

  deck: CardInstance[];
  drawPile: CardInstance[];
  hand: CardInstance[];
  discardPile: CardInstance[];
  exhaustPile: CardInstance[];

  confidence: number;
  maxConfidence: number;
  gold: number;

  trinkets: TrinketData[];
  consumables: ConsumableData[];

  currentHole: HoleState | null;
  map: CourseMap;

  holeHistory: HoleResult[];
}

export interface HoleResult {
  holeId: string;
  par: number;
  strokes: number;
  score: number;
}

// ============================================
// META PROGRESSION
// ============================================

export interface MetaProgress {
  totalRuns: number;
  wins: number;
  losses: number;
  bestScore: number;

  unlockedTrinkets: string[];
  unlockedCards: string[];
  unlockedStartingDecks: string[];

  totalBirdies: number;
  totalPars: number;
  totalHolesPlayed: number;
  holesInOne: number;
}

// ============================================
// EVENT TYPES
// ============================================

export interface EventData {
  id: string;
  title: string;
  description: string;
  choices: EventChoice[];
}

export interface EventChoice {
  text: string;
  requiresTrinket?: string;
  effect: EventEffect;
}

export type EventEffect =
  | { type: 'gain_card'; cardId: string }
  | { type: 'gain_random_card'; rarity: CardRarity }
  | { type: 'remove_card' }
  | { type: 'upgrade_card' }
  | { type: 'gain_trinket'; trinketId: string }
  | { type: 'gain_random_trinket' }
  | { type: 'heal_strokes'; amount: number }
  | { type: 'lose_strokes'; amount: number }
  | { type: 'gain_gold'; amount: number }
  | { type: 'lose_gold'; amount: number }
  | { type: 'gain_confidence'; amount: number }
  | { type: 'gain_max_confidence'; amount: number }
  | { type: 'gain_status'; status: StatusType; duration: string }
  | { type: 'nothing' };

// ============================================
// GAME SCREEN STATE
// ============================================

export type GameScreen = 'menu' | 'game' | 'map' | 'reward' | 'shop' | 'event' | 'rest' | 'run_complete';
export type GamePhase = 'map' | 'hole' | 'reward' | 'shop' | 'event' | 'rest';
