import React from 'react';
import { Desktop } from '@/components/Desktop';
import { WindowManager } from '@/components/WindowManager';
import { Taskbar } from '@/components/Taskbar';

export default function Home() {
  return (
    <div className="w-screen h-screen overflow-hidden relative">
      <Desktop />
      <WindowManager />
      <Taskbar />
    </div>
  );
}
