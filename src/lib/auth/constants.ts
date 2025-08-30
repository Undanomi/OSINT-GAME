// 認証関連の定数定義

// 認証トークン設定
export const AUTH_TOKEN = {
  COOKIE_NAME: 'firebase-auth-token',
  MAX_AGE_SECONDS: 3600,           // 1時間
  REFRESH_INTERVAL_MS: 55 * 60 * 1000, // 55分
} as const;