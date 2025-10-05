import React, { useState, useEffect, useCallback } from 'react';
import { Clock } from 'lucide-react';
import { UnifiedSearchResult } from '@/types/search';
import { LOCAL_STORAGE_KEYS } from '@/types/localStorage';
import { dynamicPageComponentMap } from './config/PageMapping';
import { GenericPage } from './GenericPage';
import { NoArchivePage } from './NoArchivePage';

interface PlaybackMachinePageProps {
  url: string;
  onNavigate?: (url: string) => void;
}

/**
 * Playback Machine Webアプリ - ブラウザ内で動作するアーカイブビューア
 */
export const PlaybackMachinePage: React.FC<PlaybackMachinePageProps> = ({ url, onNavigate }) => {
  const [searchInput, setSearchInput] = useState('');
  const [currentArchiveUrl, setCurrentArchiveUrl] = useState<string | null>(null);
  const [currentPageData, setCurrentPageData] = useState<UnifiedSearchResult | null>(null);
  const [showArchive, setShowArchive] = useState(false);

  /**
   * ローカルストレージからキャッシュを読み込む
   */
  const loadCacheFromLocalStorage = useCallback((): UnifiedSearchResult[] => {
    try {
      const cachedData = localStorage.getItem(LOCAL_STORAGE_KEYS.SEARCH_CACHE);
      if (cachedData && cachedData !== '[]') {
        const parsedCache = JSON.parse(cachedData) as UnifiedSearchResult[];
        return parsedCache;
      }
    } catch (error) {
      console.error('Failed to load cache:', error);
    }
    return [];
  }, []);

  /**
   * URLからアーカイブ日付と元のURLを抽出
   */
  const parseArchiveUrl = (url: string): { date: string | null; originalUrl: string | null } => {
    // 形式: https://playback.archive/web/20240315/https://example.com
    const match = url.match(/^https?:\/\/playback\.archive\/web\/(\d{8})\/(.+)$/);
    if (match) {
      const dateStr = match[1];
      const formattedDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
      return { date: formattedDate, originalUrl: match[2] };
    }
    return { date: null, originalUrl: null };
  };

  /**
   * 日付をYYYYMMDD形式に変換
   */
  const formatDateForUrl = (date: string): string => {
    return date.replace(/-/g, '');
  };

  /**
   * 検索フィールドでEnterキーが押された時の処理
   */
  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchInput.trim()) {
      let searchUrl = searchInput.trim();

      // httpスキームがない場合は追加
      if (!searchUrl.startsWith('http://') && !searchUrl.startsWith('https://')) {
        searchUrl = 'https://' + searchUrl;
      }

      // キャッシュから検索
      const cache = loadCacheFromLocalStorage();
      const pageData = cache.find(item => item.url === searchUrl);

      if (pageData) {
        const archiveDate = pageData.archivedDate;
        const formattedDate = formatDateForUrl(archiveDate);
        const archiveUrl = `https://playback.archive/web/${formattedDate}/${pageData.url}`;

        // ブラウザのURLバーを更新してページ遷移
        if (onNavigate) {
          onNavigate(archiveUrl);
        }
      } else {
        // データが見つからない場合でも遷移
        const archiveUrl = `https://playback.archive/web/20240101/${searchUrl}`;
        if (onNavigate) {
          onNavigate(archiveUrl);
        }
      }

      // 検索後は入力をクリアしない（現在のURLを表示し続ける）
    }
  };

  /**
   * ホームに戻る
   */
  const handleBackToHome = () => {
    if (onNavigate) {
      onNavigate('https://playback.archive/');
    }
  };

  // URLパラメータでアーカイブURLが渡された場合の処理
  useEffect(() => {
    const { originalUrl } = parseArchiveUrl(url);
    if (originalUrl) {
      const cache = loadCacheFromLocalStorage();
      const pageData = cache.find(item => item.url === originalUrl);
      setCurrentPageData(pageData || null);
      setCurrentArchiveUrl(url);
      setShowArchive(true);
      // 検索バーに元のURLを表示
      setSearchInput(originalUrl);
    } else if (url === 'https://playback.archive/' || url === 'https://playback.archive') {
      // ホームページの場合は検索バーをクリア
      setSearchInput('');
      setShowArchive(false);
    }
  }, [url, loadCacheFromLocalStorage]);

  // アーカイブページを表示
  if (showArchive && currentArchiveUrl) {
    const { date, originalUrl } = parseArchiveUrl(currentArchiveUrl);

    if (originalUrl) {
      if (currentPageData) {
        const archiveDate = date || currentPageData.archivedDate;
        const ComponentFactory = dynamicPageComponentMap[currentPageData.template];
        const pageComponent = ComponentFactory ?
          ComponentFactory(currentPageData.id, currentPageData) :
          <GenericPage url={originalUrl} />;

        return (
          <div className="h-full flex flex-col bg-white">
            {/* Playback Machineヘッダーと検索バー */}
            <div className="bg-black text-white">
              <div className="px-4 py-2 flex items-center space-x-4">
                <button
                  onClick={handleBackToHome}
                  className="flex items-center space-x-2 hover:text-gray-300"
                  title="Playback Machineホームへ"
                >
                  <Clock size={20} />
                  <span className="font-bold">Playback Machine</span>
                </button>

                {/* 検索バー */}
                <div className="flex-1 max-w-2xl">
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyUp={handleSearchSubmit}
                    className="w-full px-3 py-1 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:ring-1 focus:ring-yellow-400 focus:border-transparent outline-none text-sm"
                    placeholder="URLを入力"
                  />
                </div>
              </div>
            </div>

            {/* アーカイブバナー */}
            <div className="bg-yellow-100 border-b border-yellow-300 px-4 py-2">
              <div className="flex items-center">
                <Clock size={16} className="mr-2 text-yellow-700" />
                <span className="text-sm font-medium text-yellow-800">
                  {archiveDate} にアーカイブされたページ
                </span>
              </div>
            </div>

            {/* ページコンテンツ */}
            <div className="flex-1 overflow-auto">
              {pageComponent}
            </div>
          </div>
        );
      } else {
        // アーカイブが存在しない
        return (
          <div className="h-full flex flex-col bg-white">
            {/* Playback Machineヘッダーと検索バー */}
            <div className="bg-black text-white">
              <div className="px-4 py-2 flex items-center space-x-4">
                <button
                  onClick={handleBackToHome}
                  className="flex items-center space-x-2 hover:text-gray-300"
                >
                  <Clock size={20} />
                  <span className="font-bold">Playback Machine</span>
                </button>

                {/* 検索バー */}
                <div className="flex-1 max-w-2xl">
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyUp={handleSearchSubmit}
                    className="w-full px-3 py-1 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:ring-1 focus:ring-yellow-400 focus:border-transparent outline-none text-sm"
                    placeholder="URLを入力"
                  />
                </div>
              </div>
            </div>
            <NoArchivePage url={originalUrl} />
          </div>
        );
      }
    }
  }

  // Playback Machineホームページ
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* ヘッダー */}
      <div className="px-6 py-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <Clock size={32} className="text-yellow-400" />
          <div>
            <h1 className="text-2xl font-bold">Playback Machine</h1>
            <p className="text-sm text-gray-400">インターネットアーカイブ</p>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col items-center justify-start pt-16 p-8">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">
              過去のウェブページを検索
            </h2>
            <p className="text-gray-400">
              アーカイブされたウェブサイトのスナップショットを閲覧できます
            </p>
          </div>

          {/* 検索フィールド */}
          <div className="bg-gray-700 rounded-lg p-6 shadow-xl">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyUp={handleSearchSubmit}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none"
              placeholder="調べたいサイトのURLを入力"
              autoFocus
            />
            <p className="mt-3 text-xs text-gray-400">
              Enterキーを押してアーカイブを検索
            </p>
          </div>

          {/* 情報セクション */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-yellow-400">📚 アーカイブについて</h3>
              <p className="text-sm text-gray-300">
                ウェブサイトの過去のバージョンを保存し、
                いつでもアクセスできるようにしています。
              </p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-yellow-400">🔍 使い方</h3>
              <p className="text-sm text-gray-300">
                調べたいウェブサイトのURLを入力すると、
                保存されたアーカイブを表示します。
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              * ドメインが失効したサイトもアーカイブから閲覧可能です
            </p>
          </div>
        </div>
      </div>

      {/* フッター */}
      <div className="px-6 py-3 border-t border-gray-700 text-center">
        <p className="text-xs text-gray-500">
          Playback Machine - Digital Archive Service 2025
        </p>
      </div>
    </div>
  );
};