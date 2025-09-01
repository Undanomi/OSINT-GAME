import React, { useState, useEffect, useCallback } from 'react';
import { BaseApp } from '@/components/BaseApp';
import { AppProps } from '@/types/app';
import { Search, ArrowLeft, ArrowRight, RotateCcw, Home, ExternalLink } from 'lucide-react';
import { UnifiedSearchResult } from '@/types/search';
import { getFirebaseDocuments, filterFirebaseResults, SearchResult} from '@/actions/searchResults';

// 各ページコンポーネントのインポート
import { AbcCorpPage } from './pages/AbcCorpPage';
import { FacelookProfilePage } from './pages/FacelookProfilePage';
import { RankedOnProfilePage } from './pages/RankedOnProfilePage';
import { GenericPage } from './pages/GenericPage';
import { ErrorPage } from './pages/ErrorPage';

/**
 * 特定URLに対応するカスタムページコンポーネントのマッピング
 * 検索結果からクリックされたURLに対して、カスタムページを表示
 * 登録されていないURLはジェネリックページで表示
 */
const pageComponents: { [key: string]: React.ReactElement } = {
  'https://abc-corp.co.jp': <AbcCorpPage />,                    // ABC株式会社の企業ページ
  'https://facelook.com/yamada.taro': <FacelookProfilePage documentId="facelook_yamada_taro" />, // 山田太郎のFacelookプロフィール
  'https://facelook.com/sato.hanako': <FacelookProfilePage documentId="facelook_sato_hanako" />, // 佐藤花子のFacelookプロフィール
  'https://facelook.com/test.user': <FacelookProfilePage documentId="facelook_test_user" />, // テストユーザーのFacelookプロフィール
  'https://facelook.com/test.taro': <FacelookProfilePage documentId="facelook_test_taro" />, // テスト太郎のFacelookプロフィール
  'https://facelook.com/test.hanako': <FacelookProfilePage documentId="facelook_test_hanako" />, // テスト花子のFacelookプロフィール
  'https://rankedon.com/on/test-taro': <RankedOnProfilePage documentId="rankedon_test_taro" />, // テスト太郎のRankedOnプロフィール
  'https://rankedon.com/on/test-hanako': <RankedOnProfilePage documentId="rankedon_test_hanako" />, // テスト花子のRankedOnプロフィール
  'https://rankedon.com/on/dummy-jiro': <RankedOnProfilePage documentId="rankedon_dummy_jiro" />, // ダミー次郎のRankedOnプロフィール
};

// ブラウザの表示状態を識別するための定数
const VIEW_HOME = 'view:home';                 // ホームページ
const VIEW_SEARCH_RESULTS = 'view:search_results'; // 検索結果ページ

/**
 * ブラウザアプリケーション - OSINT調査ゲーム用のブラウザシミュレータ
 * 検索機能、ナビゲーション履歴、カスタムページ表示機能を実装
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
  // URLバー入力の状態管理
  const [urlInput, setUrlInput] = useState('');
  
  // Firebase検索結果のキャッシュ
  const [firebaseCache, setFirebaseCache] = useState<UnifiedSearchResult[]>([]);
  // Firebase初回読み込み完了フラグ
  const [isCacheLoaded, setIsCacheLoaded] = useState(false);
  
  // ページネーション関連の状態
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

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
   * ブラウザの履歴機能を再現し、戻る・進む操作に対応
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
   * 初回検索時のみFirebaseからデータを取得し、その後は部分一致で検索
   * キーワードマッチングとページネーション機能を実装
   */
  const performSearch = async () => {
    console.log('performSearch called');
    console.log('searchQuery:', searchQuery);
    
    if (!searchQuery.trim()) {
      console.log('Empty search query, returning');
      return; // 空の検索クエリは無視
    }

    setIsSearching(true); // 検索中状態を表示
    setCurrentPage(1); // 検索時はページを1に戻す

    try {
      // 初回検索時のみFirebaseからデータを取得
      if (!isCacheLoaded) {
        console.log('Loading Firebase search results...');
        const firebaseResults = await getFirebaseDocuments();
        console.log('Loaded Firebase results:', firebaseResults.length);
        setFirebaseCache(firebaseResults);
        setIsCacheLoaded(true);
        
        // 取得したデータで検索を実行
        performSearchOnCache(firebaseResults, searchQuery);
      } else {
        // キャッシュが既にある場合はそれを使用
        performSearchOnCache(firebaseCache, searchQuery);
      }
    } catch (error) {
      console.error('Failed to load Firebase data:', error);
      setIsSearching(false);
    }
  };

  /**
   * キャッシュされたデータに対して部分一致検索を実行する関数
   */
  const performSearchOnCache = async (cache: UnifiedSearchResult[], query: string) => {
    try {
      const filteredResults = await filterFirebaseResults(cache, query);
      
      console.log('検索結果:', filteredResults);
      console.log('検索結果数:', filteredResults.length);
      
      setSearchResults(filteredResults);
      setIsSearching(false);
      navigateTo(VIEW_SEARCH_RESULTS); // 検索結果ページに遷移
    } catch (error) {
      console.error('Failed to filter results:', error);
      setIsSearching(false);
    }
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
   * ブラウザの「戻る」ボタンの処理
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
  const getDisplayUrl = useCallback(() => {
    if (currentView === VIEW_HOME) return 'https://www.goggles.com';
    if (currentView === VIEW_SEARCH_RESULTS) return `https://www.goggles.com/search?q=${encodeURIComponent(searchQuery)}`;
    return currentView;
  }, [currentView, searchQuery]);

  /**
   * URLバーのEnterキー押下時の処理
   * 入力されたURLに直接ナビゲート
   */
  const handleUrlSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && urlInput.trim()) {
      // httpスキームがない場合は追加
      let url = urlInput.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      navigateTo(url);
      setUrlInput(''); // 入力をクリア
    }
  };

  // URLが変更されたときにURLバーを更新
  useEffect(() => {
    setUrlInput(getDisplayUrl());
  }, [getDisplayUrl]);

  /**
   * 検索結果のタイプに応じたアイコンを返す関数
   * 各タイプのページを視覚的に区別するための絵文字
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

        {/* アドレスバー（編集可能） */}
        <div className="flex-1 bg-white border rounded-md flex items-center px-3 py-1">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyUp={handleUrlSubmit}
            onFocus={(e) => e.target.select()}
            className="flex-1 outline-none text-sm"
            placeholder="URLを入力するか、検索キーワードを入力"
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
          onKeyUp={handleKeyPress}
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
   * Firebaseキャッシュから動的にページコンポーネントを取得する関数
   */
  const getDynamicPageComponent = (url: string): React.ReactElement | null => {
    // 1. 静的なページコンポーネントをチェック
    if (pageComponents[url]) {
      return pageComponents[url];
    }

    // 2. Firebaseキャッシュから該当するURLを探す
    const firebaseResult = firebaseCache.find(item => item.url === url);
    if (firebaseResult) {
      // テンプレートに基づいてコンポーネントを動的生成
      // TODO: パフォーマンス最適化 - firebaseResultのデータ全体を各コンポーネントに渡すことで、
      // 各ページコンポーネント内でのFirestoreへの重複リクエストを避けることができる
      // 例: <RankedOnProfilePage documentId={firebaseResult.id} initialData={firebaseResult} />
      switch (firebaseResult.template) {
        case 'FacelookProfilePage':
          return <FacelookProfilePage documentId={firebaseResult.id} />;
        case 'RankedOnProfilePage':
          return <RankedOnProfilePage documentId={firebaseResult.id} />;
        case 'AbcCorpPage':
          return <AbcCorpPage />;
        default:
          return null;
      }
    }

    return null;
  };

  /**
   * 現在のビューに応じてコンテンツをレンダリングする関数
   * ホーム、検索結果、カスタムページの表示を制御
   * 
   * @returns JSX.Element - 表示するコンテンツ
   */
  const renderContent = () => {
    // 1. ホーム画面
    if (currentView === VIEW_HOME) {
      return (
        <div className="h-full flex flex-col items-center justify-center bg-white px-4">
          {/* ロゴ */}
          <div className="text-center mb-8">
            <h1 className="text-6xl font-light text-gray-700 mb-2">
              <span className="text-purple-600">G</span>
              <span className="text-orange-500">o</span>
              <span className="text-cyan-500">g</span>
              <span className="text-pink-500">g</span>
              <span className="text-indigo-500">l</span>
              <span className="text-emerald-500">e</span>
              <span className="text-amber-500">s</span>
            </h1>
          </div>

          {/* 検索バー */}
          <div className="w-full max-w-2xl">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyUp={handleKeyPress}
                className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-full shadow-sm hover:shadow-md focus:shadow-md focus:border-blue-400 focus:outline-none transition-all duration-200"
                placeholder="検索"
                autoFocus
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-3">
                <Search size={20} className="text-gray-400 cursor-pointer hover:text-gray-600" onClick={() => performSearch()} />
              </div>
            </div>

            {/* 検索ボタン */}
            <div className="flex justify-center mt-8 space-x-4">
              <button
                onClick={performSearch}
                disabled={!searchQuery.trim()}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded hover:shadow-sm hover:bg-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Goggles検索
              </button>
              <button
                onClick={() => {
                  // NOTE: ランダムな検索クエリを設定
                  const randomQueries = ['Facelook', 'Rankedon', 'Kilogram', 'Z'];
                  const randomQuery = randomQueries[Math.floor(Math.random() * randomQueries.length)];
                  setSearchQuery(randomQuery);
                }}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded hover:shadow-sm hover:bg-gray-200 transition-all duration-200"
              >
                You&apos;re Feeling Happy?
              </button>
            </div>
          </div>

          {/* フッター情報 */}
          <div className="absolute bottom-8 text-center">
            <p className="text-sm text-gray-500">
              Goggles - あなたの情報検索パートナー
            </p>
          </div>
        </div>
      );
    }

    // 2. 検索結果画面
    if (currentView === VIEW_SEARCH_RESULTS) {
      // ページネーションの計算
      const totalResults = searchResults.length;
      const totalPages = Math.ceil(totalResults / itemsPerPage);
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const currentResults = searchResults.slice(startIndex, endIndex);
      
      return (
        <div className="p-4">
          {/* 検索結果の統計情報 */}
          {totalResults > 0 && (
            <div className="mb-4 pb-3 border-b">
              <p className="text-sm text-gray-600">
                約 {totalResults} 件の結果 (0.3秒) - ページ {currentPage} / {totalPages}
              </p>
            </div>
          )}
          
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
            <>
              {/* 検索結果一覧の表示 */}
              <div className="space-y-6">
                {currentResults.map((result) => (
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

              {/* ページネーション */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-8 pt-4 border-t">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    前へ
                  </button>
                  
                  {/* ページ番号 */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, currentPage - 2) + i;
                    if (pageNum > totalPages) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 text-sm border rounded ${
                          currentPage === pageNum 
                            ? 'bg-blue-600 text-white' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    次へ
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      );
    }

    // 3. カスタムページまたはエラーページの表示（動的対応）
    const dynamicComponent = getDynamicPageComponent(currentView);
    
    // URLの妥当性をチェック
    const isValidUrl = (url: string) => {
      try {
        new URL(url);
        // Firebaseキャッシュに存在するか、静的ページに存在するかチェック
        const exists = firebaseCache.some(item => item.url === url) || !!pageComponents[url];
        return exists;
      } catch {
        return false;
      }
    };
    
    // 動的コンポーネントが見つかった場合はそれを表示
    if (dynamicComponent) {
      return dynamicComponent;
    }
    
    // URLが無効な場合はエラーページを表示
    if (!isValidUrl(currentView)) {
      return <ErrorPage url={currentView} />;
    }
    
    // それ以外はジェネリックページを表示
    return <GenericPage url={currentView} />;
  };

  return (
    <BaseApp windowId={windowId} isActive={isActive} toolbar={toolbar} statusBar={statusBar}>
      <div key={reloadKey} className="h-full bg-white overflow-auto relative">
        {renderContent()}
      </div>
    </BaseApp>
  );
};