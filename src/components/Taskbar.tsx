'use client';

import React, { useMemo } from 'react';
import { useWindowStore } from '@/store/windowStore';
import { useAppStore } from '@/store/appStore';

export const Taskbar: React.FC = () => {
  const { windows, focusWindow, minimizeWindow } = useWindowStore();
  const { getAppById } = useAppStore();
  
  const openWindows = useMemo(() => {
    return windows.filter(w => w.isOpen);
  }, [windows]);

  const handleTaskbarItemClick = (windowId: string, isMinimized: boolean) => {
    if (isMinimized) {
      focusWindow(windowId);
    } else {
      minimizeWindow(windowId);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-12 bg-gray-800 border-t border-gray-700 flex items-center px-4 z-50">
      <div className="flex items-center space-x-2">
        {openWindows.map((window) => {
          const appMetadata = getAppById(window.appType);
          const Icon = appMetadata?.icon;
          
          return (
            <button
              key={window.id}
              onClick={() => handleTaskbarItemClick(window.id, window.isMinimized)}
              className={`
                flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${window.isMinimized 
                  ? 'bg-gray-600 text-gray-300' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                }
              `}
              title={window.title}
            >
              {Icon && <Icon size={16} />}
              <span className="max-w-32 truncate">{window.title}</span>
            </button>
          );
        })}
      </div>
      
      <div className="ml-auto flex items-center text-white text-sm">
        {new Date().toLocaleTimeString('ja-JP', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </div>
    </div>
  );
};