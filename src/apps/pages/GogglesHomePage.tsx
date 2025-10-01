import React from 'react';
import { Search } from 'lucide-react';
import { GogglesMailIcon } from '@/components/ui/GogglesMailIcon';
import { useGogglesMailAuthStore } from '@/store/gogglesAuthStore';

interface GogglesHomePageProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSearch: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onNavigate: (url: string) => void;
}

export const GogglesHomePage: React.FC<GogglesHomePageProps> = ({
  searchQuery,
  onSearchQueryChange,
  onSearch,
  onKeyPress,
  onNavigate,
}) => {
  const { isGogglesMailLoggedIn } = useGogglesMailAuthStore();
  const handleRandomQuery = () => {
    const randomQueries = ['Facelook', 'Rankedon', 'Kilogram', 'Z'];
    const randomQuery = randomQueries[Math.floor(Math.random() * randomQueries.length)];
    onSearchQueryChange(randomQuery);
  };

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
            onChange={(e) => onSearchQueryChange(e.target.value)}
            onKeyDown={onKeyPress}
            className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-full shadow-sm hover:shadow-md focus:shadow-md focus:border-blue-400 focus:outline-none transition-all duration-200"
            placeholder="検索"
            autoFocus
          />
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-3">
            <Search 
              size={20} 
              className="text-gray-400 cursor-pointer hover:text-gray-600" 
              onClick={onSearch}
            />
          </div>
        </div>

        {/* 検索ボタン */}
        <div className="flex justify-center mt-8 space-x-4">
          <button
            onClick={onSearch}
            disabled={!searchQuery.trim()}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded hover:shadow-sm hover:bg-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Goggles検索
          </button>
          <button
            onClick={handleRandomQuery}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded hover:shadow-sm hover:bg-gray-200 transition-all duration-200"
          >
            You&apos;re Feeling Happy?
          </button>
        </div>
      </div>

      <div className="absolute top-4 right-4">
        <a 
          href="#"
          onClick={(e) => {
            e.preventDefault();
            console.log(isGogglesMailLoggedIn);
            const targetUrl = isGogglesMailLoggedIn 
              ? 'https://mail.goggles.com'
              : 'https://mail.goggles.com/login';
            
            onNavigate(targetUrl);
          }}
          className="text-gray-800 hover:text-gray-600 flex items-center space-x-2"
        >
          <GogglesMailIcon size={20} />
          <span>Goggles Mail</span>
        </a>
      </div>

      {/* フッター情報 */}
      <div className="absolute bottom-8 text-center">
        <p className="text-sm text-gray-500">
          Goggles - あなたの情報検索パートナー
        </p>
      </div>
    </div>
  );
};