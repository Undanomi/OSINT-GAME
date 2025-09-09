import { LocalStorageKey, LocalStorageValue, LOCAL_STORAGE_KEYS } from '@/types/localStorage';

// ローカルストレージの操作を行うユーティリティクラス

export class LocalStorageManager {
  static get<K extends LocalStorageKey>(key: K): LocalStorageValue<K> | null {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return null;
      
      if (key === LOCAL_STORAGE_KEYS.CACHE_TIMESTAMP) {
        return item as LocalStorageValue<K>;
      }
      
      return JSON.parse(item);
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return null;
    }
  }

  static set<K extends LocalStorageKey>(key: K, value: LocalStorageValue<K>): void {
    try {
      if (key === LOCAL_STORAGE_KEYS.CACHE_TIMESTAMP) {
        localStorage.setItem(key, value as string);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error(`Error writing localStorage key "${key}":`, error);
    }
  }

  static remove(key: LocalStorageKey): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }

  static clear(): void {
    try {
      Object.values(LOCAL_STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }

  static has(key: LocalStorageKey): boolean {
    return localStorage.getItem(key) !== null;
  }
}