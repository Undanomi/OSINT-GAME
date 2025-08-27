'use client';

import React, { useMemo } from 'react';
import { Window } from './Window';
import { useWindowStore } from '@/store/windowStore';

/**
 * ウィンドウマネージャーコンポーネント - デスクトップ環境のウィンドウ管理システム
 * 開いているすべてのウィンドウを管理し、適切にレンダリングする責任を持つ
 * ウィンドウストアから状態を取得し、開いているウィンドウのみを表示
 * 
 * 主な機能:
 * - 開いているウィンドウの一覧取得と管理
 * - ウィンドウの表示/非表示制御
 * - パフォーマンス最適化（useMemoによるフィルタリング最適化）
 * 
 * @returns JSX.Element - 開いているすべてのウィンドウコンポーネントのレンダリング結果
 */
export const WindowManager: React.FC = () => {
  // ウィンドウストアからすべてのウィンドウ状態を取得
  const allWindows = useWindowStore(state => state.windows);
  
  /**
   * 開いているウィンドウのみをフィルタリング
   * useMemoを使用してallWindowsが変更された時のみ再計算を実行
   * 最小化されたウィンドウも含む（isOpenがtrueのもの）
   */
  const openWindows = useMemo(() => {
    return allWindows.filter(w => w.isOpen);
  }, [allWindows]);

  return (
    <>
      {/* 開いている各ウィンドウをWindowコンポーネントとしてレンダリング */}
      {openWindows.map((window) => (
        <Window key={window.id} window={window} />
      ))}
    </>
  );
};