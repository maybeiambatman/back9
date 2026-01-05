import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MetaProgress } from '../game/types';

interface MetaState extends MetaProgress {
  incrementRuns: () => void;
  recordWin: (score: number) => void;
  recordLoss: () => void;
  addBirdie: () => void;
  addPar: () => void;
  addHolePlayed: () => void;
  addHoleInOne: () => void;
  unlockTrinket: (id: string) => void;
  unlockCard: (id: string) => void;
  resetProgress: () => void;
}

const initialState: MetaProgress = {
  totalRuns: 0,
  wins: 0,
  losses: 0,
  bestScore: 999,
  unlockedTrinkets: [],
  unlockedCards: [],
  unlockedStartingDecks: ['veteran_looper'],
  totalBirdies: 0,
  totalPars: 0,
  totalHolesPlayed: 0,
  holesInOne: 0,
};

export const useMetaStore = create<MetaState>()(
  persist(
    (set) => ({
      ...initialState,

      incrementRuns: () => set((state) => ({ totalRuns: state.totalRuns + 1 })),

      recordWin: (score: number) => set((state) => ({
        wins: state.wins + 1,
        bestScore: Math.min(state.bestScore, score),
      })),

      recordLoss: () => set((state) => ({ losses: state.losses + 1 })),

      addBirdie: () => set((state) => ({ totalBirdies: state.totalBirdies + 1 })),

      addPar: () => set((state) => ({ totalPars: state.totalPars + 1 })),

      addHolePlayed: () => set((state) => ({ totalHolesPlayed: state.totalHolesPlayed + 1 })),

      addHoleInOne: () => set((state) => ({ holesInOne: state.holesInOne + 1 })),

      unlockTrinket: (id: string) => set((state) => ({
        unlockedTrinkets: state.unlockedTrinkets.includes(id)
          ? state.unlockedTrinkets
          : [...state.unlockedTrinkets, id],
      })),

      unlockCard: (id: string) => set((state) => ({
        unlockedCards: state.unlockedCards.includes(id)
          ? state.unlockedCards
          : [...state.unlockedCards, id],
      })),

      resetProgress: () => set(initialState),
    }),
    {
      name: 'back-nine-meta',
    }
  )
);
