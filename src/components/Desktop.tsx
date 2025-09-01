'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useWindowStore } from '@/store/windowStore';
import { useAppStore, AppMetadata } from '@/store/appStore';
import { initializeAppRegistry } from '@/config/appRegistry';
import { initializeMessengerIntroduction } from '@/services/messengerInitialization';
import { Package, Settings, RefreshCw, Info } from 'lucide-react';

/**
 * デスクトップアイコンコンポーネントのプロパティ型定義
 * 個々のアプリケーションアイコンの表示と動作を制御
 */
interface DesktopIconProps {
  /** 表示するアプリケーションのメタデータ */
  app: AppMetadata;
  /** アイコンがクリックされた時の処理関数 */
  onClick: () => void;
}

/**
 * デスクトップアイコンコンポーネント - 単一アプリケーションのデスクトップ表示
 * デスクトップ上に配置されるアプリケーションアイコンを描画し、クリック処理を提供
 * macOS/WindowsのデスクトップアイコンUIパターンをシミュレート
 *
 * 主な機能:
 * - アプリケーションアイコンとラベルの表示
 * - ホバー効果による視覚フィードバック
 * - シングルクリックとダブルクリックでのアプリ起動
 * - 透明度効果を活用したモダンなUI
 *
 * @param app - 表示するアプリケーションのメタデータ
 * @param onClick - アイコンクリック時に実行される処理関数
 * @returns JSX.Element - デスクトップアイコンのレンダリング結果
 */
const DesktopIcon: React.FC<DesktopIconProps> = ({ app, onClick }) => {
  // アプリメタデータからアイコンコンポーネントを取得
  const Icon = app.icon;

  return (
    /* アイコン全体のコンテナ - 縦方向レイアウトとホバー効果 */
    <div
      className="flex flex-col items-center cursor-pointer p-2 rounded-lg hover:bg-white/20 transition-colors group"
      onClick={onClick}
      onDoubleClick={onClick}
    >
      {/* アイコン画像のコンテナ - 固定サイズとホバー時の背景変化 */}
      <div className="w-16 h-16 flex items-center justify-center bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
        <Icon size={32} className="text-white" />
      </div>
      {/* アプリケーション名ラベル */}
      <span className="text-white text-sm mt-2 text-center leading-tight">
        {app.name}
      </span>
    </div>
  );
};

/**
 * コンテキストメニューコンポーネントのプロパティ型定義
 * 右クリック時に表示されるデスクトップメニューの設定と制御
 */
interface ContextMenuProps {
  /** メニューのX座標（画面座標系） */
  x: number;
  /** メニューのY座標（画面座標系） */
  y: number;
  /** メニューを閉じる処理関数 */
  onClose: () => void;
  /** アプリストアを開く処理関数 */
  onOpenAppStore: () => void;
}

/**
 * コンテキストメニューコンポーネント - デスクトップ右クリックメニュー
 * デスクトップ上での右クリック時に表示されるコンテキストメニューを実装
 * Windows/macOSのデスクトップコンテキストメニューの機能をシミュレート
 *
 * 主な機能:
 * - 右クリック位置への動的メニュー表示
 * - アプリストアへのクイックアクセス
 * - デスクトップ管理機能（更新、設定等）
 * - クリックアウトサイド検知によるメニュー自動クローズ
 *
 * @param x - メニューの表示X座標
 * @param y - メニューの表示Y座標
 * @param onClose - メニューを閉じる処理関数
 * @param onOpenAppStore - アプリストアを開く処理関数
 * @returns JSX.Element - コンテキストメニューのレンダリング結果
 */
const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose, onOpenAppStore }) => {
  // メニュー要素への参照（クリックアウトサイド検知用）
  const menuRef = useRef<HTMLDivElement>(null);

  /**
   * メニュー外クリック検知とメニュー自動クローズ処理
   * ドキュメント全体にイベントリスナーを設定し、メニュー外クリックでクローズ
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    /* メインのメニューコンテナ - 固定位置とドロップシャドウ */
    <div
      ref={menuRef}
      className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[200px] z-50"
      style={{ left: x, top: y }}
    >
      {/* アプリストアを開くボタン */}
      <button
        onClick={() => {
          onOpenAppStore();
          onClose();
        }}
        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
      >
        <Package size={16} />
        <span>アプリストアを開く</span>
      </button>
      {/* デスクトップ更新ボタン（現在は見た目のみ） */}
      <button
        onClick={onClose}
        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
      >
        <RefreshCw size={16} />
        <span>デスクトップを更新</span>
      </button>
      {/* メニュー区切り線 */}
      <hr className="my-1" />
      {/* デスクトップ設定ボタン（現在は見た目のみ） */}
      <button
        onClick={onClose}
        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
      >
        <Settings size={16} />
        <span>デスクトップ設定</span>
      </button>
      {/* システム情報ボタン（現在は見た目のみ） */}
      <button
        onClick={onClose}
        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
      >
        <Info size={16} />
        <span>システム情報</span>
      </button>
    </div>
  );
};

/**
 * デスクトップコンポーネント - OSINTゲームのメインデスクトップ環境
 * デスクトップ環境の中核を成すコンポーネントで、アプリケーションアイコンの表示、
 * アプリの起動、コンテキストメニュー、デスクトップの背景とレイアウトを管理
 *
 * 主な機能:
 * - インストール済みアプリケーションのアイコン表示
 * - アプリケーション起動とウィンドウ管理
 * - 使用頻度とシステムアプリを考慮したアイコンソート
 * - 右クリックコンテキストメニュー
 * - アプリレジストリの初期化と管理
 * - デスクトップ背景とグラデーション効果
 *
 * @returns JSX.Element - デスクトップ環境のレンダリング結果
 */
export const Desktop: React.FC = () => {
  // ウィンドウストアからウィンドウ開く機能を取得
  const openWindow = useWindowStore(state => state.openWindow);
  // アプリストアから各種機能とデータを取得
  const { updateUsage } = useAppStore();
  const installedApps = useAppStore(state => state.installedApps);
  // コンテキストメニューの表示状態と位置
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  // アプリレジストリの初期化完了フラグ
  const [initialized, setInitialized] = useState(false);
  // コンポーネントのマウント状態フラグ
  const [mounted, setMounted] = useState(false);

  /**
   * コンポーネントマウント状態の管理
   * SSR対応のため、クライアントサイドでのマウント状態を追跡
   */
  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * アプリレジストリの初期化処理
   * マウント完了後にアプリレジストリからシステムアプリと利用可能アプリを読み込み
   * Zustandストアに一括でセットして初期化完了状態にする
   */
  useEffect(() => {
    if (mounted && !initialized) {
      // アプリレジストリから初期データを取得
      const { installedApps: systemApps, availableApps: availableAppsConfig } = initializeAppRegistry();

      // アプリストアを一度に更新（パフォーマンス最適化）
      useAppStore.setState(() => ({
        installedApps: [...systemApps],
        availableApps: [...availableAppsConfig]
      }));

      setInitialized(true);
    }
  }, [mounted, initialized]);

  /**
   * メッセンジャーのクライアントサイド初期化処理
   * デスクトップが表示されたらメッセンジャーのイントロダクションをクライアントサイドで実行
   */
  useEffect(() => {
    if (initialized) {
      // デスクトップ初期化完了後、メッセンジャーの初期化を実行
      initializeMessengerIntroduction({
        delay: 3000, // 3秒後にイントロダクションメッセージを送信
        sendNotification: true,
        notificationDuration: 5000
      })
        .then((wasInitialized) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('Messenger initialization result:', wasInitialized ? 'initialized' : 'already initialized');
          }
        })
        .catch((error) => {
          if (process.env.NODE_ENV === 'development') {
            console.error('Messenger initialization failed:', error);
          }
        });
    }
  }, [initialized]);

  /**
   * デスクトップに表示するアプリケーションのリスト生成と並べ替え
   * システムアプリを優先し、その後は使用頻度順でソート
   * useMemoでストアの状態が変更された時のみ再計算してパフォーマンス最適化
   */
  const displayedApps = useMemo(() => {
    return installedApps;
  }, [installedApps]);

  /**
   * アプリケーションアイコンクリック時の処理
   * アプリの使用統計を更新し、新しいウィンドウを開く
   *
   * @param app - 起動するアプリケーションのメタデータ
   */
  const handleAppClick = (app: AppMetadata) => {
    // アプリの使用回数を増加（統計データ更新）
    updateUsage(app.id);

    // ウィンドウマネージャーに新しいウィンドウを作成依頼
    openWindow({
      id: app.id,
      title: app.name,
      appType: app.id,
      defaultWidth: app.defaultWidth,
      defaultHeight: app.defaultHeight,
    });
  };

  /**
   * デスクトップ右クリック時のコンテキストメニュー表示処理
   * デフォルトの右クリックメニューをキャンセルし、カスタムメニューを表示
   *
   * @param e - マウスイベント（右クリック）
   */
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault(); // ブラウザのデフォルト右クリックメニューを無効化
    setContextMenu({ x: e.clientX, y: e.clientY }); // クリック位置にメニューを表示
  };

  /**
   * コンテキストメニューからアプリストアを開く処理
   * displayedAppsからアプリストアアプリを検索し、起動する
   */
  const handleOpenAppStore = () => {
    const appStoreApp = displayedApps.find((app: AppMetadata) => app.id === 'app-store');
    if (appStoreApp) {
      handleAppClick(appStoreApp);
    }
  };

  return (
    /* デスクトップのメインコンテナ - グラデーション背景とドット模様 */
    <div
      className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-700 relative"
      style={{
        // SVGベースの微細なドット模様をオーバーレイとして配置
        backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
      }}
      onContextMenu={handleContextMenu} // 右クリックでコンテキストメニュー表示
      onClick={() => setContextMenu(null)} // 左クリックでメニュー非表示
    >
      {/* アプリケーションアイコン配置エリア */}
      <div className="absolute top-8 left-8">
        <div className="grid grid-cols-1 gap-4">
          {displayedApps.map((app: AppMetadata) => (
            <DesktopIcon
              key={app.id}
              app={app}
              onClick={() => handleAppClick(app)}
            />
          ))}
        </div>
      </div>

      {/* コンテキストメニュー（表示条件付き） */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onOpenAppStore={handleOpenAppStore}
        />
      )}
    </div>
  );
};