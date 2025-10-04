'use client';

import { create } from 'zustand';

interface OSINTricksAuthState {
  isAuthenticated: boolean;
  authenticate: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const useOSINTricksAuthStore = create<OSINTricksAuthState>()((set) => ({
  isAuthenticated: false,

  authenticate: async (username: string, password: string) => {
    const { authenticateOSINTricks } = await import('@/actions/osintricksValidation');
    const result = await authenticateOSINTricks(username, password);

    if (result) {
      set({ isAuthenticated: true });
      return true;
    }
    return false;
  },

  logout: () => {
    set({ isAuthenticated: false });
  },
}));
