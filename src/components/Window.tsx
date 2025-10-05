'use client';

import React, { useCallback, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { X, Minus, Square, Copy } from 'lucide-react';
import { useWindowStore } from '@/store/windowStore';
import { BrowserApp, SocialApp, MessengerApp, AppStoreApp, CalculatorApp, NotesApp, NotificationTestApp } from '@/apps';

/**
 * ウィンドウコンポーネントの受け取るプロパティ
 */
interface WindowProps {
  // ウィンドウの一意識別子
  windowId: string;
}

/**
 * アプリ内UIを表示するコンポーネント
 *
 * @param appType - アプリの種類識別子
 * @param windowId - ウィンドウの一意識別子
 * @param isActive - ウィンドウがアクティブかどうかのフラグ
 */
const AppRenderer: React.FC<{ appType: string; windowId: string; isActive: boolean }> = React.memo(({
  appType,
  windowId,
  isActive
}) => {
  // 全てのアプリケーションで共通のプロパティを定義
  const appProps = { windowId, isActive };

  // appTypeで表示するコンポーネントを切り替え
  switch (appType) {
    case 'browser':
      return <BrowserApp {...appProps} />;
    case 'social':
      return <SocialApp {...appProps} />;
    case 'messenger':
      return <MessengerApp {...appProps} />;
    case 'app-store':
      return <AppStoreApp {...appProps} />;
    case 'calculator':
      return <CalculatorApp {...appProps} />;
    case 'notes':
      return <NotesApp {...appProps} />;
    case 'notification-test':
      return <NotificationTestApp {...appProps} />;
    default:
      // 不明なアプリ
      return (
        <div className="h-full w-full flex items-center justify-center text-gray-500">
          Unknown app type: {appType}
        </div>
      );
  }
});

AppRenderer.displayName = 'AppRenderer';

/**
 * 各アプリのウィンドウとアプリ内部UIを表示するコンポーネント
 */
export const Window: React.FC<WindowProps> = React.memo(({ windowId }) => {
  // ウィンドウストアから必要な状態とアクションを取得
  const targetWindow = useWindowStore(state => state.windows.find(w => w.id === windowId));
  const activeWindowId = useWindowStore(state => state.activeWindowId);
  const closeWindow = useWindowStore(state => state.closeWindow);
  const minimizeWindow = useWindowStore(state => state.minimizeWindow);
  const maximizeWindow = useWindowStore(state => state.maximizeWindow);
  const unmaximizeWindow = useWindowStore(state => state.unmaximizeWindow);
  const focusWindowOnInteraction = useWindowStore(state => state.focusWindowOnInteraction);
  const updateWindowPosition = useWindowStore(state => state.updateWindowPosition);
  const updateWindowSize = useWindowStore(state => state.updateWindowSize);

  // ウィンドウがアクティブか判定する
  const isActiveWindow = !!targetWindow && targetWindow.id === activeWindowId;

  // 最大化時のカスタムドラッグ状態
  const customDragRef = useRef<{
    isDragging: boolean;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  // ドラッグ開始時にフォーカス
  const handleDragStart = useCallback(() => {
    if (targetWindow && !isActiveWindow) {
      focusWindowOnInteraction(targetWindow.id);
    }
  }, [targetWindow, isActiveWindow, focusWindowOnInteraction]);

  // タイトルバーマウスダウン（最大化時のカスタムドラッグ開始）
  const handleTitleBarMouseDown = useCallback((e: React.MouseEvent) => {
    if (!targetWindow) return;

    // ボタンクリックの場合は無視
    if ((e.target as HTMLElement).closest('button')) return;

    if (!targetWindow.isMaximized) return;

    e.preventDefault();
    e.stopPropagation();

    const restoredWidth = targetWindow.previousWidth || targetWindow.width;
    const restoredHeight = targetWindow.previousHeight || targetWindow.height;
    const offsetX = restoredWidth / 2;
    const offsetY = 20;

    customDragRef.current = {
      isDragging: true,
      offsetX,
      offsetY,
    };

    // 画面サイズを取得
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const TASKBAR_HEIGHT = 48;

    // 最大化を解除し、マウス位置を中心に配置（画面内に収まるように調整）
    let newX = e.clientX - offsetX;
    let newY = e.clientY - offsetY;

    // 画面右端・左端の制限
    newX = Math.max(0, Math.min(newX, viewportWidth - restoredWidth));
    // 画面上端・下端の制限（タスクバーを考慮）
    newY = Math.max(0, Math.min(newY, viewportHeight - TASKBAR_HEIGHT - restoredHeight));

    unmaximizeWindow(targetWindow.id, { x: newX, y: newY });
  }, [targetWindow, unmaximizeWindow]);

  // マウスムーブ（カスタムドラッグ中）
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!customDragRef.current?.isDragging || !targetWindow) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const TASKBAR_HEIGHT = 48;

    let newX = e.clientX - customDragRef.current.offsetX;
    let newY = e.clientY - customDragRef.current.offsetY;

    // 画面内に収まるように制限
    newX = Math.max(0, Math.min(newX, viewportWidth - targetWindow.width));
    newY = Math.max(0, Math.min(newY, viewportHeight - TASKBAR_HEIGHT - targetWindow.height));

    updateWindowPosition(targetWindow.id, newX, newY);
  }, [targetWindow, updateWindowPosition]);

  // マウスアップ（カスタムドラッグ終了）
  const handleMouseUp = useCallback(() => {
    if (customDragRef.current) {
      customDragRef.current = null;
    }
  }, []);

  // カスタムドラッグのイベントリスナー登録
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleDragStop = useCallback((_e: unknown, d: { x: number; y: number }) => {
    if (!targetWindow) return;
    if (d.x !== targetWindow.x || d.y !== targetWindow.y) {
      updateWindowPosition(targetWindow.id, d.x, d.y);
    }
  }, [targetWindow, updateWindowPosition]);

  const handleResizeStart = useCallback(() => {
    if (targetWindow && !isActiveWindow) {
      focusWindowOnInteraction(targetWindow.id);
    }
  }, [targetWindow, isActiveWindow, focusWindowOnInteraction]);

  const handleResizeStop = useCallback((
    _e: unknown,
    _direction: unknown,
    ref: { style: { width?: string; height?: string } },
    _delta: unknown,
    position: { x: number; y: number }
  ) => {
    if (!targetWindow) return;
    const newWidth = ref.style.width ? parseInt(ref.style.width) : targetWindow.width;
    const newHeight = ref.style.height ? parseInt(ref.style.height) : targetWindow.height;

    if (newWidth !== targetWindow.width || newHeight !== targetWindow.height) {
      updateWindowSize(targetWindow.id, newWidth, newHeight);
    }
    if (position.x !== targetWindow.x || position.y !== targetWindow.y) {
      updateWindowPosition(targetWindow.id, position.x, position.y);
    }
  }, [targetWindow, updateWindowSize, updateWindowPosition]);

  const handleFocus = useCallback(() => {
    if (targetWindow) {
      focusWindowOnInteraction(targetWindow.id);
    }
  }, [targetWindow, focusWindowOnInteraction]);

  const handleMinimize = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (targetWindow) {
      minimizeWindow(targetWindow.id);
    }
  }, [targetWindow, minimizeWindow]);

  const handleMaximize = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (targetWindow) {
      if (targetWindow.isMaximized) {
        unmaximizeWindow(targetWindow.id);
      } else {
        maximizeWindow(targetWindow.id);
      }
    }
  }, [targetWindow, maximizeWindow, unmaximizeWindow]);

  const handleClose = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (targetWindow) {
      closeWindow(targetWindow.id);
    }
  }, [targetWindow, closeWindow]);  // 自動フォーカスのuseEffectを削除（ちらつきの原因）
  // ユーザー操作時のみフォーカスを変更するように修正

  // コンポーネントの表示条件
  if (!targetWindow || !targetWindow.isOpen || targetWindow.isMinimized) {
    return null;
  }

  // 非表示状態の場合はアプリのみをレンダリング（ウィンドウUIは非表示）
  if (targetWindow.isHidden) {
    return (
      <div style={{ display: 'none' }}>
        <AppRenderer
          appType={targetWindow.appType}
          windowId={targetWindow.id}
          isActive={false}
        />
      </div>
    );
  }

  return (
    <Rnd
      size={{
        width: targetWindow.width,
        height: targetWindow.height
      }}
      position={{
        x: targetWindow.x,
        y: targetWindow.y
      }}
      enableUserSelectHack={false}
      disableDragging={targetWindow.isMaximized}  // 最大化時はRndのドラッグ無効
      // ドラッグ開始時にフォーカス
      onDragStart={handleDragStart}
      // ドラッグ終了時の位置更新処理（変更時のみ）
      onDragStop={handleDragStop}
      // リサイズ開始時にフォーカス
      onResizeStart={handleResizeStart}
      // リサイズ終了時のサイズと位置更新処理（変更時のみ）
      onResizeStop={handleResizeStop}
      minWidth={300}                              // 最小幅
      minHeight={200}                             // 最小高さ
      bounds="parent"                             // 親要素内でのみ移動可能
      dragHandleClassName="window-drag-handle"    // ドラッグハンドルのクラス名
      enableResizing={!targetWindow.isMaximized}  // 最大化時はリサイズ無効
      style={{
        zIndex: targetWindow.zIndex,
        willChange: 'transform',
        transform: 'translateZ(0)'
      }}
      className={`window-container window-transition ${isActiveWindow ? 'shadow-2xl' : 'shadow-lg opacity-95'}`}
    >
      {/* ウィンドウ本体 */}
      <div
        className={`h-full w-full rounded-lg overflow-hidden border flex flex-col transition-colors ${
          isActiveWindow ? 'border-blue-500/40' : 'border-gray-700/60'
        }`}
        onClick={handleFocus}
      >
        {/* タイトルバー */}
        <div
          className={`window-drag-handle flex-shrink-0 px-4 py-2 flex items-center justify-between cursor-move transition-colors ${
            isActiveWindow ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'
          }`}
          onMouseDown={handleTitleBarMouseDown}
        >
          {/* タイトル */}
          <div className="flex items-center space-x-2">
            <div className="font-medium text-sm">{targetWindow.title}</div>
          </div>

          {/* コントロールボタン（最小化、最大化、閉じる） */}
          <div className="flex items-center space-x-1">
            {/* 最小化ボタン */}
            <button
              onClick={handleMinimize}
              className={`window-control-button w-5 h-5 rounded-full flex items-center justify-center transition-all hover:scale-110 ${
                isActiveWindow ? 'bg-white/20 hover:bg-white/30' : 'bg-gray-400/30 hover:bg-gray-400/50'
              }`}
              title="最小化"
            >
              <Minus size={10} />
            </button>

            {/* 最大化/元に戻すボタン */}
            <button
              onClick={handleMaximize}
              className={`window-control-button w-5 h-5 rounded-full flex items-center justify-center transition-all hover:scale-110 ${
                isActiveWindow ? 'bg-white/20 hover:bg-white/30' : 'bg-gray-400/30 hover:bg-gray-400/50'
              }`}
              title={targetWindow?.isMaximized ? "元に戻す" : "最大化"}
            >
              {targetWindow?.isMaximized ? <Copy size={10} /> : <Square size={10} />}
            </button>

            {/* 閉じるボタン */}
            <button
              onClick={handleClose}
              className={`window-control-button w-5 h-5 rounded-full flex items-center justify-center transition-all hover:scale-110 ${
                isActiveWindow ? 'bg-white/20 hover:bg-white/30' : 'bg-gray-400/30 hover:bg-gray-400/50'
              }`}
              title="閉じる"
            >
              <X size={10} />
            </button>
          </div>
        </div>

        {/* アプリ内部UI */}
        <div className="app-content flex-1 overflow-auto">
          <AppRenderer
            appType={targetWindow.appType}
            windowId={targetWindow.id}
            isActive={isActiveWindow}
          />
        </div>
      </div>
    </Rnd>
  );
});

Window.displayName = 'Window';