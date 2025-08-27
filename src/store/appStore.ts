import { create } from 'zustand';
import { LucideIcon } from 'lucide-react';

export interface AppMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  category: 'productivity' | 'communication' | 'entertainment' | 'utility' | 'system';
  keywords: string[];
  author: string;
  icon: LucideIcon;
  defaultWidth?: number;
  defaultHeight?: number;
  minWidth?: number;
  minHeight?: number;
  isInstalled: boolean;
  isSystem?: boolean; // システムアプリは削除不可
  installDate?: Date;
  lastUsed?: Date;
  usageCount: number;
}

interface AppStore {
  installedApps: AppMetadata[];
  availableApps: AppMetadata[];
  installApp: (appMetadata: AppMetadata) => void;
  uninstallApp: (appId: string) => void;
  updateUsage: (appId: string) => void;
  getInstalledApps: () => AppMetadata[];
  getAppById: (appId: string) => AppMetadata | undefined;
  searchApps: (query: string) => AppMetadata[];
  getAppsByCategory: (category: string) => AppMetadata[];
}

export const useAppStore = create<AppStore>((set, get) => ({
  installedApps: [],
  availableApps: [],

  installApp: (appMetadata) => {
    set(state => {
      const isAlreadyInstalled = state.installedApps.some(app => app.id === appMetadata.id);
      if (isAlreadyInstalled) return state;

      const installedApp: AppMetadata = {
        ...appMetadata,
        isInstalled: true,
        installDate: new Date(),
        usageCount: 0
      };

      return {
        installedApps: [...state.installedApps, installedApp],
        availableApps: state.availableApps.filter(app => app.id !== appMetadata.id)
      };
    });
  },

  uninstallApp: (appId) => {
    set(state => {
      const app = state.installedApps.find(app => app.id === appId);
      if (!app || app.isSystem) return state;

      const uninstalledApp: AppMetadata = {
        ...app,
        isInstalled: false,
        installDate: undefined,
        lastUsed: undefined,
        usageCount: 0
      };

      return {
        installedApps: state.installedApps.filter(app => app.id !== appId),
        availableApps: [...state.availableApps, uninstalledApp]
      };
    });
  },

  updateUsage: (appId) => {
    set(state => ({
      installedApps: state.installedApps.map(app =>
        app.id === appId
          ? { ...app, lastUsed: new Date(), usageCount: app.usageCount + 1 }
          : app
      )
    }));
  },

  getInstalledApps: () => {
    return get().installedApps;
  },

  getAppById: (appId) => {
    const { installedApps, availableApps } = get();
    return installedApps.find(app => app.id === appId) || 
           availableApps.find(app => app.id === appId);
  },

  searchApps: (query) => {
    const { installedApps, availableApps } = get();
    const allApps = [...installedApps, ...availableApps];
    const lowerQuery = query.toLowerCase();

    return allApps.filter(app => 
      app.name.toLowerCase().includes(lowerQuery) ||
      app.description.toLowerCase().includes(lowerQuery) ||
      app.keywords.some(keyword => keyword.toLowerCase().includes(lowerQuery)) ||
      app.author.toLowerCase().includes(lowerQuery)
    );
  },

  getAppsByCategory: (category) => {
    const { installedApps, availableApps } = get();
    const allApps = [...installedApps, ...availableApps];
    return allApps.filter(app => app.category === category);
  }
}));