import { create } from 'zustand';

type GamePhase = 'title' | 'disclaimer' | 'scenario-selection' | 'scenario-loading' | 'game' | 'mission-complete' | 'game-over';

type GameOverReason = 'submission-failure' | 'social-relationship';

interface GameOverState {
  reason: GameOverReason;
  details?: string;
}

interface GameState {
  isGameStarted: boolean;
  gamePhase: GamePhase;
  selectedScenario: string | null;
  shouldResetData: boolean;
  gameOverState: GameOverState | null;
  startGame: () => void;
  resetGame: () => void;
  setGamePhase: (phase: GamePhase) => void;
  setSelectedScenario: (scenarioId: string, shouldReset?: boolean) => void;
  completeSubmission: (success: boolean) => void;
  triggerGameOver: (reason: GameOverReason, details?: string) => void;
}

export const useGameStore = create<GameState>((set) => ({
  isGameStarted: false,
  gamePhase: 'title',
  selectedScenario: null,
  shouldResetData: false,
  gameOverState: null,
  startGame: () => set({ isGameStarted: true, gamePhase: 'disclaimer' }),
  resetGame: () => set({
    isGameStarted: false,
    gamePhase: 'title',
    selectedScenario: null,
    shouldResetData: false,
    gameOverState: null,
  }),
  setGamePhase: (phase) => set({ gamePhase: phase }),
  setSelectedScenario: (scenarioId, shouldReset = false) => set({
    selectedScenario: scenarioId,
    shouldResetData: shouldReset,
    gamePhase: 'scenario-loading'
  }),
  completeSubmission: (success) => set({
    gamePhase: success ? 'mission-complete' : 'game-over',
    gameOverState: success ? null : { reason: 'submission-failure' },
  }),
  triggerGameOver: (reason, details) => set({
    gamePhase: 'game-over',
    gameOverState: { reason, details },
  }),
}));