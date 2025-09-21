import { create } from 'zustand';
import type { SubmissionResult } from '@/types/messenger';

interface SubmissionState {
  isInSubmissionMode: boolean;
  currentQuestion: number;
  answers: string[];
  totalQuestions: number;
  lastSubmissionResult?: {
    success: boolean;
    timestamp: Date;
    explanationText?: string;
    correctAnswers: number;
    totalQuestions: number;
  };
}

interface SubmissionStore {
  submissionState: SubmissionState;
  setSubmissionMode: (mode: boolean) => void;
  setSubmissionQuestion: (questionIndex: number) => void;
  addSubmissionAnswer: (answer: string) => void;
  resetSubmission: () => void;
  setSubmissionResult: (result: SubmissionResult) => void;
  clearSubmissionHistory: () => void;
}

export const useSubmissionStore = create<SubmissionStore>((set) => ({
  submissionState: {
    isInSubmissionMode: false,
    currentQuestion: 0,
    answers: [],
    totalQuestions: 3,
  },

  setSubmissionMode: (mode) => set((state) => ({
    submissionState: {
      ...state.submissionState,
      isInSubmissionMode: mode,
      currentQuestion: mode ? 1 : 0,
      answers: mode ? [] : state.submissionState.answers,
    }
  })),

  setSubmissionQuestion: (questionIndex) => set((state) => ({
    submissionState: {
      ...state.submissionState,
      currentQuestion: questionIndex,
    }
  })),

  addSubmissionAnswer: (answer) => set((state) => ({
    submissionState: {
      ...state.submissionState,
      answers: [...state.submissionState.answers, answer],
    }
  })),

  resetSubmission: () => set((state) => ({
    submissionState: {
      ...state.submissionState,
      isInSubmissionMode: false,
      currentQuestion: 0,
      answers: [],
    }
  })),

  setSubmissionResult: (result) => set((state) => ({
    submissionState: {
      ...state.submissionState,
      lastSubmissionResult: {
        success: result.success,
        timestamp: new Date(),
        explanationText: result.explanationText,
        correctAnswers: result.correctAnswers,
        totalQuestions: result.totalQuestions,
      }
    }
  })),

  clearSubmissionHistory: () => set((state) => ({
    submissionState: {
      ...state.submissionState,
      lastSubmissionResult: undefined,
    }
  })),
}));