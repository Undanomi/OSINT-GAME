import { LOCAL_STORAGE_KEYS } from '@/types/localStorage';

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
export const CACHE_PREFIX = LOCAL_STORAGE_KEYS.MESSENGER_CACHE_PREFIX;
export const CACHE_EXPIRATION = 60 * 60 * 1000 * 24; // 24時間
export const CACHE_FRESHNESS_THRESHOLD = 5 * 60 * 1000; // 5分

// プロンプト関連の型定義
export interface IntroductionMessage {
  text: string;
  fallbackText: string;
}

export interface SystemPrompt {
  prompt: string;
}