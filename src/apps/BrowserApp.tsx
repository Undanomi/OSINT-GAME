import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BaseApp } from '@/components/BaseApp';
import { AppProps } from '@/types/app';
import { Search, ArrowLeft, ArrowRight, RotateCcw, Home, X, Plus } from 'lucide-react';
import { UnifiedSearchResult } from '@/types/search';
import { filterSearchResults, SearchResult } from '@/actions/searchResults';
import { LOCAL_STORAGE_KEYS } from '@/types/localStorage';

// 各ページコンポーネントのインポート
import { GenericPage } from './pages/GenericPage';
import { ErrorPage } from './pages/ErrorPage';
import { GogglesHomePage } from './pages/GogglesHomePage';
import { GogglesSearchResultsPage } from './pages/GogglesSearchResultsPage';
import { staticPages, dynamicPageComponentMap } from './pages/config/PageMapping';

// ブラウザの表示状態を識別するための定数
const VIEW_HOME = 'view:home';                 // ホームページ
const VIEW_SEARCH_RESULTS = 'view:search_results'; // 検索結果ページ

// タブの最小幅と追加ボタンの幅（px）
const TAB_MIN_WIDTH = 80;
const ADD_BUTTON_WIDTH = 40;

/**
 * スペル提案情報の型定義
 */
export type SuggestionInfo = {
  /** 元のキーワード（ユーザーが入力したもの） */
  original: string;
  /** 提案後のキーワード */
  suggested: string;
} | null;

/**
 * タブの状態を表す型定義
 */
interface BrowserTab {
  /** タブの一意識別子 */
  id: string;
  /** タブのタイトル */
  title: string;
  /** 検索クエリ */
  searchQuery: string;
  /** 検索結果 */
  searchResults: SearchResult[];
  /** スペル提案情報 */
  suggestionInfo: SuggestionInfo;
  /** URLバー入力 */
  urlInput: string;
  /** ナビゲーション履歴 */
  history: string[];
  /** 履歴内の現在位置 */
  historyIndex: number;
  /** 現在のページ番号 */
  currentPage: number;
  /** 現在の動的コンポーネント */
  currentDynamicComponent: React.ReactElement | null;
}

/**
 * ブラウザアプリケーション - OSINT調査ゲーム用のブラウザシミュレータ
 * 検索機能、ナビゲーション履歴、カスタムページ表示機能を実装
 *
 * @param windowId - アプリケーションウィンドウの一意識別子
 * @param isActive - アプリケーションがアクティブかどうかのフラグ
 * @returns JSX.Element - ブラウザアプリケーションのレンダリング結果
 */
export const BrowserApp: React.FC<AppProps> = ({ windowId, isActive }) => {
  // タブIDカウンター
  const tabIdCounter = useRef(1);

  // タブ管理用のstate
  const [tabs, setTabs] = useState<BrowserTab[]>([{
    id: '0',
    title: 'Goggles',
    searchQuery: '',
    searchResults: [],
    suggestionInfo: null,
    urlInput: 'https://www.goggles.com',
    history: [VIEW_HOME],
    historyIndex: 0,
    currentPage: 1,
    currentDynamicComponent: null,
  }]);

  // アクティブなタブのID
  const [activeTabId, setActiveTabId] = useState('0');

  // タブバーの幅に応じた最大タブ数
  const [maxTabs, setMaxTabs] = useState(10);

  // 検索入力欄のref（フォーカス制御用）
  const searchInputRef = useRef<HTMLInputElement>(null);

  // タブバーのref（幅監視用）
  const tabBarRef = useRef<HTMLDivElement>(null);

  // Firebase検索結果のキャッシュ（全タブで共有）
  const [firebaseCache, setFirebaseCache] = useState<UnifiedSearchResult[]>([]);
  // Firebase初回読み込み完了フラグ
  const [isCacheLoaded, setIsCacheLoaded] = useState(false);

  // リロードUI表示フラグ
  const [showFakeReload, setShowFakeReload] = useState(false);

  const itemsPerPage = 10;

  // アクティブなタブを取得
  const activeTab = tabs.find(tab => tab.id === activeTabId) || tabs[0];

  // 現在表示中のビューを取得
  const currentView = activeTab.history[activeTab.historyIndex];

  /**
   * アクティブなタブの状態を更新するヘルパー関数
   */
  const updateActiveTab = useCallback((updates: Partial<BrowserTab>) => {
    setTabs(prevTabs => prevTabs.map(tab =>
      tab.id === activeTabId ? { ...tab, ...updates } : tab
    ));
  }, [activeTabId]);

  /**
   * 新しいタブを追加する関数
   */
  const addNewTab = () => {
    // タブの最大数チェック
    if (tabs.length >= maxTabs) {
      return;
    }

    const newTabId = String(tabIdCounter.current++);
    const newTab: BrowserTab = {
      id: newTabId,
      title: 'Goggles',
      searchQuery: '',
      searchResults: [],
      suggestionInfo: null,
      urlInput: 'https://www.goggles.com',
      history: [VIEW_HOME],
      historyIndex: 0,
      currentPage: 1,
      currentDynamicComponent: null,
    };
    setTabs(prevTabs => [...prevTabs, newTab]);
    setActiveTabId(newTabId);
  };

  /**
   * タブを閉じる関数
   */
  const closeTab = (tabId: string) => {
    if (tabs.length === 1) {
      // 最後のタブの場合は閉じない
      return;
    }

    const tabIndex = tabs.findIndex(tab => tab.id === tabId);
    const newTabs = tabs.filter(tab => tab.id !== tabId);

    // 閉じたタブがアクティブだった場合、隣のタブをアクティブにする
    if (tabId === activeTabId) {
      const newActiveIndex = Math.min(tabIndex, newTabs.length - 1);
      setActiveTabId(newTabs[newActiveIndex].id);
    }

    setTabs(newTabs);
  };

  /**
   * タブを切り替える関数
   */
  const switchTab = (tabId: string) => {
    setActiveTabId(tabId);
  };

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
            const trimmedParam = searchParam.trim();
            if (!trimmedParam) {
              return;
            }
            // 検索クエリをセットして検索を実行
            updateActiveTab({ searchQuery: trimmedParam });
            setTimeout(() => {
              // URLから取得したクエリで検索を実行
              performSearchOnCache(
                firebaseCache.length > 0 ? firebaseCache
                : loadCacheFromLocalStorage(), trimmedParam
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
    const newHistory = activeTab.history.slice(0, activeTab.historyIndex + 1);
    newHistory.push(targetView);

    updateActiveTab({
      history: newHistory,
      historyIndex: newHistory.length - 1
    });
  };

  /**
   * ローカルストレージからキャッシュを読み込む関数
   */
  const loadCacheFromLocalStorage = useCallback((): UnifiedSearchResult[] => {
    try {
      const cachedData = localStorage.getItem(LOCAL_STORAGE_KEYS.SEARCH_CACHE);
      const cacheTimestamp = localStorage.getItem(LOCAL_STORAGE_KEYS.CACHE_TIMESTAMP);

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
          localStorage.removeItem(LOCAL_STORAGE_KEYS.SEARCH_CACHE);
          localStorage.removeItem(LOCAL_STORAGE_KEYS.CACHE_TIMESTAMP);
          console.log('期限切れのキャッシュを削除しました');
        }
      }
    } catch (error) {
      console.error('ローカルストレージからの読み込みに失敗:', error);
    }

    return [];
  }, []);

  /**
   * 検索処理を実行する関数（ホームページから呼ばれる）
   * ローカルストレージのキャッシュを使用
   * キーワードマッチングとページネーション機能を実装
   */
  const performSearch = async (query?: string) => {
    const trimmedQuery = (query || activeTab.searchQuery).trim();
    if (!trimmedQuery) {
      return; // 空の検索クエリは無視
    }

    updateActiveTab({ currentPage: 1, searchQuery: trimmedQuery }); // 検索時はページを1に戻す

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
      performSearchOnCache(cacheToUse, trimmedQuery);

      // 検索実行後、入力欄からフォーカスを外して連打を防止
      searchInputRef.current?.blur();
    } catch (error) {
      console.error('Failed to perform search:', error);
    }
  };

  /**
   * キャッシュされたデータに対して部分一致検索を実行する関数
   * @param skipSuggestion - スペルチェックをスキップするかどうか
   */
  const performSearchOnCache = async (cache: UnifiedSearchResult[], query: string, skipSuggestion = false) => {
    try {
      const { results, suggestion } = await filterSearchResults(cache, query);
      // 提案がある場合は、提案キーワードで再検索
      if (suggestion && !skipSuggestion) {
        const { results: suggestedResults } = await filterSearchResults(cache, suggestion);
        updateActiveTab({
          searchResults: suggestedResults,
          suggestionInfo: { original: query, suggested: suggestion }
        });
      } else {
        // 提案がない場合、またはスキップする場合は通常通り
        updateActiveTab({
          searchResults: results,
          suggestionInfo: null
        });
      }

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
   * 提案キーワードのクリック処理
   * 提案されたキーワードで再検索を実行
   */
  const handleSuggestionClick = (suggestedQuery: string) => {
    updateActiveTab({ searchQuery: suggestedQuery });
    // キャッシュを使って検索を実行（スペルチェックをスキップ）
    const cacheToUse = firebaseCache.length > 0 ? firebaseCache : loadCacheFromLocalStorage();
    if (cacheToUse.length > 0) {
      performSearchOnCache(cacheToUse, suggestedQuery, true);
    }
  };

  /**
   * ホームページの検索入力フィールドのEnterキーイベント処理
   * Enterキーで検索を実行（IME変換中は無視）
   */
  const handleHomePageSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      performSearch(activeTab.searchQuery);
    }
  };

  /**
   * ブラウザの「戻る」ボタンの処理
   * 履歴の前のページに戻る
   */
  const handleBack = () => {
    if (activeTab.historyIndex > 0) {
      updateActiveTab({ historyIndex: activeTab.historyIndex - 1 });
    }
  };

  /**
   * ブラウザの「進む」ボタンの処理
   * 履歴の次のページに進む
   */
  const handleForward = () => {
    if (activeTab.historyIndex < activeTab.history.length - 1) {
      updateActiveTab({ historyIndex: activeTab.historyIndex + 1 });
    }
  };

  /**
   * ページリロード処理
   * 実際のリロードは行わず、リロードUIを表示
   */
  const handleReload = () => {
    setShowFakeReload(true);
    setTimeout(() => {
      setShowFakeReload(false);
    }, 500);
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
    if (currentView === VIEW_SEARCH_RESULTS) return `https://www.goggles.com/search?q=${encodeURIComponent(activeTab.searchQuery)}`;
    return currentView;
  }, [currentView, activeTab.searchQuery]);

  /**
   * URLバー/検索バーの統合入力処理
   * URLかキーワードかを自動判定して適切な処理を実行
   */
  const handleUnifiedInputSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing && activeTab.urlInput.trim()) {
      const input = activeTab.urlInput.trim();

      // URLかどうかを判定
      const isUrl = input.startsWith('http://') ||
                    input.startsWith('https://') ||
                    input.includes('.') && !input.includes(' ');

      if (isUrl) {
        // URL として処理
        let url = input;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }

        // 現在のURLと同じ場合は何もしない
        const currentUrl = getDisplayUrl();
        if (url === currentUrl) {
          return;
        }

        navigateTo(url);
        // フォーカスを外す
        searchInputRef.current?.blur();
      } else {
        // 検索キーワードとして処理
        updateActiveTab({ searchQuery: input });
        // フォーカスを外す
        searchInputRef.current?.blur();
        setTimeout(() => {
          const cacheToUse = firebaseCache.length > 0 ? firebaseCache : loadCacheFromLocalStorage();
          if (cacheToUse.length > 0) {
            performSearchOnCache(cacheToUse, input);
          }
        }, 0);
      }
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

  // タブバーの幅を監視して最大タブ数を計算
  useEffect(() => {
    const tabBarElement = tabBarRef.current;
    if (!tabBarElement) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        // 利用可能な幅 = 全体の幅 - 追加ボタンの幅
        const availableWidth = width - ADD_BUTTON_WIDTH;
        // 最大タブ数 = 利用可能な幅 / タブの最小幅
        const calculatedMaxTabs = Math.floor(availableWidth / TAB_MIN_WIDTH);
        // 最低1タブ、最大20タブ
        setMaxTabs(Math.max(1, Math.min(calculatedMaxTabs, 20)));
      }
    });

    resizeObserver.observe(tabBarElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // URLが変更されたときにURLバーとタブタイトルを更新
  useEffect(() => {
    const displayUrl = getDisplayUrl();
    let title = 'Goggles';

    if (currentView === VIEW_HOME) {
      title = 'Goggles';
    } else if (currentView === VIEW_SEARCH_RESULTS && activeTab.searchQuery) {
      title = activeTab.searchQuery;
    } else {
      // URLからタイトルを生成
      try {
        const url = new URL(currentView);
        title = url.hostname;
      } catch {
        title = 'ページ';
      }
    }

    updateActiveTab({ urlInput: displayUrl, title });
  }, [getDisplayUrl, currentView, activeTab.searchQuery, updateActiveTab]);

  // 現在のビューが変更されたときのページ取得
  useEffect(() => {
    const loadDynamicComponent = async () => {
      // ホームページや検索結果ページの場合は何もしない
      if (currentView === VIEW_HOME || currentView === VIEW_SEARCH_RESULTS) {
        updateActiveTab({ currentDynamicComponent: null });
        return;
      }

      // 静的ページチェック
      if (staticPages[currentView]) {
        updateActiveTab({ currentDynamicComponent: null });
        return;
      }

      // 動的ページの取得を試行
      try {
        const component = await getDynamicPageComponent(currentView);
        updateActiveTab({ currentDynamicComponent: component });
      } catch (error) {
        console.error('Failed to load dynamic component:', error);
        updateActiveTab({ currentDynamicComponent: null });
      }
    };

    loadDynamicComponent();
  }, [currentView, firebaseCache, getDynamicPageComponent, updateActiveTab]);


  /**
   * タブバーのコンポーネント
   */
  const tabBar = (
    <div ref={tabBarRef} className="flex items-center bg-gray-300 border-b w-full overflow-hidden">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`
            group flex items-center gap-2 px-4 py-2 border-r cursor-pointer flex-1 min-w-[80px] max-w-[200px]
            ${tab.id === activeTabId ? 'bg-white text-gray-900' : 'bg-gray-300 text-gray-600 hover:bg-gray-400'}
          `}
          onClick={() => switchTab(tab.id)}
        >
          <span className="flex-1 truncate text-sm">
            {tab.title}
          </span>
          {tabs.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-300 rounded flex-shrink-0"
              title="タブを閉じる"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ))}
      <button
        onClick={addNewTab}
        disabled={tabs.length >= maxTabs}
        className="px-3 py-2 hover:bg-gray-200 text-gray-600 flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
        title={tabs.length >= maxTabs ? `タブの上限（${maxTabs}）に達しました` : '新しいタブ'}
      >
        <Plus size={16} />
      </button>
    </div>
  );

  /**
   * ブラウザのツールバーコンポーネント
   * ナビゲーションボタン、アドレスバー、検索フィールドを含む
   */
  const toolbar = (
    <div className="w-full overflow-hidden">
      {tabBar}
      <div className="p-3 space-y-2">
      {/* ナビゲーションボタンとアドレスバー */}
      <div className="flex items-center space-x-2">
        {/* 戻るボタン */}
        <button
          onClick={handleBack}
          disabled={activeTab.historyIndex === 0}
          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
          title="戻る"
        >
          <ArrowLeft size={16} />
        </button>

        {/* 進むボタン */}
        <button
          onClick={handleForward}
          disabled={activeTab.historyIndex >= activeTab.history.length - 1}
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

        {/* 統合アドレスバー（URL入力と検索を兼ねる） */}
        <div className="flex-1 bg-white border rounded-md flex items-center px-3 py-1">
          <Search size={16} className="text-gray-400 mr-2" />
          <input
            ref={searchInputRef}
            type="text"
            value={activeTab.urlInput}
            onChange={(e) => updateActiveTab({ urlInput: e.target.value })}
            onKeyDown={handleUnifiedInputSubmit}
            onFocus={(e) => {
              // フォーカス時に全選択（デフォルトのカーソル配置の後に実行）
              const target = e.target as HTMLInputElement;
              setTimeout(() => {
                target.select();
              }, 0);
            }}
            onClick={(e) => {
              // クリック時に全選択（デフォルトのカーソル配置の後に実行）
              const target = e.currentTarget;
              setTimeout(() => {
                target.select();
              }, 0);
            }}
            className="flex-1 outline-none text-sm"
            placeholder="URLまたは検索キーワードを入力"
          />
        </div>
      </div>
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
          searchQuery={activeTab.searchQuery}
          onSearchQueryChange={(query) => updateActiveTab({ searchQuery: query })}
          onSearch={() => performSearch(activeTab.searchQuery)}
          onKeyPress={handleHomePageSearch}
          onNavigate={navigateTo}
        />
      );
    }

    // 2. 検索結果画面
    if (currentView === VIEW_SEARCH_RESULTS) {
      return (
        <GogglesSearchResultsPage
          searchResults={activeTab.searchResults}
          currentPage={activeTab.currentPage}
          itemsPerPage={itemsPerPage}
          onResultClick={handleResultClick}
          onPageChange={(page) => updateActiveTab({ currentPage: page })}
          suggestionInfo={activeTab.suggestionInfo}
          onSuggestionClick={handleSuggestionClick}
        />
      );
    }

    // 3. カスタムページまたはエラーページの表示（動的対応）
    // URLの妥当性をチェック
    const isValidUrl = (url: string) => {
      try {
        new URL(url);
        // Firebaseキャッシュに存在するか、静的ページに存在するかチェック
        const exists = firebaseCache.some(item => item.url === url) || !!staticPages[url];
        return exists;
      } catch {
        return false;
      }
    };

    // ドメイン失効チェック
    const checkDomainExpired = () => {
      const cache = firebaseCache.length > 0 ? firebaseCache : loadCacheFromLocalStorage();
      const pageData = cache.find(item => item.url === currentView);
      return pageData?.domainStatus === 'expired';
    };

    // ドメイン失効ページの表示（通常のエラーページを使用）
    if (checkDomainExpired()) {
      return <ErrorPage url={currentView} />;
    }

    // 動的コンポーネントが見つかった場合はそれを表示
    if (activeTab.currentDynamicComponent) {
      return activeTab.currentDynamicComponent;
    }

    // 静的ページが存在する場合はそれを表示
    if (staticPages[currentView]) {
      const page = staticPages[currentView];
      return typeof page === 'function' ? page(currentView, navigateTo) : page;
    }

    // Playback Machine URLの処理
    if (currentView.includes('playback.archive')) {
      const page = staticPages['https://playback.archive'];
      return typeof page === 'function' ? page(currentView, navigateTo) : page;
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
      <div className="relative h-full w-full bg-white overflow-hidden">
        <div className="h-full w-full overflow-x-hidden overflow-y-auto">
          {renderContent()}
        </div>
        {showFakeReload && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-100 z-100">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">読み込み中...</span>
            </div>
          </div>
        )}
      </div>
    </BaseApp>
  );
};