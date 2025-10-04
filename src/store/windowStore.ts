import { create } from 'zustand';

/**
 * レイアウト関連の定数
 */
const TASKBAR_HEIGHT = 48; // タスクバーの高さ (h-12 = 48px)
const TOP_MARGIN = 50; // ウィンドウの上部余白
const LEFT_MARGIN = 100; // ウィンドウの左部余白（デスクトップアイコンとの重なりを避けるため大きめ）
const BOTTOM_MARGIN = 20; // ウィンドウの下部余白（タスクバー以外）
const RIGHT_MARGIN = 20; // ウィンドウの右部余白（画面端からの最小マージン）
const DEFAULT_VIEWPORT_WIDTH = 1920; // デフォルトのビューポート幅 (FHD)
const DEFAULT_VIEWPORT_HEIGHT = 1080; // デフォルトのビューポート高さ (FHD)

/**
 * ウィンドウの状態を表すインターフェース
 */
export interface WindowState {
  id: string;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  isHidden: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  appType: string;
  // 最大化前の状態を保存
  previousX?: number;
  previousY?: number;
  previousWidth?: number;
  previousHeight?: number;
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
    isHidden?: boolean;
  }) => void;
  showWindow: (id: string) => void;
  hideWindow: (id: string) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  unmaximizeWindow: (id: string, newPosition?: { x: number; y: number }) => void;
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
    if (existingWindow && existingWindow.isOpen && !existingWindow.isHidden) {
      // 既に開いているウィンドウの場合は、最小化解除とフォーカスのみ
      get().focusWindowOnInteraction(appConfig.id);
      return;
    }

    const newZIndex = get().maxZIndex + 1;
    const isHidden = appConfig.isHidden || false;

    // 画面サイズを取得（ブラウザ環境でない場合はデフォルト値を使用）
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : DEFAULT_VIEWPORT_HEIGHT;
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : DEFAULT_VIEWPORT_WIDTH;

    // 利用可能な領域を計算
    const availableHeight = viewportHeight - TASKBAR_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN;
    const availableWidth = viewportWidth - LEFT_MARGIN - RIGHT_MARGIN;

    // ウィンドウサイズを利用可能な領域に収まるように調整
    const defaultWidth = appConfig.defaultWidth || 800;
    const defaultHeight = appConfig.defaultHeight || 600;

    const windowWidth = Math.min(defaultWidth, availableWidth);
    const windowHeight = Math.min(defaultHeight, availableHeight);

    // ランダムな位置を計算（ウィンドウがタスクバーに重ならない範囲内）
    const maxX = viewportWidth - windowWidth - RIGHT_MARGIN;
    const maxY = viewportHeight - TASKBAR_HEIGHT - windowHeight - BOTTOM_MARGIN;

    const randomX = LEFT_MARGIN + Math.random() * Math.max(0, maxX - LEFT_MARGIN);
    const randomY = TOP_MARGIN + Math.random() * Math.max(0, maxY - TOP_MARGIN);

    const newWindow: WindowState = {
      id: appConfig.id,
      title: appConfig.title,
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      isHidden: isHidden,
      x: randomX,
      y: randomY,
      width: windowWidth,
      height: windowHeight,
      zIndex: newZIndex,
      appType: appConfig.appType,
    };

    set(state => ({
      windows: existingWindow
        ? state.windows.map(w => w.id === appConfig.id ? newWindow : w)
        : [...state.windows, newWindow],
      maxZIndex: newZIndex,
      activeWindowId: isHidden ? state.activeWindowId : appConfig.id, // 非表示の場合はアクティブにしない
    }));
  },

  // ウィンドウを表示する
  showWindow: (id) => {
    const targetWindow = get().windows.find(w => w.id === id);
    if (!targetWindow || !targetWindow.isHidden) return;

    get().focusWindowOnInteraction(id);
    set(state => ({
      windows: state.windows.map(w =>
        w.id === id ? { ...w, isHidden: false } : w
      ),
    }));
  },

  // ウィンドウを非表示にする
  hideWindow: (id) => {
    set(state => ({
      windows: state.windows.map(w =>
        w.id === id ? { ...w, isHidden: true } : w
      ),
      activeWindowId: state.activeWindowId === id ? null : state.activeWindowId,
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
    const targetWindow = get().windows.find(w => w.id === id);
    if (!targetWindow) return;

    // 画面サイズを取得
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : DEFAULT_VIEWPORT_HEIGHT;

    // Y座標がタスクバーに重ならないように制限
    const maxY = viewportHeight - TASKBAR_HEIGHT - targetWindow.height;
    const constrainedY = Math.min(y, maxY);
    const constrainedX = Math.max(0, x);

    set(state => ({
      windows: state.windows.map(w =>
        w.id === id ? { ...w, x: constrainedX, y: constrainedY } : w
      ),
    }));
  },

  // ウィンドウサイズの更新
  updateWindowSize: (id, width, height) => {
    const targetWindow = get().windows.find(w => w.id === id);
    if (!targetWindow) return;

    // 画面サイズを取得
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : DEFAULT_VIEWPORT_HEIGHT;

    // リサイズ後にウィンドウの下端がタスクバーに重なるかチェック
    const windowBottom = targetWindow.y + height;
    const taskbarTop = viewportHeight - TASKBAR_HEIGHT;

    // タスクバーに重なる場合はリサイズをキャンセル（元のサイズを維持）
    if (windowBottom > taskbarTop) {
      return;
    }

    set(state => ({
      windows: state.windows.map(w =>
        w.id === id ? { ...w, width, height } : w
      ),
    }));
  },

  // ウィンドウを最大化
  maximizeWindow: (id) => {
    const targetWindow = get().windows.find(w => w.id === id);
    if (!targetWindow || targetWindow.isMaximized) return;

    // 画面サイズを取得
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : DEFAULT_VIEWPORT_HEIGHT;
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : DEFAULT_VIEWPORT_WIDTH;

    // 最大化時のサイズと位置を計算（タスクバーの高さを考慮）
    const maxWidth = viewportWidth;
    const maxHeight = viewportHeight - TASKBAR_HEIGHT;

    set(state => ({
      windows: state.windows.map(w =>
        w.id === id
          ? {
              ...w,
              isMaximized: true,
              previousX: w.x,
              previousY: w.y,
              previousWidth: w.width,
              previousHeight: w.height,
              x: 0,
              y: 0,
              width: maxWidth,
              height: maxHeight,
            }
          : w
      ),
    }));
  },

  // ウィンドウの最大化を解除
  unmaximizeWindow: (id, newPosition?: { x: number; y: number }) => {
    const targetWindow = get().windows.find(w => w.id === id);
    if (!targetWindow || !targetWindow.isMaximized) return;

    const restoredX = newPosition?.x ?? targetWindow.previousX ?? targetWindow.x;
    const restoredY = newPosition?.y ?? targetWindow.previousY ?? targetWindow.y;

    set(state => ({
      windows: state.windows.map(w =>
        w.id === id
          ? {
              ...w,
              isMaximized: false,
              x: restoredX,
              y: restoredY,
              width: w.previousWidth ?? w.width,
              height: w.previousHeight ?? w.height,
              previousX: undefined,
              previousY: undefined,
              previousWidth: undefined,
              previousHeight: undefined,
            }
          : w
      ),
    }));
  },

  // ウィンドウの取得
  getWindowById: (id) => {
    return get().windows.find(w => w.id === id);
  },
}));