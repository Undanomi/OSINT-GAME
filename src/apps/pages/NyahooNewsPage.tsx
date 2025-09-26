'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { NyahooNewsContent } from '@/types/nyahooNews';
import { UnifiedSearchResult } from '@/types/search';
import { validateNyahooNewsContent } from '@/actions/nyahooNewsValidation';
import {
  Clock, User, Share2, ThumbsUp, ThumbsDown, Bookmark,
  MessageCircle, Search, Menu,
  Globe, TrendingUp, Newspaper
} from 'lucide-react';

interface NyahooNewsPageProps {
  documentId: string;
  initialData: UnifiedSearchResult;
}

export const NyahooNewsPage: React.FC<NyahooNewsPageProps> = ({ documentId, initialData }) => {
  const [articleData, setArticleData] = useState<NyahooNewsContent | null>(null);
  const [loading, setLoading] = useState(true);

  // Generate current time and recent times for news
  const generateRecentTimes = () => {
    const now = new Date();
    const times = [];
    for (let i = 0; i < 5; i++) {
      // Generate times from 5 minutes to 2 hours ago, each subsequent news is older
      const minutesAgo = 5 + (i * 10) + Math.floor(Math.random() * 15);
      const timeAgo = new Date(now.getTime() - minutesAgo * 60000);
      times.push(timeAgo.getHours().toString().padStart(2, '0') + ':' + timeAgo.getMinutes().toString().padStart(2, '0'));
    }
    return times;
  };

  // Generate random popular tags
  const generateRandomTags = () => {
    const allTags = [
      'AI', '経済', '政治', 'スポーツ', 'テクノロジー', '国際情勢', 'エンタメ', '社会',
      '環境', '教育', '医療', '科学', '文化', '芸術', '音楽', '映画', 'アニメ', 'ゲーム',
      '旅行', 'グルメ', 'ファッション', '美容', '健康', 'ビジネス', 'スタートアップ'
    ];
    const shuffled = [...allTags].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 10);
  };

  // Generate random stock prices
  const generateRandomStocks = () => {
    const baseStocks = [
      { name: 'ニャッケイ平均', baseValue: 28500 },
      { name: 'NYAPIX', baseValue: 2040 },
      { name: 'ニャル/円', baseValue: 148 }
    ];
    return baseStocks.map(stock => {
      const changePercent = (Math.random() - 0.5) * 4; // -2% to +2%
      const change = stock.baseValue * (changePercent / 100);
      const newValue = stock.baseValue + change;
      const positive = change > 0;

      return {
        name: stock.name,
        value: stock.name === 'ニャル/円' ? newValue.toFixed(2) : newValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','),
        change: (positive ? '+' : '') + change.toFixed(2),
        rate: (positive ? '+' : '') + changePercent.toFixed(2) + '%',
        positive
      };
    });
  };

  const [recentTimes] = useState(generateRecentTimes());
  const [randomTags] = useState(generateRandomTags());
  const [randomStocks] = useState(generateRandomStocks());

  useEffect(() => {
    const fetchArticleData = async () => {
      try {
        console.log('Loading initial data for document ID:', documentId);
        const searchResult = initialData;
        console.log('Raw search result:', searchResult);

        if (searchResult.template !== 'NyahooNewsPage') {
          console.error('Invalid template for NyahooNews:', searchResult.template);
          throw new Error('Invalid template');
        }

        const data = await validateNyahooNewsContent(searchResult.content);
        console.log('Validated data from Firestore:', data);

        if (data.image?.startsWith('gs://')) {
          console.log('Converting main image:', data.image);
          data.image = await getDownloadURL(ref(storage, data.image));
          console.log('Converted to:', data.image);
        }

        console.log('Final data after URL conversion:', data);
        setArticleData(data);
      } catch (error) {
        console.error('Error fetching article data:', error);
        setArticleData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchArticleData();
  }, [documentId, initialData]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
          <span className="text-gray-600">読み込み中...</span>
        </div>
      </div>
    );
  }

  if (!articleData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-xl text-gray-600">ニュースが見つかりません</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-14 px-4">
            {/* Left section */}
            <div className="flex items-center">
              <div className="flex items-center mr-6">
                <div className="text-2xl font-bold">
                  <span className="text-red-600">Nyahoo!</span>
                  <span className="text-gray-800 text-lg ml-1">ニュース</span>
                </div>
              </div>
              <nav className="hidden lg:flex space-x-6">
                <button className="text-gray-700 hover:text-red-600 transition-colors text-sm">
                  ホーム
                </button>
                <button className="text-gray-700 hover:text-red-600 transition-colors text-sm">
                  国内
                </button>
                <button className="text-gray-700 hover:text-red-600 transition-colors text-sm">
                  国際
                </button>
                <button className="text-gray-700 hover:text-red-600 transition-colors text-sm">
                  スポーツ
                </button>
                <button className="text-gray-700 hover:text-red-600 transition-colors text-sm">
                  IT
                </button>
              </nav>
            </div>

            {/* Right section */}
            <div className="flex items-center space-x-3">
              <div className="relative hidden lg:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="検索"
                  className="border border-gray-300 pl-10 pr-4 py-1.5 w-48 text-sm focus:outline-none focus:border-red-500"
                />
              </div>
              <button className="hidden lg:flex items-center text-gray-700 hover:text-red-600 transition-colors px-2 py-1 text-sm">
                ログイン
              </button>
              <button className="p-2 hover:bg-gray-100 lg:hidden">
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Bar */}
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center space-x-6 py-2 overflow-x-auto">
              <span className="text-sm font-medium text-red-600 border-b-2 border-red-600 pb-1 whitespace-nowrap">
                {articleData.category}
              </span>
              <span className="text-sm text-gray-600 hover:text-red-600 cursor-pointer whitespace-nowrap">
                主要
              </span>
              <span className="text-sm text-gray-600 hover:text-red-600 cursor-pointer whitespace-nowrap">
                社会
              </span>
              <span className="text-sm text-gray-600 hover:text-red-600 cursor-pointer whitespace-nowrap">
                政治
              </span>
              <span className="text-sm text-gray-600 hover:text-red-600 cursor-pointer whitespace-nowrap">
                地域
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Article */}
          <article className="lg:col-span-2">
            <div className="bg-white border border-gray-200">
              {/* Article Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-xs text-gray-500">{articleData.publisher}</span>
                  <span className="text-xs text-gray-500">{articleData.date}</span>
                </div>

                <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 leading-snug">
                  {articleData.title}
                </h1>

                {/* Social Actions */}
                <div className="flex items-center space-x-4 pt-2">
                  <button className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors text-sm">
                    <ThumbsUp className="w-4 h-4" />
                    <span>{articleData.likes}</span>
                  </button>
                  <button className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors text-sm">
                    <ThumbsDown className="w-4 h-4" />
                    <span>{articleData.bads}</span>
                  </button>
                  <button className="flex items-center space-x-1 text-gray-600 hover:text-yellow-600 transition-colors text-sm">
                    <Bookmark className="w-4 h-4" />
                    <span>{articleData.bookmarks}</span>
                  </button>
                  <button className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 transition-colors text-sm">
                    <Share2 className="w-4 h-4" />
                    <span>シェア</span>
                  </button>
                </div>
              </div>

              {/* Main Image */}
              <div className="relative h-64 md:h-80">
                <Image
                  src={articleData.image}
                  alt={articleData.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <p className="text-white text-xs">{articleData.caption}</p>
                </div>
              </div>

              {/* Article Content */}
              <div className="p-4">
                <div className="prose max-w-none">
                  {articleData.content.split('\n\n').map((paragraph, idx) => (
                    <p key={idx} className="text-gray-800 leading-relaxed mb-3 text-sm">
                      {paragraph.trim()}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="bg-white border border-gray-200 mt-4">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  コメント ({articleData.comments.length})
                </h3>
              </div>

              <div className="divide-y divide-gray-200">
                {articleData.comments.map((comment, idx) => (
                  <div key={idx} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-3 h-3 text-gray-600" />
                        </div>
                        <span className="font-medium text-sm text-gray-900">{comment.user}</span>
                        <span className="text-xs text-gray-500">{comment.date}</span>
                      </div>
                      <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 text-xs">
                        <ThumbsUp className="w-3 h-3" />
                        <span>{comment.likes}</span>
                      </button>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">{comment.content}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Related Articles */}
            <div className="bg-white border border-gray-200 mt-4">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-red-600" />
                  関連記事
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                {articleData.relatedArticles.map((article, idx) => (
                  <div key={idx} className="border border-gray-200 p-3 hover:bg-gray-50 transition-colors cursor-pointer">
                    <h3 className="font-medium text-sm text-gray-900 mb-2 leading-tight">
                      {article.title}
                    </h3>
                    <div className="flex items-center space-x-3 text-xs text-gray-500 mb-2">
                      <span>{article.date}</span>
                      <span>by {article.author}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <ThumbsUp className="w-3 h-3" />
                        <span>{article.likes}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <ThumbsDown className="w-3 h-3" />
                        <span>{article.bads}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="w-3 h-3" />
                        <span>{article.replys}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            {/* Latest News */}
            <div className="bg-white border border-gray-200 mb-4">
              <div className="p-3 border-b border-gray-200">
                <h2 className="text-sm font-bold text-gray-900 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-red-600" />
                  最新ニュース
                </h2>
              </div>

              <div className="divide-y divide-gray-200">
                {[
                  { title: '新技術による革新的な解決策が発表', category: 'テクノロジー' },
                  { title: '経済指標が予想を上回る結果を記録', category: '経済' },
                  { title: '国際会議で重要な合意が成立', category: '国際' },
                  { title: 'スポーツ界で新記録が樹立される', category: 'スポーツ' },
                  { title: '地域活性化プロジェクトが始動', category: '地域' }
                ].map((news, idx) => (
                  <div key={idx} className="p-3 hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-start space-x-2">
                      <span className="text-xs text-red-600 font-medium bg-red-50 px-1 py-0.5 rounded">
                        {recentTimes[idx]}
                      </span>
                      <div className="flex-1">
                        <h3 className="font-medium text-xs text-gray-900 mb-1 leading-tight">
                          {news.title}
                        </h3>
                        <span className="text-xs text-gray-500">{news.category}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Popular Tags */}
            <div className="bg-white border border-gray-200 mb-4">
              <div className="p-3 border-b border-gray-200">
                <h2 className="text-sm font-bold text-gray-900 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-red-600" />
                  人気タグ
                </h2>
              </div>

              <div className="p-3">
                <div className="flex flex-wrap gap-2">
                  {randomTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-block bg-gray-100 hover:bg-red-100 text-gray-700 hover:text-red-700 px-2 py-1 rounded text-xs cursor-pointer transition-colors"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Weather Widget */}
            <div className="bg-white border border-gray-200 mb-4">
              <div className="p-3 border-b border-gray-200">
                <h2 className="text-sm font-bold text-gray-900 flex items-center">
                  <Globe className="w-4 h-4 mr-2 text-red-600" />
                  今日の天気
                </h2>
              </div>

              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">東京</span>
                  <div className="flex items-center">
                    <span className="text-lg font-bold text-gray-900">23°C</span>
                    <span className="text-xs text-gray-500 ml-1">晴れ</span>
                  </div>
                </div>
                <div className="text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>最高: 26°C</span>
                    <span>最低: 18°C</span>
                  </div>
                  <div className="mt-1">降水確率: 10%</div>
                </div>
              </div>
            </div>

            {/* Stock Market */}
            <div className="bg-white border border-gray-200 mb-4">
              <div className="p-3 border-b border-gray-200">
                <h2 className="text-sm font-bold text-gray-900 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-red-600" />
                  株価情報
                </h2>
              </div>

              <div className="divide-y divide-gray-200">
                {randomStocks.map((stock, idx) => (
                  <div key={idx} className="p-3 hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-900">{stock.name}</span>
                      <div className="text-right">
                        <div className="text-xs font-medium text-gray-900">{stock.value}</div>
                        <div className={`text-xs ${stock.positive ? 'text-red-600' : 'text-blue-600'}`}>
                          {stock.change} ({stock.rate})
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trending Topics */}
            <div className="bg-white border border-gray-200">
              <div className="p-3 border-b border-gray-200">
                <h2 className="text-sm font-bold text-gray-900 flex items-center">
                  <Newspaper className="w-4 h-4 mr-2 text-red-600" />
                  トレンド
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                {[
                  'AI技術の最新動向',
                  '経済情勢の変化',
                  '政治ニュース速報',
                  '国際情勢レポート',
                  'テクノロジー革新'
                ].map((trend, idx) => (
                  <div key={idx} className="flex items-center space-x-3 p-3 hover:bg-gray-50 transition-colors cursor-pointer">
                    <span className="flex-shrink-0 w-5 h-5 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-xs text-gray-700 hover:text-red-600 transition-colors">
                      {trend}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 text-gray-700 mt-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-3">
                <span className="text-lg font-bold text-red-600">Nyahoo!</span>
                <span className="text-sm font-medium text-gray-700 ml-1">ニュース</span>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">
                最新ニュースから深堀り記事まで、信頼できる情報をお届けします。
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-3 text-sm">サービス</h4>
              <ul className="space-y-1 text-xs">
                <li><span className="text-gray-600 hover:text-red-600 transition-colors cursor-pointer">ニュース</span></li>
                <li><span className="text-gray-600 hover:text-red-600 transition-colors cursor-pointer">天気</span></li>
                <li><span className="text-gray-600 hover:text-red-600 transition-colors cursor-pointer">ファイナンス</span></li>
                <li><span className="text-gray-600 hover:text-red-600 transition-colors cursor-pointer">スポーツ</span></li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-3 text-sm">ヘルプ</h4>
              <ul className="space-y-1 text-xs">
                <li><span className="text-gray-600 hover:text-red-600 transition-colors cursor-pointer">利用規約</span></li>
                <li><span className="text-gray-600 hover:text-red-600 transition-colors cursor-pointer">プライバシー</span></li>
                <li><span className="text-gray-600 hover:text-red-600 transition-colors cursor-pointer">お問い合わせ</span></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-300 mt-6 pt-4 text-center">
            <p className="text-xs text-gray-500">
              © 2025 Nyahoo! Japan Corporation. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};