import React, { useState } from 'react';
import { BaseApp } from '@/components/BaseApp';
import { AppProps } from '@/types/app';
import { Search, ArrowLeft, ArrowRight, RotateCcw, Home, ExternalLink } from 'lucide-react';

// 外部コンポーネントのインポートは変更なし
import { AbcCorpPage } from './pages/AbcCorpPage';
import { LinkedInProfilePage } from './pages/LinkedInProfilePage';
import { GenericPage } from './pages/GenericPage';


interface SearchResult {
  id: string;
  title: string;
  url: string;
  description: string;
  type: 'corporate' | 'social' | 'news' | 'personal' | 'directory';
  // [削除] relevantInfoプロパティを削除
}

// サンプルDBからrelevantInfoを削除
const searchDatabase: SearchResult[] = [
  {
    id: '1',
    title: '田中太郎 - LinkedInプロフィール',
    url: 'https://linkedin.com/in/taro-tanaka',
    description: 'ABC株式会社のマーケティング部長。東京大学経済学部卒。デジタルマーケティングとブランド戦略の専門家。',
    type: 'social',
  },
  {
    id: '2',
    title: 'ABC株式会社 - 企業情報',
    url: 'https://abc-corp.co.jp',
    description: '1985年設立のIT企業。従業員数500名。クラウドソリューション、AI、IoTサービスを提供。',
    type: 'corporate',
  },
  {
    id: '3',
    title: '佐藤花子のポートフォリオサイト',
    url: 'https://hanako-portfolio.com',
    description: 'フロントエンドエンジニア。React、TypeScript、Next.js専門。ABC株式会社勤務。',
    type: 'personal',
  },
  {
    id: '4',
    title: 'ABC株式会社、新クラウドサービスを発表 - IT News Today',
    url: 'https://it-news-today.com/abc-cloud-launch',
    description: 'ABC株式会社が企業向けクラウドプラットフォーム「ABC Cloud Pro」をリリース。セキュリティ機能を強化。',
    type: 'news',
  },
  {
    id: '5',
    title: '鈴木次郎 - GitHub',
    url: 'https://github.com/jiro-suzuki',
    description: 'シニアソフトウェアエンジニア at ABC株式会社。Go、Python、Kubernetesの専門家。',
    type: 'social',
  }
];

const pageComponents: { [key: string]: React.ReactElement } = {
  'https://abc-corp.co.jp': <AbcCorpPage />,
  'https://linkedin.com/in/taro-tanaka': <LinkedInProfilePage />,
};

const VIEW_HOME = 'view:home';
const VIEW_SEARCH_RESULTS = 'view:search_results';

export const BrowserApp: React.FC<AppProps> = ({ windowId, isActive }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [history, setHistory] = useState<string[]>([VIEW_HOME]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [reloadKey, setReloadKey] = useState(0); // 更新機能のためのState

  const currentView = history[historyIndex];

  const navigateTo = (viewIdentifier: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(viewIdentifier);

    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const performSearch = () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);

    setTimeout(() => {
      const query = searchQuery.toLowerCase();
      const results = searchDatabase.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );

      setSearchResults(results);
      setIsSearching(false);
      navigateTo(VIEW_SEARCH_RESULTS);
    }, 800);
  };

  const handleResultClick = (targetUrl: string) => {
    navigateTo(targetUrl);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  const handleReload = () => {
    setReloadKey(prev => prev + 1);
  };

  const goHome = () => {
    navigateTo(VIEW_HOME);
  };

  const getDisplayUrl = () => {
    if (currentView === VIEW_HOME) return 'https://www.google.com';
    if (currentView === VIEW_SEARCH_RESULTS) return `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
    return currentView;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'corporate': return '🏢';
      case 'social': return '👤';
      case 'news': return '📰';
      case 'personal': return '🌐';
      case 'directory': return '📋';
      default: return '🔍';
    }
  };

  const toolbar = (
    <div className="p-3 space-y-2">
      <div className="flex items-center space-x-2">
        <button onClick={handleBack} disabled={historyIndex === 0} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30" title="戻る">
          <ArrowLeft size={16} />
        </button>
        <button onClick={handleForward} disabled={historyIndex >= history.length - 1} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30" title="進む">
          <ArrowRight size={16} />
        </button>
        <button onClick={handleReload} className="p-1 hover:bg-gray-200 rounded" title="更新">
          <RotateCcw size={16} />
        </button>
        <button onClick={goHome} className="p-1 hover:bg-gray-200 rounded" title="ホーム">
          <Home size={16} />
        </button>

        <div className="flex-1 bg-white border rounded-md flex items-center px-3 py-1">
          <input
            type="text"
            value={getDisplayUrl()}
            readOnly
            className="flex-1 outline-none text-sm bg-gray-100"
          />
        </div>
      </div>

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

  const statusBar = `準備完了`;

  const renderContent = () => {
    if (currentView === VIEW_HOME) {
      return (
        <div className="h-full flex items-center justify-center">
        </div>
      );
    }

    // 2. 検索結果画面
    if (currentView === VIEW_SEARCH_RESULTS) {
      return (
        <div className="p-4">
          <div className="mb-4 pb-3 border-b">
            <p className="text-sm text-gray-600">約 {searchResults.length} 件の結果 (0.3秒)</p>
          </div>
          {isSearching ? (<div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-600">検索中...</p>
              </div>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">検索結果が見つかりませんでした</p>
              <p className="text-sm text-gray-500 mt-2">別のキーワードで試してみてください</p>
            </div>
          ) : (
            <div className="space-y-6">
              {searchResults.map((result) => (
                <div key={result.id} className="border-b pb-4">
                  <div className="flex items-start space-x-3">
                    <span className="text-lg">{getTypeIcon(result.type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3
                          className="text-lg text-blue-600 hover:underline cursor-pointer font-medium"
                          onClick={() => handleResultClick(result.url)}
                        >
                          {result.title}
                        </h3>
                        <ExternalLink size={14} className="text-gray-400" />
                      </div>
                      <p className="text-green-700 text-sm mb-2">{result.url}</p>
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