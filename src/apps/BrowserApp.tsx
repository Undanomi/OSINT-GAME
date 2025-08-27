import React, { useState } from 'react';
import { BaseApp } from '@/components/BaseApp';
import { AppProps } from '@/types/app';
import { Search, ArrowLeft, ArrowRight, RotateCcw, Home, ExternalLink } from 'lucide-react';

// 各ページコンポーネントのインポート
import { AbcCorpPage } from './pages/AbcCorpPage';
import { LinkedInProfilePage } from './pages/LinkedInProfilePage';
import { GenericPage } from './pages/GenericPage';

/**
 * 検索結果アイテムのデータ構造を定義するインターフェース
 * ブラウザアプリの検索機能で使用される情報を統一管理
 */
interface SearchResult {
  /** 検索結果アイテムの一意識別子 */
  id: string;
  /** ページのタイトル */
  title: string;
  /** ページのURL */
  url: string;
  /** ページの説明文 */
  description: string;
  /** ページの種類（企業サイト、SNS、ニュース、個人サイト、ディレクトリ） */
  type: 'corporate' | 'social' | 'news' | 'personal' | 'directory';
}

/**
 * 検索用のサンプルデータベース
 * OSINT調査ゲーム用に構成されたサンプル情報
 * 企業情報、個人プロフィール、ニュース記事などを含む
 */
const searchDatabase: SearchResult[] = [
  {
    // LinkedInプロフィールサンプル - ソーシャルメディア情報
    id: '1',
    title: '田中太郎 - LinkedInプロフィール',
    url: 'https://linkedin.com/in/taro-tanaka',
    description: 'ABC株式会社のマーケティング部長。東京大学経済学部卒。デジタルマーケティングとブランド戦略の専門家。',
    type: 'social',
  },
  {
    // 企業サイトサンプル - 企業情報調査用
    id: '2',
    title: 'ABC株式会社 - 企業情報',
    url: 'https://abc-corp.co.jp',
    description: '1985年設立のIT企業。従業員数500名。クラウドソリューション、AI、IoTサービスを提供。',
    type: 'corporate',
  },
  {
    // 個人ポートフォリオサンプル - 個人情報調査用
    id: '3',
    title: '佐藤花子のポートフォリオサイト',
    url: 'https://hanako-portfolio.com',
    description: 'フロントエンドエンジニア。React、TypeScript、Next.js専門。ABC株式会社勤務。',
    type: 'personal',
  },
  {
    // ニュース記事サンプル - 企業の最新情報収集用
    id: '4',
    title: 'ABC株式会社、新クラウドサービスを発表 - IT News Today',
    url: 'https://it-news-today.com/abc-cloud-launch',
    description: 'ABC株式会社が企業向けクラウドプラットフォーム「ABC Cloud Pro」をリリース。セキュリティ機能を強化。',
    type: 'news',
  },
  {
    // GitHubプロフィールサンプル - ソーシャルメディア情報
    id: '5',
    title: '鈴木次郎 - GitHub',
    url: 'https://github.com/jiro-suzuki',
    description: 'シニアソフトウェアエンジニア at ABC株式会社。Go、Python、Kubernetesの専門家。',
    type: 'social',
  }
];

/**
 * 特定URLに対応するカスタムページコンポーネントのマッピング
 * 検索結果からクリックされたURLに対して、カスタムページを表示
 * 登録されていないURLはジェネリックページで表示
 */
const pageComponents: { [key: string]: React.ReactElement } = {
  'https://abc-corp.co.jp': <AbcCorpPage />,                    // ABC株式会社の企業ページ
  'https://linkedin.com/in/taro-tanaka': <LinkedInProfilePage />, // 田中太郎のLinkedInプロフィール
};

// ブラウザの表示状態を識別するための定数
const VIEW_HOME = 'view:home';                 // ホームページ（Google風）
const VIEW_SEARCH_RESULTS = 'view:search_results'; // 検索結果ページ

/**
 * ブラウザアプリケーション - OSINT調査ゲーム用のブラウザシミュレータ
 * 検索機能、ナビゲーション履歴、カスタムページ表示機能を実装
 * Google風のインターフェースと検索結果表示を提供
 * 
 * @param windowId - アプリケーションウィンドウの一意識別子
 * @param isActive - アプリケーションがアクティブかどうかのフラグ
 * @returns JSX.Element - ブラウザアプリケーションのレンダリング結果
 */
export const BrowserApp: React.FC<AppProps> = ({ windowId, isActive }) => {
  // 検索クエリの状態管理
  const [searchQuery, setSearchQuery] = useState('');
  // 検索結果の状態管理
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  // 検索中かどうかの状態管理
  const [isSearching, setIsSearching] = useState(false);

  // ブラウザのナビゲーション履歴を管理
  const [history, setHistory] = useState<string[]>([VIEW_HOME]);
  // 履歴内の現在位置を管理
  const [historyIndex, setHistoryIndex] = useState(0);
  // ページリロード機能のためのkey管理
  const [reloadKey, setReloadKey] = useState(0);

  // 現在表示中のビューを取得
  const currentView = history[historyIndex];

  /**
   * 指定されたビューまたはURLにナビゲートする関数
   * ブラウザの履歴機能を再現し、戸る・進む操作に対応
   * 
   * @param viewIdentifier - ナビゲート先のURLまたはビュー識別子
   */
  const navigateTo = (viewIdentifier: string) => {
    // 現在位置から後を切り捨て新しい履歴を作成
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(viewIdentifier);

    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  /**
   * 検索処理を実行する関数
   * サンプルデータベースからキーワードにマッチする結果を検索
   * リアルな検索体験のために意図的な遅延を設定
   */
  const performSearch = () => {
    if (!searchQuery.trim()) return; // 空の検索クエリは無視

    setIsSearching(true); // 検索中状態を表示

    // 0.8秒の遅延でリアルな検索体験をシミュレート
    setTimeout(() => {
      const query = searchQuery.toLowerCase();
      // タイトルと説明文から部分一致検索を実行
      const results = searchDatabase.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );

      setSearchResults(results);
      setIsSearching(false);
      navigateTo(VIEW_SEARCH_RESULTS); // 検索結果ページに遷移
    }, 800);
  };

  /**
   * 検索結果アイテムのクリック処理
   * @param targetUrl - クリックされたアイテムのURL
   */
  const handleResultClick = (targetUrl: string) => {
    navigateTo(targetUrl);
  };

  /**
   * 検索入力フィールドのEnterキーイベント処理
   * Enterキーで検索を実行
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  /**
   * ブラウザの「戸る」ボタンの処理
   * 履歴の前のページに戻る
   */
  const handleBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  /**
   * ブラウザの「進む」ボタンの処理
   * 履歴の次のページに進む
   */
  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  /**
   * ページリロード処理
   * Reactのkey属性を変更してコンポーネントを再レンダリング
   */
  const handleReload = () => {
    setReloadKey(prev => prev + 1);
  };

  /**
   * ホームページに戻る処理
   */
  const goHome = () => {
    navigateTo(VIEW_HOME);
  };

  /**
   * アドレスバーに表示するURLを生成する関数
   * 各ビューに応じて適切なURLを返す
   * 
   * @returns string - 表示するURL文字列
   */
  const getDisplayUrl = () => {
    if (currentView === VIEW_HOME) return 'https://www.google.com';
    if (currentView === VIEW_SEARCH_RESULTS) return `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
    return currentView;
  };

  /**
   * 検索結果のタイプに応じたアイコンを返す関数
   * 各タイプのページを視觚的に区別するための絵文字
   * 
   * @param type - 検索結果アイテムのタイプ
   * @returns string - 対応する絵文字
   */
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'corporate': return '🏢'; // 企業サイト
      case 'social': return '👤';     // ソーシャルメディア
      case 'news': return '📰';        // ニュース記事
      case 'personal': return '🌐';   // 個人サイト
      case 'directory': return '📋';  // ディレクトリ
      default: return '🔍';           // デフォルト（検索）
    }
  };

  /**
   * ブラウザのツールバーコンポーネント
   * ナビゲーションボタン、アドレスバー、検索フィールドを含む
   */
  const toolbar = (
    <div className="p-3 space-y-2">
      {/* ナビゲーションボタンとアドレスバー */}
      <div className="flex items-center space-x-2">
        {/* 戻るボタン */}
        <button 
          onClick={handleBack} 
          disabled={historyIndex === 0} 
          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30" 
          title="戻る"
        >
          <ArrowLeft size={16} />
        </button>
        
        {/* 進むボタン */}
        <button 
          onClick={handleForward} 
          disabled={historyIndex >= history.length - 1} 
          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30" 
          title="進む"
        >
          <ArrowRight size={16} />
        </button>
        
        {/* 更新ボタン */}
        <button 
          onClick={handleReload} 
          className="p-1 hover:bg-gray-200 rounded" 
          title="更新"
        >
          <RotateCcw size={16} />
        </button>
        
        {/* ホームボタン */}
        <button 
          onClick={goHome} 
          className="p-1 hover:bg-gray-200 rounded" 
          title="ホーム"
        >
          <Home size={16} />
        </button>

        {/* アドレスバー（読み取り専用） */}
        <div className="flex-1 bg-white border rounded-md flex items-center px-3 py-1">
          <input
            type="text"
            value={getDisplayUrl()}
            readOnly
            className="flex-1 outline-none text-sm bg-gray-100"
          />
        </div>
      </div>

      {/* 検索フィールドとボタン */}
      <div className="flex items-center space-x-2">
        <Search size={16} className="text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 bg-white border rounded-md px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="検索キーワードを入力"
        />
        <button
          className="px-4 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
          onClick={performSearch}
          disabled={isSearching || !searchQuery.trim()}
        >
          {isSearching ? '検索中...' : '検索'}
        </button>
      </div>
    </div>
  );

  // ステータスバーのテキスト
  const statusBar = `準備完了`;

  /**
   * 現在のビューに応じてコンテンツをレンダリングする関数
   * ホーム、検索結果、カスタムページの表示を制御
   * 
   * @returns JSX.Element - 表示するコンテンツ
   */
  const renderContent = () => {
    // 1. ホーム画面（Google風の空白ページ）
    if (currentView === VIEW_HOME) {
      return (
        <div className="h-full flex items-center justify-center">
          {/* 意図的に空白 - Google風のシンプルなホーム */}
        </div>
      );
    }

    // 2. 検索結果画面
    if (currentView === VIEW_SEARCH_RESULTS) {
      return (
        <div className="p-4">
          {/* 検索結果の統計情報 */}
          <div className="mb-4 pb-3 border-b">
            <p className="text-sm text-gray-600">約 {searchResults.length} 件の結果 (0.3秒)</p>
          </div>
          
          {isSearching ? (
            // 検索中のローディング表示
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-600">検索中...</p>
              </div>
            </div>
          ) : searchResults.length === 0 ? (
            // 検索結果なしの場合
            <div className="text-center py-12">
              <p className="text-gray-600">検索結果が見つかりませんでした</p>
              <p className="text-sm text-gray-500 mt-2">別のキーワードで試してみてください</p>
            </div>
          ) : (
            // 検索結果一覧の表示
            <div className="space-y-6">
              {searchResults.map((result) => (
                <div key={result.id} className="border-b pb-4">
                  <div className="flex items-start space-x-3">
                    {/* サイトタイプアイコン */}
                    <span className="text-lg">{getTypeIcon(result.type)}</span>
                    <div className="flex-1">
                      {/* タイトルとリンク */}
                      <div className="flex items-center space-x-2 mb-1">
                        <h3
                          className="text-lg text-blue-600 hover:underline cursor-pointer font-medium"
                          onClick={() => handleResultClick(result.url)}
                        >
                          {result.title}
                        </h3>
                        <ExternalLink size={14} className="text-gray-400" />
                      </div>
                      {/* URL表示 */}
                      <p className="text-green-700 text-sm mb-2">{result.url}</p>
                      {/* 説明文 */}
                      <p className="text-gray-700 text-sm leading-relaxed mb-3">
                        {result.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 3. カスタムページまたはジェネリックページの表示
    return pageComponents[currentView] || <GenericPage url={currentView} />;
  };

  return (
    <BaseApp windowId={windowId} isActive={isActive} toolbar={toolbar} statusBar={statusBar}>
      <div key={reloadKey} className="h-full bg-white overflow-auto">
        {renderContent()}
      </div>
    </BaseApp>
  );
};