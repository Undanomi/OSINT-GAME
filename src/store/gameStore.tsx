import { create } from 'zustand';

type GamePhase = 'title' | 'disclaimer' | 'scenario-selection' | 'scenario-loading' | 'game' | 'submission-explanation' | 'submission-failure';

interface GameState {
  isGameStarted: boolean;
  gamePhase: GamePhase;
  selectedScenario: string | null;
  startGame: () => void;
  resetGame: () => void;
  setGamePhase: (phase: GamePhase) => void;
  setSelectedScenario: (scenarioId: string) => void;
  completeSubmission: (success: boolean) => void;
}

export const useGameStore = create<GameState>((set) => ({
  isGameStarted: false,
  gamePhase: 'title',
  selectedScenario: null,
  startGame: () => set({ isGameStarted: true, gamePhase: 'disclaimer' }),
  resetGame: () => set({
    isGameStarted: false,
    gamePhase: 'title',
    selectedScenario: null,
  }),
  setGamePhase: (phase) => set({ gamePhase: phase }),
  setSelectedScenario: (scenarioId) => set({ selectedScenario: scenarioId, gamePhase: 'scenario-loading' }),
  completeSubmission: (success) => set({
    gamePhase: success ? 'submission-explanation' : 'submission-failure',
  }),
}));