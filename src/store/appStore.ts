import { create } from 'zustand';
import { LucideIcon } from 'lucide-react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

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
  isSystem?: boolean;
  installDate?: Date;
  lastUsed?: Date;
  usageCount: number;
}

// Firestoreに保存する最小限のデータ
interface FirestoreAppData {
  installDate: Timestamp | ReturnType<typeof serverTimestamp>;
  lastUsed?: Timestamp;
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
  loadPersistedApps: () => Promise<string[]>;
}

// ユーザーIDを取得するヘルパー関数
const getCurrentUserId = (): string => {
  return auth.currentUser?.uid || 'default-user';
};

const persistAppToFirestore = async (appId: string, installDate: Date, usageCount: number = 0) => {
  try {
    const userId = getCurrentUserId();
    // users/{userId}/installedApps/{appId} に最小限のデータを保存
    const docRef = doc(db, 'users', userId, 'installedApps', appId);
    const appData: FirestoreAppData = {
      installDate: Timestamp.fromDate(installDate),
      usageCount
    };

    await setDoc(docRef, appData);
  } catch (error) {
    console.error('Error persisting app to Firestore:', error);
  }
};

const removeAppFromFirestore = async (appId: string) => {
  try {
    const userId = getCurrentUserId();
    // users/{userId}/installedApps/{appId} から削除
    const docRef = doc(db, 'users', userId, 'installedApps', appId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error removing app from Firestore:', error);
  }
};

const updateAppUsageInFirestore = async (appId: string, usageCount: number) => {
  try {
    const userId = getCurrentUserId();
    // users/{userId}/installedApps/{appId} の使用統計を更新
    const docRef = doc(db, 'users', userId, 'installedApps', appId);
    await setDoc(docRef, {
      lastUsed: serverTimestamp(),
      usageCount
    }, { merge: true });
  } catch (error) {
    console.error('Error updating app usage in Firestore:', error);
  }
};

export const useAppStore = create<AppStore>((set, get) => ({
  installedApps: [],
  availableApps: [],

  installApp: async (appMetadata) => {
    const { installedApps } = get();
    const isAlreadyInstalled = installedApps.some(app => app.id === appMetadata.id);
    if (isAlreadyInstalled) return;

    const installedApp: AppMetadata = {
      ...appMetadata,
      isInstalled: true,
      installDate: new Date(),
      usageCount: 0
    };

    set(state => ({
      installedApps: [...state.installedApps, installedApp],
      availableApps: state.availableApps.filter(app => app.id !== appMetadata.id)
    }));

    // システムアプリ以外のみFirestoreに保存
    if (!installedApp.isSystem) {
      await persistAppToFirestore(installedApp.id, installedApp.installDate!, installedApp.usageCount);
    }
  },

  uninstallApp: async (appId) => {
    const { installedApps } = get();
    const app = installedApps.find(app => app.id === appId);
    if (!app || app.isSystem) return;

    const uninstalledApp: AppMetadata = {
      ...app,
      isInstalled: false,
      installDate: undefined,
      lastUsed: undefined,
      usageCount: 0
    };

    set(state => ({
      installedApps: state.installedApps.filter(app => app.id !== appId),
      availableApps: [...state.availableApps, uninstalledApp]
    }));

    if (!app.isSystem) {
      await removeAppFromFirestore(appId);
    }
  },

  updateUsage: async (appId) => {
    const { installedApps } = get();
    const app = installedApps.find(a => a.id === appId);
    if (!app) return;

    const updatedApp = {
      ...app,
      lastUsed: new Date(),
      usageCount: app.usageCount + 1
    };

    set(state => ({
      installedApps: state.installedApps.map(a =>
        a.id === appId ? updatedApp : a
      )
    }));

    if (!app.isSystem) {
      await updateAppUsageInFirestore(appId, updatedApp.usageCount);
    }
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
  },

  loadPersistedApps: async () => {
    try {
      const userId = getCurrentUserId();
      // users/{userId}/installedApps コレクションからアプリIDのリストを取得
      const installedAppsRef = collection(db, 'users', userId, 'installedApps');
      const querySnapshot = await getDocs(installedAppsRef);

      // ドキュメントIDがアプリIDなので、それを返す
      return querySnapshot.docs.map(doc => doc.id);
    } catch (error) {
      console.error('Error loading persisted apps from Firestore:', error);
      return [];
    }
  }
}));