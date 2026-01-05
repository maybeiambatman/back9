import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type {
  RunState,
  CardInstance,
  CardData,
  HoleState,
  TrinketData,
  ConsumableData,
  StatusEffect,
  StatusType,
  Phase,
  ShotResult,
  GamePhase,
} from '../game/types';
import { getCardById } from '../data/cards';
import { createStarterDeck, getStartingTrinketById } from '../data/startingDecks';
import { generateHole } from '../game/holeGenerator';
import { resolveShot } from '../game/shotResolver';
import { shuffleArray } from '../utils/random';

interface RunStore extends RunState {
  gamePhase: GamePhase;

  // Initialization
  startNewRun: (startingTrinketId: string, seed?: string) => void;
  abandonRun: () => void;

  // Deck operations
  drawCards: (count: number) => void;
  playCard: (instanceId: string) => void;
  discardCard: (instanceId: string) => void;
  exhaustCard: (instanceId: string) => void;
  addCardToDeck: (cardId: string) => void;
  removeCardFromDeck: (instanceId: string) => void;
  upgradeCard: (instanceId: string) => void;
  shuffleDiscardIntoDraw: () => void;

  // Hole management
  startHole: () => void;
  endPhase: () => ShotResult;
  advancePhase: (result: ShotResult) => void;
  completeHole: () => void;

  // Resources
  spendConfidence: (amount: number) => boolean;
  gainConfidence: (amount: number) => void;
  modifyStrokesOverPar: (amount: number) => void;
  addGold: (amount: number) => void;
  spendGold: (amount: number) => boolean;

  // Items
  addTrinket: (trinket: TrinketData) => void;
  addConsumable: (consumable: ConsumableData) => void;
  useConsumable: (consumableId: string) => void;

  // Status effects
  addStatus: (status: StatusEffect) => void;
  removeStatus: (statusType: StatusType) => void;
  tickStatuses: (trigger: 'shot' | 'phase' | 'hole') => void;

  // Safe play
  addSafePlay: (amount: number) => void;
  useSafePlay: (amount: number) => number;

  // Navigation
  setGamePhase: (phase: GamePhase) => void;

  // Computed helpers
  getHandCards: () => CardData[];
  canPlayCard: (instanceId: string) => boolean;
  isRunOver: () => boolean;
  didWin: () => boolean;
}

const initialState: RunState & { gamePhase: GamePhase } = {
  isActive: false,
  seed: '',
  strokesOverPar: 0,
  maxStrokesOver: 10,
  holesCompleted: 0,
  totalStrokes: 0,
  deck: [],
  drawPile: [],
  hand: [],
  discardPile: [],
  exhaustPile: [],
  confidence: 3,
  maxConfidence: 3,
  gold: 0,
  trinkets: [],
  consumables: [],
  currentHole: null,
  map: { nodes: [], currentNodeId: null, availableNodeIds: [] },
  holeHistory: [],
  gamePhase: 'hole',
};

export const useRunStore = create<RunStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // ==========================================
    // INITIALIZATION
    // ==========================================

    startNewRun: (startingTrinketId: string, seed?: string) => {
      const runSeed = seed || nanoid(10);
      const starterDeck = createStarterDeck(startingTrinketId);
      const trinket = getStartingTrinketById(startingTrinketId);

      const deckInstances: CardInstance[] = starterDeck.map(cardId => ({
        id: nanoid(),
        cardId,
        isUpgraded: false,
      }));

      const shuffled = shuffleArray(deckInstances);

      let maxConfidence = 3;
      if (trinket?.effect.type === 'max_confidence_bonus') {
        maxConfidence += trinket.effect.amount;
      }

      set({
        isActive: true,
        seed: runSeed,
        strokesOverPar: 0,
        maxStrokesOver: 10,
        holesCompleted: 0,
        totalStrokes: 0,
        deck: deckInstances,
        drawPile: shuffled,
        hand: [],
        discardPile: [],
        exhaustPile: [],
        confidence: maxConfidence,
        maxConfidence,
        gold: 100,
        trinkets: trinket ? [trinket] : [],
        consumables: [],
        currentHole: null,
        map: { nodes: [], currentNodeId: null, availableNodeIds: [] },
        holeHistory: [],
        gamePhase: 'hole',
      });

      // Start first hole
      get().startHole();
    },

    abandonRun: () => {
      set(initialState);
    },

    // ==========================================
    // DECK OPERATIONS
    // ==========================================

    drawCards: (count: number) => {
      const state = get();
      let drawPile = [...state.drawPile];
      let hand = [...state.hand];
      let discardPile = [...state.discardPile];

      for (let i = 0; i < count; i++) {
        if (drawPile.length === 0) {
          if (discardPile.length === 0) break;
          drawPile = shuffleArray(discardPile);
          discardPile = [];
        }

        const card = drawPile.shift()!;
        hand = [...hand, card];
      }

      set({ drawPile, hand, discardPile });
    },

    playCard: (instanceId: string) => {
      const state = get();
      const cardInstance = state.hand.find(c => c.id === instanceId);
      if (!cardInstance) return;

      const cardData = getCardById(cardInstance.cardId);
      if (!cardData) return;

      if (cardData.cost > state.confidence) return;

      const newConfidence = state.confidence - cardData.cost;
      const newHand = state.hand.filter(c => c.id !== instanceId);

      let currentHole = state.currentHole;
      if (currentHole) {
        currentHole = {
          ...currentHole,
          playedCards: [...currentHole.playedCards, cardInstance],
        };
      }

      let newState: Partial<RunState> = {
        confidence: newConfidence,
        hand: newHand,
        currentHole,
      };

      if (cardData.exhaust) {
        newState.exhaustPile = [...state.exhaustPile, cardInstance];
      } else {
        newState.discardPile = [...state.discardPile, cardInstance];
      }

      set(newState);

      // Apply immediate card effects
      if (cardData.confidenceGain) {
        get().gainConfidence(cardData.confidenceGain);
      }
      if (cardData.drawCards) {
        get().drawCards(cardData.drawCards);
      }
      if (cardData.safePlayGain) {
        get().addSafePlay(cardData.safePlayGain);
      }
      if (cardData.applyStatus && currentHole) {
        get().addStatus({ type: cardData.applyStatus, duration: 'shot' });
      }
      if (cardData.removeStatus) {
        get().removeStatus(cardData.removeStatus);
      }

      // Reveal information
      const hole = get().currentHole;
      if (hole) {
        const updates: Partial<HoleState> = {};
        if (cardData.revealsWind) updates.windRevealed = true;
        if (cardData.revealsBreak) updates.breakRevealed = true;
        if (cardData.revealsLie) updates.lieRevealed = true;

        if (Object.keys(updates).length > 0) {
          set({ currentHole: { ...hole, ...updates } });
        }
      }
    },

    discardCard: (instanceId: string) => {
      const state = get();
      const card = state.hand.find(c => c.id === instanceId);
      if (!card) return;

      set({
        hand: state.hand.filter(c => c.id !== instanceId),
        discardPile: [...state.discardPile, card],
      });
    },

    exhaustCard: (instanceId: string) => {
      const state = get();
      const card = state.hand.find(c => c.id === instanceId) ||
                   state.discardPile.find(c => c.id === instanceId);
      if (!card) return;

      set({
        hand: state.hand.filter(c => c.id !== instanceId),
        discardPile: state.discardPile.filter(c => c.id !== instanceId),
        exhaustPile: [...state.exhaustPile, card],
      });
    },

    addCardToDeck: (cardId: string) => {
      const newCard: CardInstance = {
        id: nanoid(),
        cardId,
        isUpgraded: false,
      };

      set(state => ({
        deck: [...state.deck, newCard],
        discardPile: [...state.discardPile, newCard],
      }));
    },

    removeCardFromDeck: (instanceId: string) => {
      set(state => ({
        deck: state.deck.filter(c => c.id !== instanceId),
        drawPile: state.drawPile.filter(c => c.id !== instanceId),
        hand: state.hand.filter(c => c.id !== instanceId),
        discardPile: state.discardPile.filter(c => c.id !== instanceId),
      }));
    },

    upgradeCard: (instanceId: string) => {
      set(state => {
        const updateCard = (cards: CardInstance[]) =>
          cards.map(c => c.id === instanceId ? { ...c, isUpgraded: true } : c);

        return {
          deck: updateCard(state.deck),
          drawPile: updateCard(state.drawPile),
          hand: updateCard(state.hand),
          discardPile: updateCard(state.discardPile),
        };
      });
    },

    shuffleDiscardIntoDraw: () => {
      set(state => ({
        drawPile: shuffleArray([...state.drawPile, ...state.discardPile]),
        discardPile: [],
      }));
    },

    // ==========================================
    // HOLE MANAGEMENT
    // ==========================================

    startHole: () => {
      const state = get();
      const holeNumber = state.holesCompleted + 1;
      const holeData = generateHole(holeNumber, state.seed);

      const allCards = [...state.drawPile, ...state.hand, ...state.discardPile];
      const shuffled = shuffleArray(allCards);

      const holeState: HoleState = {
        holeData,
        currentPhase: holeData.par === 3 ? 'tee' : 'tee',
        distanceRemaining: holeData.distance,
        currentLie: 'tee',
        puttDistance: 0,
        strokesTaken: 0,
        windRevealed: false,
        breakRevealed: false,
        lieRevealed: false,
        statuses: [],
        safePlayStacks: 0,
        playedCards: [],
      };

      // Apply trinket effects
      state.trinkets.forEach(t => {
        if (t.effect.type === 'reveal_wind') holeState.windRevealed = true;
        if (t.effect.type === 'reveal_distance') holeState.lieRevealed = true;
        if (t.effect.type === 'reveal_break') holeState.breakRevealed = true;
        if (t.effect.type === 'starting_safe_play') {
          holeState.safePlayStacks += t.effect.amount;
        }
        if (t.effect.type === 'starting_status') {
          holeState.statuses.push({ type: t.effect.status, duration: 'hole' });
        }
      });

      set({
        currentHole: holeState,
        drawPile: shuffled,
        hand: [],
        discardPile: [],
        confidence: state.maxConfidence,
        gamePhase: 'hole',
      });

      get().drawCards(5);
    },

    endPhase: (): ShotResult => {
      const state = get();
      if (!state.currentHole) {
        throw new Error('No active hole');
      }

      const result = resolveShot(state.currentHole, state.trinkets);

      let newHole = { ...state.currentHole };
      newHole.strokesTaken += result.strokesUsed;
      newHole.distanceRemaining = result.newDistance;
      newHole.currentLie = result.newLie;
      newHole.puttDistance = result.puttDistance;
      newHole.playedCards = [];

      if (result.penalty > 0 && newHole.safePlayStacks > 0) {
        const reduction = Math.min(newHole.safePlayStacks, result.penalty);
        result.penalty -= reduction;
        newHole.safePlayStacks -= reduction;
      }

      if (result.gainedStatus) {
        newHole.statuses.push({ type: result.gainedStatus, duration: 'hole' });
      }

      newHole.statuses = newHole.statuses.filter(s => s.duration !== 'shot');

      set({ currentHole: newHole });

      return result;
    },

    advancePhase: (result: ShotResult) => {
      const state = get();
      if (!state.currentHole) return;

      if (result.holedOut) {
        get().completeHole();
        return;
      }

      let nextPhase: Phase;
      const hole = state.currentHole;

      if (hole.currentLie === 'green' || result.onGreen) {
        nextPhase = 'putt';
      } else if (hole.distanceRemaining <= 50) {
        nextPhase = 'short_game';
      } else {
        nextPhase = 'approach';
      }

      const newStatuses = hole.statuses.filter(s => s.duration !== 'phase');

      set({
        currentHole: {
          ...hole,
          currentPhase: nextPhase,
          statuses: newStatuses,
        },
      });

      // Reset hand for new phase
      const state2 = get();
      set({
        drawPile: shuffleArray([...state2.drawPile, ...state2.hand]),
        hand: [],
      });
      get().drawCards(5);
    },

    completeHole: () => {
      const state = get();
      if (!state.currentHole) return;

      const hole = state.currentHole;
      const score = hole.strokesTaken - hole.holeData.par;

      const newStrokesOver = state.strokesOverPar + score;
      const newHolesCompleted = state.holesCompleted + 1;

      set({
        strokesOverPar: newStrokesOver,
        holesCompleted: newHolesCompleted,
        totalStrokes: state.totalStrokes + hole.strokesTaken,
        currentHole: null,
        holeHistory: [
          ...state.holeHistory,
          {
            holeId: hole.holeData.id,
            par: hole.holeData.par,
            strokes: hole.strokesTaken,
            score,
          },
        ],
      });

      // Check for reward (birdie or better)
      if (score <= -1) {
        set({ gamePhase: 'reward' });
      } else if (newHolesCompleted >= 9 || newStrokesOver >= state.maxStrokesOver) {
        // Run is over
        set({ isActive: false });
      } else {
        // Continue to next hole
        get().startHole();
      }
    },

    // ==========================================
    // RESOURCES
    // ==========================================

    spendConfidence: (amount: number): boolean => {
      const state = get();
      if (state.confidence < amount) return false;
      set({ confidence: state.confidence - amount });
      return true;
    },

    gainConfidence: (amount: number) => {
      set(state => ({
        confidence: Math.min(state.maxConfidence, state.confidence + amount),
      }));
    },

    modifyStrokesOverPar: (amount: number) => {
      set(state => ({
        strokesOverPar: Math.max(0, state.strokesOverPar + amount),
      }));
    },

    addGold: (amount: number) => {
      set(state => ({ gold: state.gold + amount }));
    },

    spendGold: (amount: number): boolean => {
      const state = get();
      if (state.gold < amount) return false;
      set({ gold: state.gold - amount });
      return true;
    },

    // ==========================================
    // ITEMS
    // ==========================================

    addTrinket: (trinket: TrinketData) => {
      set(state => ({ trinkets: [...state.trinkets, trinket] }));

      const effect = trinket.effect;
      if (effect.type === 'max_confidence_bonus') {
        set(state => ({
          maxConfidence: state.maxConfidence + effect.amount,
          confidence: state.confidence + effect.amount,
        }));
      }
      if (effect.type === 'max_strokes_bonus') {
        set(state => ({
          maxStrokesOver: state.maxStrokesOver + effect.amount,
        }));
      }
    },

    addConsumable: (consumable: ConsumableData) => {
      set(state => {
        if (state.consumables.length >= 3) return state;
        return { consumables: [...state.consumables, consumable] };
      });
    },

    useConsumable: (consumableId: string) => {
      const state = get();
      const consumable = state.consumables.find(c => c.id === consumableId);
      if (!consumable) return;

      const effect = consumable.effect;
      switch (effect.type) {
        case 'gain_confidence':
          get().gainConfidence(effect.amount);
          break;
        case 'reveal_all':
          if (state.currentHole) {
            set({
              currentHole: {
                ...state.currentHole,
                windRevealed: true,
                breakRevealed: true,
                lieRevealed: true,
              },
            });
          }
          break;
        case 'gain_status':
          get().addStatus({ type: effect.status, duration: 'hole' });
          break;
        case 'remove_status':
          get().removeStatus(effect.status);
          break;
      }

      set({
        consumables: state.consumables.filter(c => c.id !== consumableId),
      });
    },

    // ==========================================
    // STATUS EFFECTS
    // ==========================================

    addStatus: (status: StatusEffect) => {
      set(state => {
        if (!state.currentHole) return state;
        return {
          currentHole: {
            ...state.currentHole,
            statuses: [...state.currentHole.statuses, status],
          },
        };
      });
    },

    removeStatus: (statusType: StatusType) => {
      set(state => {
        if (!state.currentHole) return state;
        return {
          currentHole: {
            ...state.currentHole,
            statuses: state.currentHole.statuses.filter(s => s.type !== statusType),
          },
        };
      });
    },

    tickStatuses: (trigger: 'shot' | 'phase' | 'hole') => {
      set(state => {
        if (!state.currentHole) return state;
        return {
          currentHole: {
            ...state.currentHole,
            statuses: state.currentHole.statuses.filter(s => s.duration !== trigger),
          },
        };
      });
    },

    // ==========================================
    // SAFE PLAY
    // ==========================================

    addSafePlay: (amount: number) => {
      set(state => {
        if (!state.currentHole) return state;
        return {
          currentHole: {
            ...state.currentHole,
            safePlayStacks: state.currentHole.safePlayStacks + amount,
          },
        };
      });
    },

    useSafePlay: (amount: number): number => {
      const state = get();
      if (!state.currentHole) return 0;

      const actual = Math.min(amount, state.currentHole.safePlayStacks);
      set({
        currentHole: {
          ...state.currentHole,
          safePlayStacks: state.currentHole.safePlayStacks - actual,
        },
      });
      return actual;
    },

    // ==========================================
    // NAVIGATION
    // ==========================================

    setGamePhase: (phase: GamePhase) => {
      set({ gamePhase: phase });
    },

    // ==========================================
    // COMPUTED
    // ==========================================

    getHandCards: () => {
      const state = get();
      return state.hand.map(instance => {
        const card = getCardById(instance.cardId);
        if (instance.isUpgraded && card?.upgradedVersion) {
          return getCardById(card.upgradedVersion) || card;
        }
        return card!;
      }).filter(Boolean);
    },

    canPlayCard: (instanceId: string): boolean => {
      const state = get();
      const instance = state.hand.find(c => c.id === instanceId);
      if (!instance) return false;

      const card = getCardById(instance.cardId);
      if (!card) return false;

      return card.cost <= state.confidence;
    },

    isRunOver: () => {
      const state = get();
      return state.strokesOverPar >= state.maxStrokesOver || state.holesCompleted >= 9;
    },

    didWin: () => {
      const state = get();
      return state.holesCompleted >= 9 && state.strokesOverPar < state.maxStrokesOver;
    },
  }))
);
