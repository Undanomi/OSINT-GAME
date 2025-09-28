import { LOCAL_STORAGE_KEYS } from '@/types/localStorage';

/**
 * SNSアプリケーション関連の定数定義
 * ページネーション設定、キャッシュ設定、制限値など
 */


// ページネーション関連
export const SOCIAL_POSTS_PER_PAGE = 15;
export const SOCIAL_MESSAGES_PER_PAGE = 20;

// 投稿関連の制限
export const MAX_POST_LENGTH = 280;
export const MAX_MESSAGE_LENGTH = 500;

// レート制限関連
export const SOCIAL_RATE_LIMIT_PER_MINUTE = 10;
export const SOCIAL_RATE_LIMIT_WINDOW_MS = 60 * 1000;

// AI会話履歴の制限設定
export const MAX_SOCIAL_CONVERSATION_HISTORY_LENGTH = 20;
export const MAX_SOCIAL_CONVERSATION_HISTORY_SIZE = 50000;

// AI応答リトライ設定
export const MAX_SOCIAL_AI_RETRY_ATTEMPTS = 3;

// キャッシュ関連
export const SOCIAL_CACHE_PREFIX = LOCAL_STORAGE_KEYS.SOCIAL_CACHE_PREFIX;
export const SOCIAL_CACHE_EXPIRATION = 60 * 60 * 1000 * 24; // 24時間
export const SOCIAL_CACHE_FRESHNESS_THRESHOLD = 5 * 60 * 1000; // 5分

// 無限スクロール関連
export const SCROLL_THRESHOLD = 50; // スクロール検知のしきい値（px）
export const LOAD_MORE_DEBOUNCE_MS = 300; // 追加読み込みのデバウンス時間

// フォロー・フォロワー関連
export const MAX_FOLLOWING_COUNT = 1000;
export const MAX_FOLLOWERS_COUNT = 10000;

// 検索関連
export const SEARCH_DEBOUNCE_MS = 300;
export const MAX_SEARCH_RESULTS = 50;

// プロフィール関連
export const MAX_BIO_LENGTH = 160;
export const MAX_NAME_LENGTH = 50;
export const MAX_USERNAME_LENGTH = 15;
export const MAX_LOCATION_LENGTH = 30;
export const MAX_COMPANY_LENGTH = 50;
export const MAX_POSITION_LENGTH = 50;
export const MAX_EDUCATION_LENGTH = 50;

// 画像関連（将来の拡張用）
export const MAX_AVATAR_SIZE_MB = 2;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// デフォルトのアバター文字
export const DEFAULT_AVATAR_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// タイムライン更新間隔
export const TIMELINE_REFRESH_INTERVAL_MS = 30 * 1000; // 30秒

// エラー関連
export const ERROR_DISPLAY_DURATION_MS = 5 * 1000; // 5秒

// 警戒度の閾値設定（ゲームオーバー条件）
export const CAUTION_GAME_OVER_THRESHOLD = 100; // 警戒度が100でゲームオーバー