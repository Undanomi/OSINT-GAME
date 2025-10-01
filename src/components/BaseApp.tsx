import React, { ReactNode } from 'react';
import { AppProps } from '@/types/app';

/**
 * ベースアプリケーションコンポーネントのプロパティ型定義
 * すべてのアプリケーションで共通して使用される基本的なプロパティとレイアウト要素を定義
 */
interface BaseAppProps extends AppProps {
  /** アプリケーションのメインコンテンツ */
  children: ReactNode;
  /** オプションのツールバー（アプリ上部に表示されるナビゲーションやコントロール） */
  toolbar?: ReactNode;
  /** オプションのステータスバー（アプリ下部に表示される状態情報） */
  statusBar?: ReactNode;
}

/**
 * ベースアプリケーションコンポーネント - すべてのアプリケーションの共通レイアウト基盤
 * 統一されたアプリケーション構造を提供し、ツールバー、メインコンテンツ、ステータスバーの配置を管理
 * 各アプリケーション（ブラウザ、SNS、メッセンジャーなど）で再利用される共通のUIフレームワーク
 *
 * レイアウト構造:
 * - ツールバー（オプション）: アプリの操作パネルや検索バーなど
 * - メインコンテンツエリア: 実際のアプリケーション機能
 * - ステータスバー（オプション）: 現在の状態や操作結果の表示
 *
 * @param children - メインコンテンツエリアに表示する内容
 * @param toolbar - 上部に表示するツールバー（オプション）
 * @param statusBar - 下部に表示するステータスバー（オプション）
 * @param isActive - アプリケーションがアクティブかどうか（現在未使用）
 * @param windowId - ウィンドウの一意識別子（現在未使用）
 * @returns JSX.Element - 構造化されたアプリケーションレイアウト
 */
export const BaseApp: React.FC<BaseAppProps> = ({
  children,
  toolbar,
  // isActive,     // 将来的な機能拡張のため保持（現在は未使用）
  // windowId      // 将来的な機能拡張のため保持（現在は未使用）
}) => {
  return (
    <div className="h-full flex flex-col">
      {/* ツールバーエリア - 提供された場合のみ表示 */}
      {toolbar && (
        <div className="border-b border-gray-200 bg-gray-50">
          {toolbar}
        </div>
      )}

      {/* メインコンテンツエリア - アプリケーションの主要機能が表示される */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};