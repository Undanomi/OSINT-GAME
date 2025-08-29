import { create } from 'zustand';

/**
 * ウィンドウの状態を表すインターフェース
 */
export interface WindowState {
  id: string;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  appType: string;
}

/**
 * ウィンドウの状態管理インターフェース
 */
interface WindowStore {
  windows: WindowState[];
  maxZIndex: number;
  activeWindowId: string | null;
  openWindow: (appConfig: {
    id: string;
    title: string;
    appType: string;
    defaultWidth?: number;
    defaultHeight?: number;
  }) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;  // 新しく追加
  focusWindow: (id: string) => void;
  focusWindowOnInteraction: (id: string) => void; // ユーザー操作時のフォーカス
  updateWindowPosition: (id: string, x: number, y: number) => void;
  updateWindowSize: (id: string, width: number, height: number) => void;
  getWindowById: (id: string) => WindowState | undefined;
}

/**
 * ウィンドウの状態管理ストア
 */
export const useWindowStore = create<WindowStore>((set, get) => ({
  windows: [],
  maxZIndex: 1000,
  activeWindowId: null,

  // ウィンドウを開く
  openWindow: (appConfig) => {
    const existingWindow = get().windows.find(w => w.id === appConfig.id);
    if (existingWindow && existingWindow.isOpen) {
      // 既に開いているウィンドウの場合は、最小化解除とフォーカスのみ
      get().focusWindowOnInteraction(appConfig.id);
      return;
    }

    const newZIndex = get().maxZIndex + 1;
    const newWindow: WindowState = {
      id: appConfig.id,
      title: appConfig.title,
      isOpen: true,
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
      activeWindowId: appConfig.id, // 新しく開いたウィンドウを即座にアクティブに
    }));
  },

  // ウィンドウを閉じる
  closeWindow: (id) => {
    set(state => ({
      windows: state.windows.map(w =>
        w.id === id ? { ...w, isOpen: false } : w
      ),
    }));
  },

  // ウィンドウを最小化
  minimizeWindow: (id) => {
    set(state => ({
      windows: state.windows.map(w =>
        w.id === id ? { ...w, isMinimized: true } : w
      ),
      // 最小化されたウィンドウがアクティブウィンドウの場合、アクティブウィンドウをクリア
      activeWindowId: state.activeWindowId === id ? null : state.activeWindowId,
    }));
  },

  // ウィンドウを復元（最小化解除）
  restoreWindow: (id) => {
    set(state => ({
      windows: state.windows.map(w =>
        w.id === id ? { ...w, isMinimized: false } : w
      ),
    }));
  },

  // ウィンドウをフォーカスする（自動フォーカス）
  focusWindow: (id) => {
    const { activeWindowId } = get();

    // 既にアクティブなら何もしない
    if (activeWindowId === id) return;

    set({ activeWindowId: id });
  },

  // ユーザー操作によるウィンドウフォーカス（zIndex更新あり）
  focusWindowOnInteraction: (id) => {
    const { activeWindowId, windows, maxZIndex } = get();

    const targetWindow = windows.find(w => w.id === id);
    if (!targetWindow) return;

    // 最小化されている場合は、activeWindowIdに関係なく復元する
    if (targetWindow.isMinimized) {
      const newZIndex = maxZIndex + 1;
      set({
        windows: windows.map(w =>
          w.id === id
            ? { ...w, zIndex: newZIndex, isMinimized: false }
            : w
        ),
        maxZIndex: newZIndex,
        activeWindowId: id,
      });
      return;
    }

    // 既にアクティブで最前面なら何もしない
    if (activeWindowId === id) return;

    // 必要な場合のみzIndexを更新（他のウィンドウが前面にある場合）
    const needsZIndexUpdate = windows.some(w =>
      w.id !== id &&
      w.zIndex > targetWindow.zIndex &&
      w.isOpen &&
      !w.isMinimized
    );
    const newZIndex = needsZIndexUpdate ? maxZIndex + 1 : targetWindow.zIndex;

    set({
      windows: windows.map(w =>
        w.id === id
          ? { ...w, zIndex: newZIndex, isMinimized: false }
          : w
      ),
      maxZIndex: needsZIndexUpdate ? newZIndex : maxZIndex,
      activeWindowId: id,
    });
  },

  // ウィンドウ位置の更新
  updateWindowPosition: (id, x, y) => {
    set(state => ({
      windows: state.windows.map(w =>
        w.id === id ? { ...w, x, y } : w
      ),
    }));
  },

  // ウィンドウサイズの更新
  updateWindowSize: (id, width, height) => {
    set(state => ({
      windows: state.windows.map(w =>
        w.id === id ? { ...w, width, height } : w
      ),
    }));
  },

  // ウィンドウの取得
  getWindowById: (id) => {
    return get().windows.find(w => w.id === id);
  },
}));