// ローカルストレージのキーと対応するデータ型を定義

export const LOCAL_STORAGE_KEYS = {
  SEARCH_CACHE: 'osint-game-search-cache',
  CACHE_TIMESTAMP: 'osint-game-cache-timestamp',
  NOTES: 'osint-game-notes',
  NOTES_STATUS: 'osint-game-notes-status',
} as const;

export type LocalStorageKey = 
  | 'osint-game-search-cache'
  | 'osint-game-cache-timestamp'
  | 'osint-game-notes'
  | 'osint-game-notes-status';

export interface LocalStorageData {
  'osint-game-search-cache': unknown;
  'osint-game-cache-timestamp': string;
  'osint-game-notes': unknown[];
  'osint-game-notes-status': unknown;
}

export type LocalStorageValue<K extends LocalStorageKey> = LocalStorageData[K];