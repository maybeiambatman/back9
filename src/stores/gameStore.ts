import { create } from 'zustand';
import type { GameScreen } from '../game/types';

interface GameState {
  screen: GameScreen;
  setScreen: (screen: GameScreen) => void;
}

export const useGameStore = create<GameState>((set) => ({
  screen: 'menu',
  setScreen: (screen) => set({ screen }),
}));
