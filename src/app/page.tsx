'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Desktop } from '@/components/Desktop';

const WindowManager = dynamic(() => import('@/components/WindowManager').then(mod => ({ default: mod.WindowManager })), {
  ssr: false,
  loading: () => null
});

const Taskbar = dynamic(() => import('@/components/Taskbar').then(mod => ({ default: mod.Taskbar })), {
  ssr: false,
  loading: () => null
});

export default function Home() {
  return (
    <div className="w-screen h-screen overflow-hidden relative">
      <Desktop />
      <WindowManager />
      <Taskbar />
    </div>
  );
}
