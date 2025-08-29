import { create } from 'zustand';
import { User } from 'firebase/auth';

type GamePhase = 'title' | 'disclaimer' | 'scenario-selection' | 'scenario-loading' | 'game';

interface GameState {
  isGameStarted: boolean;
  gamePhase: GamePhase;
  user: User | null;
  isAuthenticated: boolean;
  selectedScenario: string | null;
  startGame: () => void;
  resetGame: () => void;
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setGamePhase: (phase: GamePhase) => void;
  setSelectedScenario: (scenarioId: string) => void;
}

export const useGameStore = create<GameState>((set) => ({
  isGameStarted: false,
  gamePhase: 'title',
  user: null,
  isAuthenticated: false,
  selectedScenario: null,
  startGame: () => set({ isGameStarted: true, gamePhase: 'disclaimer' }),
  resetGame: () => set({
    isGameStarted: false,
    gamePhase: 'title',
    user: null,
    isAuthenticated: false,
    selectedScenario: null
  }),
  setUser: (user) => set({ user }),
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setGamePhase: (phase) => set({ gamePhase: phase }),
  setSelectedScenario: (scenarioId) => set({ selectedScenario: scenarioId, gamePhase: 'scenario-loading' }),
}));