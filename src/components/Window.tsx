'use client';

import React, { useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { X, Minus } from 'lucide-react';
import { useWindowStore } from '@/store/windowStore';
import { BrowserApp, SocialApp, MessengerApp, AppStoreApp, CalculatorApp } from '@/apps';

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
const AppRenderer: React.FC<{ appType: string; windowId: string; isActive: boolean }> = ({
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
    default:
      // 不明なアプリ
      return (
        <div className="h-full w-full flex items-center justify-center text-gray-500">
          Unknown app type: {appType}
        </div>
      );
  }
};

/**
 * 各アプリのウィンドウとアプリ内部UIを表示するコンポーネント
 */
export const Window: React.FC<WindowProps> = ({ windowId }) => {
  // ウィンドウストアから必要な状態とアクションを取得
  const targetWindow = useWindowStore(state => state.windows.find(w => w.id === windowId));
  const activeWindowId = useWindowStore(state => state.activeWindowId);
  const closeWindow = useWindowStore(state => state.closeWindow);
  const minimizeWindow = useWindowStore(state => state.minimizeWindow);
  const focusWindow = useWindowStore(state => state.focusWindow);
  const updateWindowPosition = useWindowStore(state => state.updateWindowPosition);
  const updateWindowSize = useWindowStore(state => state.updateWindowSize);

  // ウィンドウがアクティブか判定する
  const isActiveWindow = !!targetWindow && targetWindow.id === activeWindowId;

  // ウィンドウを開いた時に自動フォーカス（アクティブでない && 最小化されていない && 開いている）
  useEffect(() => {
    if (!targetWindow) return;
    if (
      targetWindow.id !== activeWindowId &&
      !targetWindow.isMinimized &&
      targetWindow.isOpen
    ) {
      const timer = setTimeout(() => {
        focusWindow(targetWindow.id);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [targetWindow, activeWindowId, focusWindow]);

  // コンポーネントの表示条件
  if (!targetWindow || !targetWindow.isOpen || targetWindow.isMinimized) {
    return null;
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
      // ドラッグ終了時の位置更新処理（変更時のみ）
      onDragStop={(_e, d) => {
        if (d.x !== targetWindow.x || d.y !== targetWindow.y) {
          updateWindowPosition(targetWindow.id, d.x, d.y);
        }
      }}
      // リサイズ終了時のサイズと位置更新処理（変更時のみ）
      onResizeStop={(_e, _direction, ref, _delta, position) => {
        const newWidth = ref.style.width ? parseInt(ref.style.width) : targetWindow.width;
        const newHeight = ref.style.height ? parseInt(ref.style.height) : targetWindow.height;
        if (newWidth !== targetWindow.width || newHeight !== targetWindow.height) {
          updateWindowSize(targetWindow.id, newWidth, newHeight);
        }
        if (position.x !== targetWindow.x || position.y !== targetWindow.y) {
          updateWindowPosition(targetWindow.id, position.x, position.y);
        }
        }
      }
      minWidth={300}                              // 最小幅
      minHeight={200}                             // 最小高さ
      bounds="parent"                             // 親要素内でのみ移動可能
      dragHandleClassName="window-drag-handle"    // ドラッグハンドルのクラス名
      style={{ zIndex: targetWindow.zIndex }}     // z-indexで重ね順を制御
      className={`transition-all duration-200 ${isActiveWindow ? 'shadow-2xl' : 'shadow-lg opacity-95'}`}
    >
      {/* ウィンドウ本体 */}
      <div
        className={`h-full w-full bg-white rounded-lg overflow-hidden border-2 flex flex-col transition-colors ${
          isActiveWindow ? 'border-blue-500' : 'border-gray-300'
        }`}
        onClick={() => focusWindow(targetWindow.id)}
      >
        {/* タイトルバー */}
        <div
          className={`window-drag-handle flex-shrink-0 px-4 py-2 flex items-center justify-between cursor-move transition-colors ${
            isActiveWindow ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
          }`}
        >
          {/* タイトル */}
          <div className="flex items-center space-x-2">
            <div className="font-medium">{targetWindow.title}</div>
          </div>

          {/* コントロールボタン（最小化、閉じる） */}
          <div className="flex items-center space-x-1">
            {/* 最小化ボタン */}
            <button
              onClick={(e) => { e.stopPropagation(); minimizeWindow(targetWindow.id); }}
              className={`w-5 h-5 rounded-full flex items-center justify-center transition-all hover:scale-110 ${
                isActiveWindow ? 'bg-yellow-400 hover:bg-yellow-300' : 'bg-gray-400 hover:bg-yellow-400'
              }`}
              title="最小化"
            >
              <Minus size={10} className="text-gray-800" />
            </button>

            {/* 閉じるボタン */}
            <button
              onClick={(e) => { e.stopPropagation(); closeWindow(targetWindow.id); }}
              className={`w-5 h-5 rounded-full flex items-center justify-center transition-all hover:scale-110 ${
                isActiveWindow ? 'bg-red-400 hover:bg-red-300' : 'bg-gray-400 hover:bg-red-400'
              }`}
              title="閉じる"
            >
              <X size={10} className="text-gray-800" />
            </button>
          </div>
        </div>

        {/* アプリ内部UI */}
        <div className="flex-1 overflow-auto">
          <AppRenderer
            appType={targetWindow.appType}
            windowId={targetWindow.id}
            isActive={isActiveWindow}
          />
        </div>
      </div>
    </Rnd>
  );
};