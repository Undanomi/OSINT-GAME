'use client';

import { create } from 'zustand';

interface GogglesMailAuthState {
  isGogglesMailLoggedIn: boolean;
  loginToGogglesMail: () => void;
  logoutFromGogglesMail: () => void;
}

export const useGogglesMailAuthStore = create<GogglesMailAuthState>()((set) => ({
  isGogglesMailLoggedIn: false,

  loginToGogglesMail: () => {
    console.log('Setting isGogglesMailLoggedIn to true');
    set({
      isGogglesMailLoggedIn: true
    });
  },

  logoutFromGogglesMail: () => {
    console.log('Setting isGogglesMailLoggedIn to false');
    set({
      isGogglesMailLoggedIn: false
    });
  },
}));