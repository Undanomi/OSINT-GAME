import React, { useRef, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { SearchResult } from '@/actions/searchResults';
import { SuggestionInfo } from '@/apps/BrowserApp';

interface GogglesSearchResultsPageProps {
  searchResults: SearchResult[];
  currentPage: number;
  itemsPerPage: number;
  onResultClick: (url: string) => void;
  onPageChange: (page: number) => void;
  suggestionInfo: SuggestionInfo;
  onSuggestionClick: (suggestion: string) => void;
}

export const GogglesSearchResultsPage: React.FC<GogglesSearchResultsPageProps> = ({
  searchResults,
  currentPage,
  itemsPerPage,
  onResultClick,
  onPageChange,
  suggestionInfo,
  onSuggestionClick,
}) => {
  const topRef = useRef<HTMLDivElement>(null);

  // ページ変更時に上部にスクロール
  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [currentPage]);
  /**
   * 検索結果のタイプに応じたアイコンを返す関数
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

  // ページネーションの計算
  const totalResults = searchResults.length;
  const totalPages = Math.ceil(totalResults / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentResults = searchResults.slice(startIndex, endIndex);

  return (
    <div ref={topRef} className="p-4">
      {/* 提案キーワードの表示 */}
      {suggestionInfo && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-sm text-gray-700 mb-1">
            <button
              onClick={() => onSuggestionClick(suggestionInfo.suggested)}
              className="text-blue-600 hover:underline font-medium"
            >
              {suggestionInfo.suggested}
            </button>
            <span className="font-medium">も含んだ検索結果を表示中</span>
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">元のキーワード:</span>{' '}
            <button
              onClick={() => onSuggestionClick(suggestionInfo.original)}
              className="text-blue-600 hover:underline font-medium"
            >
              {suggestionInfo.original}
            </button>
          </p>
        </div>
      )}

      {/* 検索結果の統計情報 */}
      {totalResults > 0 && (
        <div className="mb-4 pb-3 border-b">
          <p className="text-sm text-gray-600">
            約 {totalResults} 件の結果 (0.3秒) - ページ {currentPage} / {totalPages}
          </p>
        </div>
      )}
      
      {searchResults.length === 0 ? (
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
                        onClick={() => onResultClick(result.url)}
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
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
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
                    onClick={() => onPageChange(pageNum)}
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
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
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
};