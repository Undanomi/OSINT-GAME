/**
 * メッセンジャーアプリケーション関連の定数定義
 */

// ページネーション関連
export const MESSAGES_PER_PAGE = 20;

// レート制限関連
export const RATE_LIMIT_PER_MINUTE = 10;
export const RATE_LIMIT_WINDOW_MS = 60 * 1000;

// AI会話履歴の制限設定
export const MAX_CONVERSATION_HISTORY_LENGTH = 20;
export const MAX_CONVERSATION_HISTORY_SIZE = 50000;

// AI応答リトライ設定
export const MAX_AI_RETRY_ATTEMPTS = 3;

// キャッシュ関連
export const CACHE_PREFIX = 'messenger_cache_';
export const CACHE_EXPIRATION = 60 * 60 * 1000 * 24; // 24時間
export const CACHE_FRESHNESS_THRESHOLD = 5 * 60 * 1000; // 5分