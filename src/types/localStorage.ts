// ローカルストレージのキー定義
export const LOCAL_STORAGE_KEYS = {
  // 検索関連
  SEARCH_CACHE: 'osint-game-search-cache',
  CACHE_TIMESTAMP: 'osint-game-cache-timestamp',
  
  // ノート関連
  NOTES: 'osint-game-notes',
  NOTES_STATUS: 'osint-game-notes-status',
  
  // メッセンジャー関連
  MESSENGER_CACHE_PREFIX: 'messenger_cache_',
} as const;

// メッセンジャー関連の定数
export const MESSENGER_CACHE_CONFIG = {
  EXPIRATION: 60 * 60 * 1000 * 24, // 24時間
  FRESHNESS_THRESHOLD: 5 * 60 * 1000, // 5分
} as const;

// 型定義
export type LocalStorageKey = typeof LOCAL_STORAGE_KEYS[keyof typeof LOCAL_STORAGE_KEYS];