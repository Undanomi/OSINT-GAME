'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useWindowStore } from '@/store/windowStore';
import { useAppStore, AppMetadata } from '@/store/appStore';
import { initializeAppRegistry } from '@/config/appRegistry';
import { Package, Settings, RefreshCw, Info } from 'lucide-react';

interface DesktopIconProps {
  app: AppMetadata;
  onClick: () => void;
}

const DesktopIcon: React.FC<DesktopIconProps> = ({ app, onClick }) => {
  const Icon = app.icon;

  return (
    <div 
      className="flex flex-col items-center cursor-pointer p-2 rounded-lg hover:bg-white/20 transition-colors group"
      onClick={onClick}
      onDoubleClick={onClick}
    >
      <div className="w-16 h-16 flex items-center justify-center bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
        <Icon size={32} className="text-white" />
      </div>
      <span className="text-white text-sm mt-2 text-center leading-tight">
        {app.name}
      </span>
    </div>
  );
};

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onOpenAppStore: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose, onOpenAppStore }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[200px] z-50"
      style={{ left: x, top: y }}
    >
      <button
        onClick={() => {
          onOpenAppStore();
          onClose();
        }}
        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
      >
        <Package size={16} />
        <span>アプリストアを開く</span>
      </button>
      <button
        onClick={onClose}
        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
      >
        <RefreshCw size={16} />
        <span>デスクトップを更新</span>
      </button>
      <hr className="my-1" />
      <button
        onClick={onClose}
        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
      >
        <Settings size={16} />
        <span>デスクトップ設定</span>
      </button>
      <button
        onClick={onClose}
        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
      >
        <Info size={16} />
        <span>システム情報</span>
      </button>
    </div>
  );
};

export const Desktop: React.FC = () => {
  const openWindow = useWindowStore(state => state.openWindow);
  const { updateUsage, getInstalledApps, installedApps, availableApps } = useAppStore();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // マウント状態の管理
  useEffect(() => {
    setMounted(true);
  }, []);

  // アプリストアの初期化
  useEffect(() => {
    if (mounted && !initialized) {
      const { installedApps: systemApps, availableApps: availableAppsConfig } = initializeAppRegistry();
      
      // ストアを一度に更新
      useAppStore.setState(() => ({
        installedApps: [...systemApps],
        availableApps: [...availableAppsConfig]
      }));
      
      setInitialized(true);
    }
  }, [mounted, initialized]);

  const displayedApps = useMemo(() => {
    return getInstalledApps().sort((a, b) => {
      // システムアプリを最初に表示
      if (a.isSystem && !b.isSystem) return -1;
      if (!a.isSystem && b.isSystem) return 1;
      // 次に使用頻度順
      return b.usageCount - a.usageCount;
    });
  }, [installedApps]);

  const handleAppClick = (app: AppMetadata) => {
    // 使用回数を更新
    updateUsage(app.id);
    
    openWindow({
      id: app.id,
      title: app.name,
      appType: app.id,
      defaultWidth: app.defaultWidth,
      defaultHeight: app.defaultHeight,
    });
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleOpenAppStore = () => {
    const appStoreApp = displayedApps.find(app => app.id === 'app-store');
    if (appStoreApp) {
      handleAppClick(appStoreApp);
    }
  };

  return (
    <div 
      className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-700 relative"
      style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
      }}
      onContextMenu={handleContextMenu}
      onClick={() => setContextMenu(null)}
    >
      <div className="absolute top-8 left-8">
        <div className="grid grid-cols-1 gap-4">
          {displayedApps.map((app) => (
            <DesktopIcon 
              key={app.id} 
              app={app} 
              onClick={() => handleAppClick(app)}
            />
          ))}
        </div>
      </div>
      

      {/* コンテキストメニュー */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onOpenAppStore={handleOpenAppStore}
        />
      )}
    </div>
  );
};