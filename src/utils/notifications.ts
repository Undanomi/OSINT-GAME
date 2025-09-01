import { useNotificationStore, SafeActionType } from '@/store/notificationStore';

/**
 * 通知を簡単に表示するためのヘルパー関数群
 */
export const showNotification = {
  success: (title: string, message: string, duration: number = 5000, sourceAppId?: string) => {
    return useNotificationStore.getState().addNotification({
      title: sanitizeString(title),
      message: sanitizeString(message),
      type: 'success',
      duration: Math.max(0, Math.min(duration, 30000)), // 0-30秒に制限
      sourceAppId: sourceAppId ? sanitizeString(sourceAppId) : undefined
    });
  },

  error: (title: string, message: string, duration: number = 5000, sourceAppId?: string) => {
    return useNotificationStore.getState().addNotification({
      title: sanitizeString(title),
      message: sanitizeString(message),
      type: 'error',
      duration: Math.max(0, Math.min(duration, 30000)),
      sourceAppId: sourceAppId ? sanitizeString(sourceAppId) : undefined
    });
  },

  warning: (title: string, message: string, duration?: number, sourceAppId?: string) => {
    return useNotificationStore.getState().addNotification({
      title: sanitizeString(title),
      message: sanitizeString(message),
      type: 'warning',
      duration: duration ? Math.max(0, Math.min(duration, 30000)) : undefined,
      sourceAppId: sourceAppId ? sanitizeString(sourceAppId) : undefined
    });
  },

  info: (title: string, message: string, duration: number = 5000, sourceAppId?: string) => {
    return useNotificationStore.getState().addNotification({
      title: sanitizeString(title),
      message: sanitizeString(message),
      type: 'info',
      duration: Math.max(0, Math.min(duration, 30000)),
      sourceAppId: sourceAppId ? sanitizeString(sourceAppId) : undefined
    });
  }
};

/**
 * アプリケーション固有の通知ヘルパー
 */
export const appNotifications = {
  fromApp: (appId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', duration: number = 5000) => {
    return useNotificationStore.getState().addNotification({
      title: sanitizeString(title),
      message: sanitizeString(message),
      type,
      duration: Math.max(0, Math.min(duration, 30000)),
      sourceAppId: sanitizeString(appId)
    });
  },

  // セキュアなアクション付き通知
  withAction: (title: string, message: string, safeAction: SafeActionType, type: 'info' | 'success' | 'warning' | 'error' = 'info', duration: number = 5000) => {
    return useNotificationStore.getState().addNotification({
      title: sanitizeString(title),
      message: sanitizeString(message),
      type,
      duration: Math.max(0, Math.min(duration, 30000)),
      safeAction
    });
  }
};

/**
 * 文字列のサニタイゼーション
 */
function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return String(input).slice(0, 100);
  }

  // HTMLタグを除去
  const withoutTags = input.replace(/<[^>]*>/g, '');

  // 特殊文字をエスケープ
  const escaped = withoutTags
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  return escaped.slice(0, 100); // 長さ制限
}

/**
 * セキュアなアクションヘルパー
 */
export const secureActions = {
  openApp: (appId: string): SafeActionType => ({
    type: 'openApp',
    appId: sanitizeString(appId)
  }),

  showDialog: (message: string): SafeActionType => ({
    type: 'showDialog',
    message: sanitizeString(message)
  })
};
