'use client';

import React, { useMemo } from 'react';
import { Window } from './Window';
import { useWindowStore } from '@/store/windowStore';

export const WindowManager: React.FC = () => {
  const allWindows = useWindowStore(state => state.windows);
  
  const openWindows = useMemo(() => {
    return allWindows.filter(w => w.isOpen);
  }, [allWindows]);

  return (
    <>
      {openWindows.map((window) => (
        <Window key={window.id} window={window} />
      ))}
    </>
  );
};