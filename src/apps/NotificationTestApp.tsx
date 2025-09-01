'use client';

import React, { useState } from 'react';
import { BaseApp } from '@/components/BaseApp';
import { AppProps } from '@/types/app';
import { showNotification } from '@/utils/notifications';
import { useNotificationStore } from '@/store/notificationStore';
import { Bell, Play, Pause, Trash2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export const NotificationTestApp: React.FC<AppProps> = ({ windowId, isActive }) => {
  const [isAutoTesting, setIsAutoTesting] = useState(false);
  const [autoTestInterval, setAutoTestInterval] = useState<NodeJS.Timeout | null>(null);
  const { notifications, clearAllNotifications } = useNotificationStore();

  // 個別通知テスト関数
  const testSingleNotifications = () => {
    showNotification.success('成功通知テスト', 'これは成功を示す通知です');
    setTimeout(() => {
      showNotification.error('エラー通知テスト', 'これはエラーを示す通知です');
    }, 500);
    setTimeout(() => {
      showNotification.warning('警告通知テスト', 'これは警告を示す通知です');
    }, 1000);
    setTimeout(() => {
      showNotification.info('情報通知テスト', 'これは情報を示す通知です');
    }, 1500);
  };

  // 重複通知テスト
  const testDuplicateNotifications = () => {
    const title = '重複テスト';
    const message = '同じ内容の通知です';

    // 同じ通知を3回送信（重複防止機能により1つだけ表示されるはず）
    showNotification.info(title, message);
    showNotification.info(title, message);
    showNotification.info(title, message);

    // 少し違う内容の通知
    setTimeout(() => {
      showNotification.info(title, message + ' - 追加情報');
    }, 500);
  };

  // 大量通知テスト（最大表示数テスト）
  const testMassNotifications = () => {
    for (let i = 1; i <= 8; i++) {
      setTimeout(() => {
        showNotification.info(
          `通知 ${i}`,
          `これは${i}番目の通知です。最大5つまで表示されます。`,
          10000 // 長めの表示時間
        );
      }, i * 200);
    }
  };

  // 自動テスト開始/停止
  const toggleAutoTest = () => {
    if (isAutoTesting) {
      if (autoTestInterval) {
        clearInterval(autoTestInterval);
        setAutoTestInterval(null);
      }
      setIsAutoTesting(false);
    } else {
      const interval = setInterval(() => {
        const randomTypes = ['success', 'error', 'warning', 'info'] as const;
        const randomType = randomTypes[Math.floor(Math.random() * randomTypes.length)];
        const timestamp = new Date().toLocaleTimeString();

        showNotification[randomType](
          `自動テスト ${timestamp}`,
          `ランダムな${randomType}通知です。${Math.floor(Math.random() * 1000)}`,
          3000
        );
      }, 2000);

      setAutoTestInterval(interval);
      setIsAutoTesting(true);
    }
  };

  // 長時間表示通知テスト
  const testPersistentNotification = () => {
    showNotification.warning(
      '重要な通知',
      'この通知は手動で閉じるまで表示され続けます。',
      undefined // 自動削除なし
    );
  };

  // 短時間表示通知テスト
  const testShortNotification = () => {
    showNotification.info(
      '短時間通知',
      'この通知は1秒で消えます',
      1000
    );
  };

  return (
    <BaseApp
      windowId={windowId}
      isActive={isActive}
    >
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
            <Bell className="mr-2" />
            通知システムテスト
          </h1>
          <p className="text-gray-600">
            現在の通知数: <span className="font-semibold">{notifications.length}</span> / 5
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 基本テスト */}
          <div className="bg-white rounded-lg border p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Info className="mr-2 text-blue-500" />
              基本テスト
            </h2>
            <div className="space-y-3">
              <button
                onClick={testSingleNotifications}
                className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                4種類の通知テスト
              </button>
              <button
                onClick={testDuplicateNotifications}
                className="w-full p-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                重複防止テスト
              </button>
              <button
                onClick={testMassNotifications}
                className="w-full p-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                大量通知テスト (8個)
              </button>
            </div>
          </div>

          {/* 時間テスト */}
          <div className="bg-white rounded-lg border p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <AlertTriangle className="mr-2 text-yellow-500" />
              表示時間テスト
            </h2>
            <div className="space-y-3">
              <button
                onClick={testShortNotification}
                className="w-full p-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              >
                短時間表示 (1秒)
              </button>
              <button
                onClick={testPersistentNotification}
                className="w-full p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                永続表示テスト
              </button>
            </div>
          </div>

          {/* 自動テスト・制御 */}
          <div className="bg-white rounded-lg border p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <AlertCircle className="mr-2 text-gray-500" />
              制御・自動テスト
            </h2>
            <div className="space-y-3">
              <button
                onClick={toggleAutoTest}
                className={`w-full p-3 rounded-lg transition-colors flex items-center justify-center ${
                  isAutoTesting
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-gray-500 hover:bg-gray-600 text-white'
                }`}
              >
                {isAutoTesting ? (
                  <>
                    <Pause className="mr-2" size={16} />
                    自動テスト停止
                  </>
                ) : (
                  <>
                    <Play className="mr-2" size={16} />
                    自動テスト開始
                  </>
                )}
              </button>
              <button
                onClick={clearAllNotifications}
                className="w-full p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
              >
                <Trash2 className="mr-2" size={16} />
                全ての通知をクリア
              </button>
            </div>
          </div>
        </div>

        {/* 現在の通知一覧 */}
        {notifications.length > 0 && (
          <div className="mt-6 bg-gray-50 rounded-lg border p-4">
            <h3 className="font-semibold mb-3">現在の通知一覧</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="text-sm bg-white p-2 rounded border flex justify-between items-center"
                >
                  <div>
                    <span className={`
                      inline-block w-2 h-2 rounded-full mr-2
                      ${notification.type === 'success' ? 'bg-green-500' : ''}
                      ${notification.type === 'error' ? 'bg-red-500' : ''}
                      ${notification.type === 'warning' ? 'bg-yellow-500' : ''}
                      ${notification.type === 'info' ? 'bg-blue-500' : ''}
                    `} />
                    <strong>{notification.title}</strong>: {notification.message}
                  </div>
                  <div className="text-xs text-gray-500">
                    {notification.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 使用方法 */}
        <div className="mt-6 bg-blue-50 rounded-lg border border-blue-200 p-4">
          <h3 className="font-semibold text-blue-800 mb-2">使用方法</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• 各ボタンをクリックして通知の動作を確認できます</p>
            <p>• 画面右上に通知が表示されます</p>
            <p>• 重複通知は自動的に防止されます</p>
            <p>• 最大5つまで表示され、それを超えると古いものが削除されます</p>
            <p>• 自動テストで連続的な通知動作を確認できます</p>
          </div>
        </div>
      </div>
    </BaseApp>
  );
};
