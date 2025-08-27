'use client';

import React, { useMemo } from 'react';
import { useWindowStore } from '@/store/windowStore';
import { useAppStore } from '@/store/appStore';

/**
 * タスクバーコンポーネンツ - デスクトップ環境の下部に表示されるタスク管理バー
 * 開いているアプリケーションの一覧表示、ウィンドウの切り替え、最小化/復元機能を提供
 * Windows/macOSのタスクバーやDockの機能をシミュレート
 * 
 * 主な機能:
 * - 開いているウィンドウのアイコンとタイトル表示
 * - クリックによるウィンドウのフォーカス/最小化切り替え
 * - 現在時刻の表示
 * - ウィンドウの状態（アクティブ/最小化）の視觚的区別
 * 
 * @returns JSX.Element - タスクバーのレンダリング結果
 */
export const Taskbar: React.FC = () => {
  // ウィンドウストアからウィンドウ状態と操作関数を取得
  const { windows, focusWindow, minimizeWindow } = useWindowStore();
  // アプリストアからアプリメタデータ取得関数を取得
  const { getAppById } = useAppStore();
  
  /**
   * 開いているウィンドウのみをフィルタリング
   * useMemoでパフォーマンス最適化（windowsが変更された時のみ再計算）
   */
  const openWindows = useMemo(() => {
    return windows.filter(w => w.isOpen);
  }, [windows]);

  /**
   * タスクバーアイテムクリック時の処理
   * ウィンドウの状態に応じてフォーカスまたは最小化を実行
   * 最小化されている場合は復元、アクティブな場合は最小化
   * 
   * @param windowId - 操作対象ウィンドウのID
   * @param isMinimized - ウィンドウが最小化されているかどうか
   */
  const handleTaskbarItemClick = (windowId: string, isMinimized: boolean) => {
    if (isMinimized) {
      // 最小化されている場合はウィンドウを復元してフォーカス
      focusWindow(windowId);
    } else {
      // アクティブな場合はウィンドウを最小化
      minimizeWindow(windowId);
    }
  };

  return (
    /* タスクバー本体 - 画面下部に固定表示 */
    <div className="fixed bottom-0 left-0 right-0 h-12 bg-gray-800 border-t border-gray-700 flex items-center px-4 z-50">
      {/* 開いているウィンドウのアイコン一覧 */}
      <div className="flex items-center space-x-2">
        {openWindows.map((window) => {
          // アプリタイプからアプリメタデータ（アイコンなど）を取得
          const appMetadata = getAppById(window.appType);
          const Icon = appMetadata?.icon;
          
          return (
            <button
              key={window.id}
              onClick={() => handleTaskbarItemClick(window.id, window.isMinimized)}
              className={`
                flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${window.isMinimized 
                  ? 'bg-gray-600 text-gray-300'           // 最小化時のスタイル
                  : 'bg-blue-600 text-white hover:bg-blue-700'  // アクティブ時のスタイル
                }
              `}
              title={window.title} // ツールチップでフルタイトルを表示
            >
              {/* アプリケーションアイコン */}
              {Icon && <Icon size={16} />}
              {/* ウィンドウタイトル（長い場合は省略） */}
              <span className="max-w-32 truncate">{window.title}</span>
            </button>
          );
        })}
      </div>
      
      {/* 時計表示エリア（右端） */}
      <div className="ml-auto flex items-center text-white text-sm">
        {new Date().toLocaleTimeString('ja-JP', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </div>
    </div>
  );
};