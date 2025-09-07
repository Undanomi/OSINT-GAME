import React, { useState, useEffect, useCallback } from 'react';
import { BaseApp } from '@/components/BaseApp';
import { AppProps } from '@/types/app';
import { Search, ArrowLeft, ArrowRight, RotateCcw, Home } from 'lucide-react';
import { UnifiedSearchResult } from '@/types/search';
import { filterSearchResults, SearchResult } from '@/actions/searchResults';

// 各ページコンポーネントのインポート
import { GenericPage } from './pages/GenericPage';
import { ErrorPage } from './pages/ErrorPage';
import { GogglesHomePage } from './pages/GogglesHomePage';
import { GogglesSearchResultsPage } from './pages/GogglesSearchResultsPage';
import { staticPages, dynamicPageComponentMap } from './pages/config/PageMapping';

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
  // 現在表示中の動的コンポーネント
  const [currentDynamicComponent, setCurrentDynamicComponent] = useState<React.ReactElement | null>(null);

  // 現在表示中のビューを取得
  const currentView = history[historyIndex];

  /**
   * 指定されたビューまたはURLにナビゲートする関数
   * ブラウザの履歴機能を再現し、戻る・進む操作に対応
   * 
   * @param viewIdentifier - ナビゲート先のURLまたはビュー識別子
   */
  const navigateTo = (viewIdentifier: string) => {
    let targetView = viewIdentifier;

    // gogglesのURLの処理
    try {
      const urlObj = new URL(viewIdentifier);
      if (
        urlObj.hostname === 'www.goggles.com'
        || urlObj.hostname === 'goggles.com'
        || urlObj.hostname === 'goggles'
      ) {
        // メインページの場合はホーム画面にリダイレクト
        if (urlObj.pathname === '/' || urlObj.pathname === '') {
          targetView = VIEW_HOME;
        }
        // 検索URLの場合は検索結果画面にリダイレクト
        else if (urlObj.pathname === '/search') {
          const searchParam = urlObj.searchParams.get('q');
          if (searchParam) {
            // 検索クエリをセットして検索を実行
            setSearchQuery(searchParam);
            setTimeout(() => {
              // URLから取得したクエリで検索を実行
              performSearchOnCache(
                firebaseCache.length > 0 ? firebaseCache
                : loadCacheFromLocalStorage(), searchParam
              );
            }, 0);
          }
          targetView = VIEW_SEARCH_RESULTS;
        }
      }
    } catch {
      // URL解析に失敗した場合は元のviewIdentifierを使用
    }

    // 同じページへの遷移の場合は何もしない
    if (currentView === targetView) {
      return;
    }

    // 現在位置から後を切り捨て新しい履歴を作成
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(targetView);

    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  /**
   * ローカルストレージからキャッシュを読み込む関数
   */
  const loadCacheFromLocalStorage = useCallback((): UnifiedSearchResult[] => {
    try {
      const cachedData = localStorage.getItem('osint-game-search-cache');
      const cacheTimestamp = localStorage.getItem('osint-game-cache-timestamp');

      if (typeof cachedData === 'string' && cachedData != '[]' && cacheTimestamp) {
        const timestamp = parseInt(cacheTimestamp);
        const now = Date.now();
        // キャッシュの有効期限
        const cacheExpiry = 60 * 60 * 1000;

        if (now - timestamp < cacheExpiry) {
          const parsedCache = JSON.parse(cachedData) as UnifiedSearchResult[];
          console.log('ローカルストレージからキャッシュを読み込みました:', parsedCache.length + '件');
          return parsedCache;
        } else {
          // 期限切れのキャッシュを削除
          localStorage.removeItem('osint-game-search-cache');
          localStorage.removeItem('osint-game-cache-timestamp');
          console.log('期限切れのキャッシュを削除しました');
        }
      }
    } catch (error) {
      console.error('ローカルストレージからの読み込みに失敗:', error);
    }

    return [];
  }, []);

  /**
   * 検索処理を実行する関数
   * ローカルストレージのキャッシュを使用
   * キーワードマッチングとページネーション機能を実装
   */
  const performSearch = async () => {
    console.log('performSearch called');
    console.log('searchQuery:', searchQuery);
    
    if (!searchQuery.trim()) {
      console.log('Empty search query, returning');
      return; // 空の検索クエリは無視
    }

    setCurrentPage(1); // 検索時はページを1に戻す

    try {
      let cacheToUse = firebaseCache;
      // キャッシュが読み込まれていない場合
      if (!isCacheLoaded) {
        // ローカルストレージから読み込みを試行
        const localCache = loadCacheFromLocalStorage();
        
        if (localCache.length > 0) {
          // ローカルストレージのキャッシュが利用可能
          setFirebaseCache(localCache);
          setIsCacheLoaded(true);
          cacheToUse = localCache;
        } else {
          // ローカルストレージにキャッシュがない場合はエラー
          console.error('キャッシュが見つかりません。シナリオを再選択してください。');
          return;
        }
      }

      // キャッシュを使って検索を実行
      performSearchOnCache(cacheToUse, searchQuery);
    } catch (error) {
      console.error('Failed to perform search:', error);
    }
  };

  /**
   * キャッシュされたデータに対して部分一致検索を実行する関数
   */
  const performSearchOnCache = async (cache: UnifiedSearchResult[], query: string) => {
    try {
      const filteredResults = await filterSearchResults(cache, query);

      console.log('検索結果:', filteredResults);
      console.log('検索結果数:', filteredResults.length);
      
      setSearchResults(filteredResults);
      navigateTo(VIEW_SEARCH_RESULTS); // 検索結果ページに遷移
    } catch (error) {
      console.error('Failed to filter results:', error);
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

      // 現在のURLと同じ場合は何もしない
      const currentUrl = getDisplayUrl();
      if (url === currentUrl) {
        return;
      }

      navigateTo(url);
      setUrlInput('');
    }
  };

  /**
   * キャッシュから動的にページコンポーネントを取得する関数
   * ローカルストレージとメモリキャッシュのみを使用（Firebaseからの取得は行わない）
   */
  const getDynamicPageComponent = useCallback(async (url: string): Promise<React.ReactElement | null> => {
    // 1. メモリキャッシュから探す
    const cachedResult = firebaseCache.find(item => item.url === url);
    if (cachedResult) {
      const ComponentFactory = dynamicPageComponentMap[cachedResult.template];
      return ComponentFactory ? ComponentFactory(cachedResult.id, cachedResult) : null;
    }

    // 2. ローカルストレージから探す（メモリキャッシュが空の場合）
    if (!isCacheLoaded) {
      const localCache = loadCacheFromLocalStorage();
      if (localCache.length > 0) {
        setFirebaseCache(localCache);
        setIsCacheLoaded(true);
        
        const localCachedResult = localCache.find(item => item.url === url);
        if (localCachedResult) {
          const ComponentFactory = dynamicPageComponentMap[localCachedResult.template];
          return ComponentFactory ? ComponentFactory(localCachedResult.id, localCachedResult) : null;
        }
      }
    }

    // 3. キャッシュにない場合は null を返す
    console.warn('ページデータがキャッシュに見つかりません:', url);
    return null;
  }, [firebaseCache, isCacheLoaded, loadCacheFromLocalStorage]);

  // URLが変更されたときにURLバーを更新
  useEffect(() => {
    setUrlInput(getDisplayUrl());
  }, [getDisplayUrl]);

  // 現在のビューが変更されたときのページ取得
  useEffect(() => {
    const loadDynamicComponent = async () => {
      // ホームページや検索結果ページの場合は何もしない
      if (currentView === VIEW_HOME || currentView === VIEW_SEARCH_RESULTS) {
        setCurrentDynamicComponent(null);
        return;
      }

      // 静的ページチェック
      if (staticPages[currentView]) {
        setCurrentDynamicComponent(null);
        return;
      }

      // 動的ページの取得を試行
      try {
        const component = await getDynamicPageComponent(currentView);
        setCurrentDynamicComponent(component);
      } catch (error) {
        console.error('Failed to load dynamic component:', error);
        setCurrentDynamicComponent(null);
      }
    };

    loadDynamicComponent();
  }, [currentView, firebaseCache, getDynamicPageComponent]);


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
          disabled={!searchQuery.trim()}
        >
          検索
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
    // 1. ホーム画面
    if (currentView === VIEW_HOME) {
      return (
        <GogglesHomePage
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onSearch={performSearch}
          onKeyPress={handleKeyPress}
        />
      );
    }

    // 2. 検索結果画面
    if (currentView === VIEW_SEARCH_RESULTS) {
      return (
        <GogglesSearchResultsPage
          searchResults={searchResults}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onResultClick={handleResultClick}
          onPageChange={setCurrentPage}
        />
      );
    }

    // 3. カスタムページまたはエラーページの表示（動的対応）
    // URLの妥当性をチェック
    const isValidUrl = (url: string) => {
      try {
        const urlObj = new URL(url);

        // gogglesドメインの場合は常に有効とみなす
        if (urlObj.hostname === 'www.goggles.com' || urlObj.hostname === 'goggles.com') {
          return true;
        }

        // Firebaseキャッシュに存在するか、静的ページに存在するかチェック
        const exists = firebaseCache.some(item => item.url === url) || !!staticPages[url];
        return exists;
      } catch {
        return false;
      }
    };

    // 動的コンポーネントが見つかった場合はそれを表示
    if (currentDynamicComponent) {
      return currentDynamicComponent;
    }

    // 静的ページが存在する場合はそれを表示
    if (staticPages[currentView]) {
      return staticPages[currentView];
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