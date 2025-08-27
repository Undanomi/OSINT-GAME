'use client';

import React, { useEffect, useMemo } from 'react';
import { Rnd } from 'react-rnd';
import { X, Minimize, Maximize, Minus } from 'lucide-react';
import { useWindowStore, WindowState } from '@/store/windowStore';
import { BrowserApp, SocialApp, MessengerApp, AppStoreApp, CalculatorApp } from '@/apps';

interface WindowProps {
  window: WindowState;
}

const AppRenderer: React.FC<{ appType: string; windowId: string; isActive: boolean }> = ({
  appType,
  windowId,
  isActive
}) => {
  const appProps = { windowId, isActive };

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
      return (
        <div className="h-full w-full flex items-center justify-center text-gray-500">
          Unknown app type: {appType}
        </div>
      );
  }
};

export const Window: React.FC<WindowProps> = ({ window }) => {
  const {
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    focusWindow,
    updateWindowPosition,
    updateWindowSize
  } = useWindowStore();

  const allWindows = useWindowStore(state => state.windows);

  const isActiveWindow = useMemo(() => {
    const maxZIndex = Math.max(...allWindows.map(w => w.zIndex));
    return window.zIndex === maxZIndex;
  }, [window.zIndex, allWindows]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!window.isMinimized && window.isOpen) {
        focusWindow(window.id);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [window.id, window.isMinimized, window.isOpen, focusWindow]);

  if (!window.isOpen || window.isMinimized) {
    return null;
  }

  return (
    <Rnd
      size={{
        width: window.isMaximized ? '100vw' : window.width,
        height: window.isMaximized ? 'calc(100vh - 50px)' : window.height
      }}
      position={{
        x: window.isMaximized ? 0 : window.x,
        y: window.isMaximized ? 0 : window.y
      }}
      onDragStop={(_e, d) => {
        if (!window.isMaximized) {
          updateWindowPosition(window.id, d.x, d.y);
        }
      }}
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
      minWidth={300}
      minHeight={200}
      bounds="parent"
      dragHandleClassName="window-drag-handle"
      disableDragging={window.isMaximized}
      enableResizing={!window.isMaximized}
      style={{ zIndex: window.zIndex }}
      className={`transition-all duration-200 ${isActiveWindow ? 'shadow-2xl' : 'shadow-lg opacity-95'}`}
    >
      <div
        className={`h-full w-full bg-white rounded-lg overflow-hidden border-2 flex flex-col transition-colors ${
          isActiveWindow ? 'border-blue-500' : 'border-gray-300'
        }`}
        onClick={() => focusWindow(window.id)}
      >
        <div
          className={`window-drag-handle flex-shrink-0 px-4 py-2 flex items-center justify-between cursor-move transition-colors ${
            isActiveWindow ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            <div className="font-medium">{window.title}</div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => { e.stopPropagation(); minimizeWindow(window.id); }}
              className={`w-5 h-5 rounded-full flex items-center justify-center transition-all hover:scale-110 ${ isActiveWindow ? 'bg-yellow-400 hover:bg-yellow-300' : 'bg-gray-400 hover:bg-yellow-400' }`}
              title="最小化"
            >
              <Minus size={10} className="text-gray-800" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); maximizeWindow(window.id); }}
              className={`w-5 h-5 rounded-full flex items-center justify-center transition-all hover:scale-110 ${ isActiveWindow ? 'bg-green-400 hover:bg-green-300' : 'bg-gray-400 hover:bg-green-400' }`}
              title={window.isMaximized ? "元のサイズに戻す" : "最大化"}
            >
              <Maximize size={10} className="text-gray-800" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); closeWindow(window.id); }}
              className={`w-5 h-5 rounded-full flex items-center justify-center transition-all hover:scale-110 ${ isActiveWindow ? 'bg-red-400 hover:bg-red-300' : 'bg-gray-400 hover:bg-red-400' }`}
              title="閉じる"
            >
              <X size={10} className="text-gray-800" />
            </button>
          </div>
        </div>

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