import { create } from 'zustand';

export interface WindowState {
  id: string;
  title: string;
  isOpen: boolean;
  isMaximized: boolean;
  isMinimized: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  appType: string;
}

interface WindowStore {
  windows: WindowState[];
  maxZIndex: number;
  openWindow: (appConfig: {
    id: string;
    title: string;
    appType: string;
    defaultWidth?: number;
    defaultHeight?: number;
  }) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindowPosition: (id: string, x: number, y: number) => void;
  updateWindowSize: (id: string, width: number, height: number) => void;
  getWindowById: (id: string) => WindowState | undefined;
}

export const useWindowStore = create<WindowStore>((set, get) => ({
  windows: [],
  maxZIndex: 1000,

  openWindow: (appConfig) => {
    const existingWindow = get().windows.find(w => w.id === appConfig.id);
    if (existingWindow && existingWindow.isOpen) {
      get().focusWindow(appConfig.id);
      return;
    }

    const newZIndex = get().maxZIndex + 1;
    const newWindow: WindowState = {
      id: appConfig.id,
      title: appConfig.title,
      isOpen: true,
      isMaximized: false,
      isMinimized: false,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 100,
      width: appConfig.defaultWidth || 800,
      height: appConfig.defaultHeight || 600,
      zIndex: newZIndex,
      appType: appConfig.appType,
    };

    set(state => ({
      windows: existingWindow 
        ? state.windows.map(w => w.id === appConfig.id ? newWindow : w)
        : [...state.windows, newWindow],
      maxZIndex: newZIndex,
    }));
  },

  closeWindow: (id) => {
    set(state => ({
      windows: state.windows.map(w => 
        w.id === id ? { ...w, isOpen: false } : w
      ),
    }));
  },

  minimizeWindow: (id) => {
    set(state => ({
      windows: state.windows.map(w => 
        w.id === id ? { ...w, isMinimized: !w.isMinimized } : w
      ),
    }));
  },

  maximizeWindow: (id) => {
    set(state => ({
      windows: state.windows.map(w => {
        if (w.id !== id) return w;
        
        if (w.isMaximized) {
          // 最大化を解除する場合
          return {
            ...w,
            isMaximized: false,
            x: w.x || 100,
            y: w.y || 100,
            width: w.width || 800,
            height: w.height || 600,
          };
        } else {
          // 最大化する場合
          return {
            ...w,
            isMaximized: true,
            x: 0,
            y: 0,
            width: typeof window !== 'undefined' ? window.innerWidth : 1200,
            height: typeof window !== 'undefined' ? window.innerHeight - 50 : 700,
          };
        }
      }),
    }));
  },

  focusWindow: (id) => {
    const newZIndex = get().maxZIndex + 1;
    set(state => ({
      windows: state.windows.map(w => 
        w.id === id ? { ...w, zIndex: newZIndex, isMinimized: false } : w
      ),
      maxZIndex: newZIndex,
    }));
  },

  updateWindowPosition: (id, x, y) => {
    set(state => ({
      windows: state.windows.map(w => 
        w.id === id ? { ...w, x, y } : w
      ),
    }));
  },

  updateWindowSize: (id, width, height) => {
    set(state => ({
      windows: state.windows.map(w => 
        w.id === id ? { ...w, width, height } : w
      ),
    }));
  },

  getWindowById: (id) => {
    return get().windows.find(w => w.id === id);
  },
}));