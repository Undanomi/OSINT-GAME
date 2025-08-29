'use client';

import { Window } from './Window';
import { useWindowStore } from '@/store/windowStore';
import { useShallow } from 'zustand/react/shallow';

/**
 * ウィンドウストアから状態を取得し、開いているウィンドウのみを表示
 */
export const WindowManager: React.FC = () => {
  // 開いているウィンドウのIDを取得
  const openWindowIds = useWindowStore(
    useShallow(state => state.windows.filter(w => w.isOpen).map(w => w.id))
  );

  return (
    <>
      {/* 開いている各ウィンドウをWindowコンポーネントとしてレンダリング */}
      {openWindowIds.map((id) => (
        <Window key={id} windowId={id} />
      ))}
    </>
  );
};
