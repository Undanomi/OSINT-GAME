'use client';

import React, { useEffect, useMemo } from 'react';
import { Rnd } from 'react-rnd';
import { X, Minimize, Maximize, Minus } from 'lucide-react';
import { useWindowStore, WindowState } from '@/store/windowStore';
import { BrowserApp, SocialApp, MessengerApp, AppStoreApp, CalculatorApp } from '@/apps';

/**
 * ウィンドウコンポーネントのプロパティ型定義
 * WindowStateオブジェクトを受け取り、ウィンドウの表示と制御を行う
 */
interface WindowProps {
  /** ウィンドウの状態情報（位置、サイズ、アプリタイプなど） */
  window: WindowState;
}

/**
 * アプリケーションレンダラー - アプリタイプに基づいて適切なアプリコンポーネントを描画
 * ファクトリーパターンを使用してアプリタイプを動的にコンポーネントにマップ
 * 各アプリケーションに共通のプロパティ（windowId、isActive）を渡す
 * 
 * @param appType - アプリケーションの種類識別子
 * @param windowId - ウィンドウの一意識別子
 * @param isActive - ウィンドウがアクティブかどうかのフラグ
 * @returns JSX.Element - 対応するアプリケーションコンポーネント
 */
const AppRenderer: React.FC<{ appType: string; windowId: string; isActive: boolean }> = ({
  appType,
  windowId,
  isActive
}) => {
  // 全てのアプリケーションで共通のプロパティを定義
  const appProps = { windowId, isActive };

  // アプリタイプに基づいて対応するアプリケーションコンポーネントを返す
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
      // 不明なアプリタイプの場合のフォールバック表示
      return (
        <div className="h-full w-full flex items-center justify-center text-gray-500">
          Unknown app type: {appType}
        </div>
      );
  }
};

/**
 * ウィンドウコンポーネント - 単一のウィンドウの表示と操作を管理
 * デスクトップ環境における個々のアプリケーションウィンドウを実装
 * ドラッグ&ドロップ、リサイズ、最小化/最大化、フォーカス制御を提供
 * 
 * 主な機能:
 * - ウィンドウの移動とサイズ変更（react-rndライブラリを使用）
 * - ウィンドウコントロールボタン（最小化、最大化、閉じる）
 * - フォーカス管理とz-indexによる重ね順制御
 * - アプリケーションコンテンツの描画
 * 
 * @param window - ウィンドウの状態情報
 * @returns JSX.Element | null - ウィンドウコンポーネント、または非表示の場合はnull
 */
export const Window: React.FC<WindowProps> = ({ window }) => {
  // ウィンドウストアから操作用メソッドを取得
  const {
    closeWindow,           // ウィンドウを閉じる
    minimizeWindow,        // ウィンドウを最小化
    maximizeWindow,        // ウィンドウを最大化/復元
    focusWindow,           // ウィンドウにフォーカスを与える
    updateWindowPosition,  // ウィンドウ位置を更新
    updateWindowSize       // ウィンドウサイズを更新
  } = useWindowStore();

  // 全ウィンドウの状態を取得（アクティブウィンドウ判定用）
  const allWindows = useWindowStore(state => state.windows);

  /**
   * 現在のウィンドウがアクティブかどうかを判定
   * 全ウィンドウの中で最高のz-indexを持つウィンドウをアクティブとする
   * useMemoを使用してz-indexまたはウィンドウ一覧が変更された時のみ再計算
   */
  const isActiveWindow = useMemo(() => {
    const maxZIndex = Math.max(...allWindows.map(w => w.zIndex));
    return window.zIndex === maxZIndex;
  }, [window.zIndex, allWindows]);

  /**
   * ウィンドウが開かれた時の自動フォーカス処理
   * 最小化されていない開いたウィンドウに対して自動的にフォーカスを設定
   * setTimeoutを使用して次のレンダーサイクルでフォーカスを実行
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!window.isMinimized && window.isOpen) {
        focusWindow(window.id);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [window.id, window.isMinimized, window.isOpen, focusWindow]);

  // 閉じられているか最小化されているウィンドウは表示しない
  if (!window.isOpen || window.isMinimized) {
    return null;
  }

  return (
    /* react-rndライブラリを使用してドラッグ&ドロップとリサイズ機能を実装 */
    <Rnd
      size={{
        // 最大化時は画面全体、通常時はウィンドウの保存サイズを使用
        width: window.isMaximized ? '100vw' : window.width,
        height: window.isMaximized ? 'calc(100vh - 50px)' : window.height // タスクバー分を除く
      }}
      position={{
        // 最大化時は左上固定、通常時はウィンドウの保存位置を使用
        x: window.isMaximized ? 0 : window.x,
        y: window.isMaximized ? 0 : window.y
      }}
      // ドラッグ終了時の位置更新処理
      onDragStop={(_e, d) => {
        if (!window.isMaximized) {
          updateWindowPosition(window.id, d.x, d.y);
        }
      }}
      // リサイズ終了時のサイズと位置更新処理
      onResizeStop={(_e, _direction, ref, _delta, position) => {
        if (!window.isMaximized) {
          updateWindowSize(
            window.id,
            ref.style.width ? parseInt(ref.style.width) : window.width,
            ref.style.height ? parseInt(ref.style.height) : window.height
          );
          updateWindowPosition(window.id, position.x, position.y);
        }
      }}
      minWidth={300}                              // 最小幅
      minHeight={200}                             // 最小高さ
      bounds="parent"                             // 親要素内でのみ移動可能
      dragHandleClassName="window-drag-handle"    // ドラッグハンドルのクラス名
      disableDragging={window.isMaximized}        // 最大化時はドラッグ無効
      enableResizing={!window.isMaximized}        // 最大化時はリサイズ無効
      style={{ zIndex: window.zIndex }}           // z-indexで重ね順を制御
      className={`transition-all duration-200 ${isActiveWindow ? 'shadow-2xl' : 'shadow-lg opacity-95'}`}
    >
      {/* ウィンドウ本体のコンテナ */}
      <div
        className={`h-full w-full bg-white rounded-lg overflow-hidden border-2 flex flex-col transition-colors ${
          isActiveWindow ? 'border-blue-500' : 'border-gray-300'
        }`}
        onClick={() => focusWindow(window.id)} // クリックでフォーカス
      >
        {/* ウィンドウタイトルバー - ドラッグハンドルとコントロールボタンを含む */}
        <div
          className={`window-drag-handle flex-shrink-0 px-4 py-2 flex items-center justify-between cursor-move transition-colors ${
            isActiveWindow ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
          }`}
        >
          {/* ウィンドウタイトル */}
          <div className="flex items-center space-x-2">
            <div className="font-medium">{window.title}</div>
          </div>
          
          {/* ウィンドウコントロールボタン（最小化、最大化、閉じる） */}
          <div className="flex items-center space-x-1">
            {/* 最小化ボタン */}
            <button
              onClick={(e) => { e.stopPropagation(); minimizeWindow(window.id); }}
              className={`w-5 h-5 rounded-full flex items-center justify-center transition-all hover:scale-110 ${ 
                isActiveWindow ? 'bg-yellow-400 hover:bg-yellow-300' : 'bg-gray-400 hover:bg-yellow-400' 
              }`}
              title="最小化"
            >
              <Minus size={10} className="text-gray-800" />
            </button>
            
            {/* 最大化/復元ボタン */}
            <button
              onClick={(e) => { e.stopPropagation(); maximizeWindow(window.id); }}
              className={`w-5 h-5 rounded-full flex items-center justify-center transition-all hover:scale-110 ${ 
                isActiveWindow ? 'bg-green-400 hover:bg-green-300' : 'bg-gray-400 hover:bg-green-400' 
              }`}
              title={window.isMaximized ? "元のサイズに戻す" : "最大化"}
            >
              <Maximize size={10} className="text-gray-800" />
            </button>
            
            {/* 閉じるボタン */}
            <button
              onClick={(e) => { e.stopPropagation(); closeWindow(window.id); }}
              className={`w-5 h-5 rounded-full flex items-center justify-center transition-all hover:scale-110 ${ 
                isActiveWindow ? 'bg-red-400 hover:bg-red-300' : 'bg-gray-400 hover:bg-red-400' 
              }`}
              title="閉じる"
            >
              <X size={10} className="text-gray-800" />
            </button>
          </div>
        </div>

        {/* アプリケーションコンテンツエリア */}
        <div className="flex-1 overflow-auto">
          <AppRenderer
            appType={window.appType}
            windowId={window.id}
            isActive={isActiveWindow}
          />
        </div>
      </div>
    </Rnd>
  );
};