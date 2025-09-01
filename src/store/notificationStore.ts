import { create } from 'zustand';

/**
 * 許可されたアクションタイプ
 */
export type SafeActionType =
  | { type: 'openApp'; appId: string }
  | { type: 'openUrl'; url: string; allowedDomains?: string[] }
  | { type: 'showDialog'; message: string }
  | { type: 'custom'; actionId: string; payload?: Record<string, unknown> };

/**
 * 通知の状態を表すインターフェース
 */
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number; // 表示時間（ミリ秒）、undefinedの場合は手動で閉じるまで表示
  timestamp: Date;
  isVisible: boolean;
  isExiting?: boolean; // 退場アニメーション中かどうか
  isInCenter?: boolean; // 通知センターに移動済みかどうか
  removalType?: 'manual' | 'overflow' | 'moveToCenter'; // 削除の種類
  sourceAppId?: string; // 通知を出したアプリケーションのID
  safeAction?: SafeActionType; // セーフなアクション
}

/**
 * 通知の状態管理インターフェース
 */
interface NotificationStore {
  notifications: Notification[];
  notificationCenter: Notification[]; // 通知センターの通知
  maxNotifications: number; // 最大表示数
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isVisible' | 'isExiting' | 'isInCenter'>) => string;
  removeNotification: (id: string) => void;
  moveToCenter: (id: string) => void; // 通知センターに移動
  removeFromCenter: (id: string) => void; // 通知センターから削除
  clearAllNotifications: () => void;
  clearNotificationCenter: () => void; // 通知センター全削除
  isDuplicateNotification: (title: string, message: string) => boolean;
}

/**
 * 通知の状態管理ストア
 */
export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  notificationCenter: [],
  maxNotifications: 5, // 最大5つまで表示

  // 重複チェック関数
  isDuplicateNotification: (title: string, message: string) => {
    const { notifications } = get();
    return notifications.some(
      notification =>
        notification.title === title &&
        notification.message === message &&
        notification.isVisible &&
        !notification.isExiting &&
        !notification.isInCenter
    );
  },

  // 通知を追加
  addNotification: (notificationData) => {
    const { maxNotifications, isDuplicateNotification } = get();

    // 重複チェック
    if (isDuplicateNotification(notificationData.title, notificationData.message)) {
      console.log('Duplicate notification prevented:', notificationData.title);
      return ''; // 重複の場合は空文字を返す
    }

    // 入力サニタイゼーション
    const sanitizedTitle = notificationData.title.slice(0, 100); // 長さ制限
    const sanitizedMessage = notificationData.message.slice(0, 500); // 長さ制限

    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const notification: Notification = {
      ...notificationData,
      title: sanitizedTitle,
      message: sanitizedMessage,
      id,
      timestamp: new Date(),
      isVisible: true,
      isExiting: false,
      isInCenter: false,
    };

    set(state => {
      let updatedNotifications = [...state.notifications, notification];

      // 最大表示数を超えた場合、古い通知を通知センターに即座に移動
      if (updatedNotifications.length > maxNotifications) {
        const excessCount = updatedNotifications.length - maxNotifications;
        const toMove = updatedNotifications.slice(0, excessCount);
        updatedNotifications = updatedNotifications.slice(excessCount);

        // 超過分を通知センターに即座に移動
        const newCenterNotifications = toMove.map(n => ({
          ...n,
          isInCenter: true,
          isVisible: false,
          isExiting: false,
          removalType: 'overflow' as const
        }));

        return {
          notifications: updatedNotifications,
          notificationCenter: [...newCenterNotifications, ...state.notificationCenter]
        };
      }

      return {
        notifications: updatedNotifications
      };
    });

    // 自動で通知センターに移動するタイマーを設定（durationが指定されている場合）
    if (notification.duration) {
      setTimeout(() => {
        get().moveToCenter(id);
      }, notification.duration);
    }

    return id;
  },

  // 通知センターに移動
  moveToCenter: (id) => {
    set(state => {
      const notification = state.notifications.find(n => n.id === id);
      if (!notification) return state;

      // まず退場アニメーションをトリガー
      const updatedNotifications = state.notifications.map(n =>
        n.id === id ? { ...n, isExiting: true, removalType: 'moveToCenter' as const } : n
      );

      return { notifications: updatedNotifications };
    });

    // アニメーション後に通知センターに移動
    setTimeout(() => {
      set(state => {
        const notification = state.notifications.find(n => n.id === id);
        if (!notification) return state;

        const centerNotification = {
          ...notification,
          isInCenter: true,
          isExiting: false,
          isVisible: false,
          removalType: 'moveToCenter' as const
        };

        return {
          notifications: state.notifications.filter(n => n.id !== id),
          notificationCenter: [centerNotification, ...state.notificationCenter]
        };
      });
    }, 300); // アニメーション時間に合わせる
  },

  // 通知を削除（手動削除は即座に削除）
  removeNotification: (id) => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  },

  // 通知センターから削除
  removeFromCenter: (id) => {
    set(state => ({
      notificationCenter: state.notificationCenter.filter(n => n.id !== id)
    }));
  },

  // 全ての通知をクリア
  clearAllNotifications: () => {
    set({ notifications: [] });
  },

  // 通知センター全削除
  clearNotificationCenter: () => {
    set({ notificationCenter: [] });
  },
}));
