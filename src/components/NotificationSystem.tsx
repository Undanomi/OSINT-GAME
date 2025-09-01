'use client';

import React, { useEffect, useState } from 'react';
import { useNotificationStore, Notification, SafeActionType } from '@/store/notificationStore';
import { useWindowStore } from '@/store/windowStore';
import { useAppStore } from '@/store/appStore';
import { X, CheckCircle, Info, AlertTriangle, AlertCircle, Bell, BellRing } from 'lucide-react';

/**
 * 個別通知コンポーネントのプロパティ
 */
interface NotificationItemProps {
  notification: Notification;
  onClose: (id: string) => void;
  index: number; // スタッキング位置
}

/**
 * 個別通知コンポーネント
 */
const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClose, index }) => {
  const [isVisible, setIsVisible] = useState(false);
  const { openWindow } = useWindowStore();
  const { getAppById } = useAppStore();

  useEffect(() => {
    // マウント時にアニメーション開始
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // 退場アニメーション（通知センターに移動する場合のみアニメーション）
    if (notification.isExiting && notification.removalType === 'moveToCenter') {
      setIsVisible(false);
    }
  }, [notification.isExiting, notification.removalType]);

  const handleNotificationClick = () => {
    // セーフアクションの処理
    if (notification.safeAction) {
      handleSafeAction(notification.safeAction);
      return;
    }

    // ソースアプリが指定されている場合は、そのアプリを開く
    if (notification.sourceAppId) {
      const app = getAppById(notification.sourceAppId);
      if (app) {
        openWindow({
          id: app.id,
          title: app.name,
          appType: app.id,
          defaultWidth: app.defaultWidth,
          defaultHeight: app.defaultHeight,
        });
      }
    }
  };

  const handleSafeAction = (action: SafeActionType) => {
    switch (action.type) {
      case 'openApp':
        if (action.appId && typeof action.appId === 'string') {
          const app = getAppById(action.appId);
          if (app) {
            openWindow({
              id: app.id,
              title: app.name,
              appType: app.id,
              defaultWidth: app.defaultWidth,
              defaultHeight: app.defaultHeight,
            });
          }
        }
        break;
      case 'openUrl':
        if (action.url && typeof action.url === 'string') {
          // URLの検証
          try {
            const url = new URL(action.url);
            const allowedDomains = action.allowedDomains || ['localhost', '127.0.0.1'];
            if (allowedDomains.includes(url.hostname)) {
              window.open(action.url, '_blank', 'noopener,noreferrer');
            } else {
              console.warn('URL not in allowed domains:', action.url);
            }
          } catch {
            console.error('Invalid URL:', action.url);
          }
        }
        break;
      case 'showDialog':
        if (action.message && typeof action.message === 'string') {
          alert(action.message.slice(0, 200)); // 長さ制限
        }
        break;
      default:
        console.warn('Unknown safe action type:', action.type);
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle size={20} className="text-gray-600" />;
      case 'warning':
        return <AlertTriangle size={20} className="text-gray-600" />;
      case 'error':
        return <AlertCircle size={20} className="text-gray-600" />;
      default:
        return <Info size={20} className="text-gray-600" />;
    }
  };

  return (
    <div
      className={`
        bg-white border-gray-200
        rounded-lg shadow-lg border
        p-4 w-80 h-32
        transform transition-all duration-300 ease-in-out
        hover:shadow-xl cursor-pointer
        ${isVisible && !notification.isExiting
          ? 'translate-x-0 opacity-100 scale-100'
          : 'translate-x-full opacity-0 scale-95'
        }
        ${(notification.sourceAppId || notification.safeAction) ? 'hover:bg-gray-50' : 'cursor-default'}
      `}
      style={{
        // スタッキング効果：少しずつずらして表示
        transform: `translateX(${isVisible && !notification.isExiting ? 0 : '100%'})`,
        zIndex: 1000 - index, // 新しい通知ほど手前に
      }}
      onClick={handleNotificationClick}
    >
      <div className="flex items-start h-full">
        <div className="flex-shrink-0 mr-3 mt-1">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0 flex flex-col h-full justify-between">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900 truncate mb-2">
              {notification.title}
            </h4>
            <p className="text-sm text-gray-700 line-clamp-2 leading-normal">
              {notification.message}
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {notification.timestamp.toLocaleTimeString('ja-JP')}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation(); // 通知クリックイベントの伝播を停止
            onClose(notification.id);
          }}
          className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-white hover:bg-opacity-50"
          aria-label="通知を閉じる"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

/**
 * 通知センターコンポーネント
 */
const NotificationCenter: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { notificationCenter, removeFromCenter, clearNotificationCenter } = useNotificationStore();
  const { openWindow } = useWindowStore();
  const { getAppById } = useAppStore();

  const handleCenterNotificationClick = (notification: Notification) => {
    // セーフアクションの処理
    if (notification.safeAction) {
      handleCenterSafeAction(notification.safeAction);
      return;
    }

    // ソースアプリが指定されている場合は、そのアプリを開く
    if (notification.sourceAppId) {
      const app = getAppById(notification.sourceAppId);
      if (app) {
        openWindow({
          id: app.id,
          title: app.name,
          appType: app.id,
          defaultWidth: app.defaultWidth,
          defaultHeight: app.defaultHeight,
        });
      }
    }
  };

  const handleCenterSafeAction = (action: SafeActionType) => {
    switch (action.type) {
      case 'openApp':
        if (action.appId && typeof action.appId === 'string') {
          const app = getAppById(action.appId);
          if (app) {
            openWindow({
              id: app.id,
              title: app.name,
              appType: app.id,
              defaultWidth: app.defaultWidth,
              defaultHeight: app.defaultHeight,
            });
          }
        }
        break;
      case 'showDialog':
        if (action.message && typeof action.message === 'string') {
          alert(action.message.slice(0, 200));
        }
        break;
      default:
        console.warn('Unknown safe action type:', action.type);
    }
  };

  return (
    <div
      className={`
        fixed inset-y-0 right-0 z-[10000] w-80 bg-white shadow-xl border-l border-gray-200
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}
    >
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Bell className="mr-2" size={20} />
            通知センター
          </h2>
          <div className="flex items-center space-x-2">
            {notificationCenter.length > 0 && (
              <button
                onClick={clearNotificationCenter}
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded"
              >
                すべて削除
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {notificationCenter.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell size={48} className="mx-auto mb-4 text-gray-300" />
              <p>通知はありません</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {notificationCenter.map((notification) => (
                <div
                  key={notification.id}
                  className={`
                    bg-gray-50 rounded-lg p-3 border border-gray-200 transition-colors
                    ${(notification.sourceAppId || notification.safeAction)
                      ? 'hover:bg-gray-100 cursor-pointer'
                      : 'cursor-default'
                    }
                  `}
                  onClick={() => handleCenterNotificationClick(notification)}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      {(() => {
                        switch (notification.type) {
                          case 'success':
                            return <CheckCircle size={16} className="text-gray-600" />;
                          case 'warning':
                            return <AlertTriangle size={16} className="text-gray-600" />;
                          case 'error':
                            return <AlertCircle size={16} className="text-gray-600" />;
                          default:
                            return <Info size={16} className="text-gray-600" />;
                        }
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {notification.title}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1 break-words">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {notification.timestamp.toLocaleString('ja-JP')}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // 通知クリックイベントの伝播を停止
                        removeFromCenter(notification.id);
                      }}
                      className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * 通知システムコンポーネント - デスクトップ右上に通知を表示
 */
export const NotificationSystem: React.FC = () => {
  const { notifications, notificationCenter, removeNotification, clearAllNotifications } = useNotificationStore();
  const [showCenter, setShowCenter] = useState(false);


  return (
    <>
      {/* 通知エリア */}
      {notifications.length > 0 && (
        <div className="notification-area fixed top-4 right-4 z-[9999] flex flex-col justify-start space-y-3 w-80 max-h-[calc(100vh-8rem)] overflow-y-auto">
          {notifications.map((notification, index) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onClose={removeNotification}
              index={index}
            />
          ))}
        </div>
      )}

      {/* 通知センターボタン */}
      <div className="fixed bottom-16 right-4 z-[9999]">
        <button
          onClick={() => setShowCenter(true)}
          className={`
            relative p-3 rounded-full shadow-lg transition-colors
            ${notificationCenter.length > 0
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-gray-600 hover:bg-gray-700 text-white'
            }
          `}
        >
          {notificationCenter.length > 0 ? <BellRing size={20} /> : <Bell size={20} />}
          {notificationCenter.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {notificationCenter.length > 99 ? '99+' : notificationCenter.length}
            </span>
          )}
        </button>
      </div>

      {/* 全クリアボタン（現在の通知が3つ以上ある場合） */}
      {notifications.length >= 3 && (
        <div className="fixed bottom-16 right-20 z-[9999]">
          <button
            onClick={clearAllNotifications}
            className="
              bg-gray-800 text-white text-xs px-3 py-1 rounded-full
              hover:bg-gray-700 transition-colors shadow-lg
            "
          >
            すべてクリア
          </button>
        </div>
      )}

      {/* 通知センター */}
      {showCenter && (
        <div
          className="fixed inset-0 z-[9998]"
          onClick={() => setShowCenter(false)}
        />
      )}
      <NotificationCenter isOpen={showCenter} onClose={() => setShowCenter(false)} />
    </>
  );
};
