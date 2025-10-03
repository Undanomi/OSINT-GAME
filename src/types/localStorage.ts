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

  // Goggles Mail関連
  GOGGLES_MAIL_CACHE: 'goggles_mail_cache',
  GOGGLES_MAIL_CACHE_TIMESTAMP: 'goggles_mail_cache_timestamp',

  // SNS関連
  SOCIAL_CACHE_PREFIX: 'social_cache_',
} as const;

// キャッシュの有効期限
export const CACHE_EXPIRY = 24 * 60 * 60 * 1000;