'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { YuhiShinbunContent } from '@/types/yuhishinbun';
import { UnifiedSearchResult } from '@/types/search';
import { validateYuhiShinbunContent } from '@/actions/yuhiShinbunValidation';
import {
  Clock, Calendar, User, Share2,
  MessageCircle, X, ChevronRight,
  Search, Menu, Home
} from 'lucide-react';

interface YuhiShinbunPageProps {
  documentId: string;
  initialData: UnifiedSearchResult;
}

export const YuhiShinbunPage: React.FC<YuhiShinbunPageProps> = ({ documentId, initialData }) => {
  const [articleData, setArticleData] = useState<YuhiShinbunContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageClick = useCallback((imageUrl: string) => {
    setSelectedImage(imageUrl);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedImage(null);
  }, []);

  useEffect(() => {
    const fetchArticleData = async () => {
      try {
        console.log('Loading initial data for document ID:', documentId);
        const searchResult = initialData;
        console.log('Raw search result:', searchResult);

        if (searchResult.template !== 'YuhiShinbunPage') {
          console.error('Invalid template for YuhiShinbun:', searchResult.template);
          throw new Error('Invalid template');
        }

        const data = await validateYuhiShinbunContent(searchResult.content);
        console.log('Validated data from Firestore:', data);

        // TODO: 画像をFirebase Storageから取得するようにする
        // Firebase Storage URLの変換
        if (data.image?.startsWith('gs://')) {
          console.log('Converting main image:', data.image);
          data.image = await getDownloadURL(ref(storage, data.image));
          console.log('Converted to:', data.image);
        }

        // 関連記事画像のURL変換
        for (const article of data.relatedArticles) {
          if (article.image?.startsWith('gs://')) {
            console.log('Converting related article image:', article.image);
            article.image = await getDownloadURL(ref(storage, article.image));
            console.log('Converted to:', article.image);
          }
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
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">読み込み中...</span>
        </div>
      </div>
    );
  }

  if (!articleData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-xl text-gray-600">記事が見つかりません</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left section */}
            <div className="flex items-center">
              <div
                className="text-lg sm:text-xl md:text-2xl font-bold text-orange-600 mr-4 sm:mr-6 md:mr-8 whitespace-nowrap"
                style={{
                  fontFamily: 'serif',
                  fontStyle: 'italic',
                  letterSpacing: '0.1em',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                夕日新聞
              </div>
              <nav className="hidden lg:flex space-x-4 xl:space-x-6">
                <button className="text-gray-700 hover:text-orange-600 transition-colors whitespace-nowrap">
                  <Home className="w-4 h-4 xl:w-5 xl:h-5 inline mr-1" />
                  ホーム
                </button>
                <button className="text-gray-700 hover:text-orange-600 transition-colors hidden xl:block whitespace-nowrap">
                  国内
                </button>
                <button className="text-gray-700 hover:text-orange-600 transition-colors hidden xl:block whitespace-nowrap">
                  国際
                </button>
                <button className="text-gray-700 hover:text-orange-600 transition-colors whitespace-nowrap">
                  経済
                </button>
                <button className="text-gray-700 hover:text-orange-600 transition-colors whitespace-nowrap">
                  スポーツ
                </button>
              </nav>
            </div>

            {/* Right section */}
            <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
              <button className="hidden xl:flex items-center space-x-2 text-gray-700 hover:text-orange-600 transition-colors px-3 py-2 rounded-lg hover:bg-gray-50 whitespace-nowrap">
                <User className="w-4 h-4" />
                <span className="text-sm">ログイン</span>
              </button>
              <button className="hidden lg:block xl:hidden p-2 hover:bg-gray-100 rounded-lg">
                <User className="w-4 h-4 text-gray-700" />
              </button>
              <div className="relative hidden lg:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="記事を検索"
                  className="bg-gray-100 pl-10 pr-4 py-2 w-48 xl:w-64 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                />
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg lg:hidden">
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Article */}
          <article className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Article Header */}
              <div className="p-6 pb-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  {articleData.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm font-medium whitespace-nowrap"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                  {articleData.title}
                </h1>

                <div className="flex items-center text-sm text-gray-600 space-x-4 mb-6">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {articleData.date}
                  </div>
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    {articleData.author}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    読了時間：{articleData.readTime}分
                  </div>
                </div>

                {/* Social Share Buttons */}
                <div className="flex items-center space-x-2 mb-6 pb-6 border-b">
                  <button className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline">シェア</span>
                  </button>
                  <button className="flex items-center space-x-2 bg-sky-500 text-white px-3 py-2 rounded-lg hover:bg-sky-600 transition-colors">
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline">ツイート</span>
                  </button>
                </div>
              </div>

              {/* Main Image */}
              <div
                className="relative h-96 cursor-pointer group"
                onClick={() => handleImageClick(articleData.image)}
              >
                <Image
                  src={articleData.image}
                  alt={articleData.title}
                  fill
                  className="object-cover group-hover:opacity-95 transition-opacity"
                  unoptimized
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <p className="text-white text-sm">{articleData.caption}</p>
                </div>
              </div>

              {/* Article Content */}
              <div className="p-6">
                <div className="prose prose-lg max-w-none">
                  {articleData.content.split('\n\n').map((paragraph, idx) => (
                    <p key={idx} className="text-gray-800 leading-relaxed mb-4 text-justify">
                      {paragraph.trim()}
                    </p>
                  ))}
                </div>

                {/* Article Footer */}
                <div className="mt-8 pt-6 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button className="flex items-center space-x-2 text-gray-600 hover:text-orange-600 transition-colors">
                        <MessageCircle className="w-5 h-5" />
                        <span>コメント</span>
                      </button>
                      <button className="flex items-center space-x-2 text-gray-600 hover:text-orange-600 transition-colors">
                        <Share2 className="w-5 h-5" />
                        <span>共有</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            {/* Related Articles */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                関連記事
                <ChevronRight className="w-5 h-5 ml-2 text-orange-600" />
              </h2>

              <div className="space-y-4">
                {articleData.relatedArticles.map((article, idx) => (
                  <div key={idx} className="flex space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <div
                      className="w-20 h-16 relative flex-shrink-0 rounded-lg overflow-hidden cursor-pointer"
                      onClick={() => handleImageClick(article.image)}
                    >
                      <Image
                        src={article.image}
                        alt={article.title}
                        fill
                        className="object-cover hover:opacity-90 transition-opacity"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {article.abstract}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {article.tags.slice(0, 2).map((tag, tagIdx) => (
                          <span
                            key={tagIdx}
                            className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs whitespace-nowrap"
                          >
                            {tag}
                          </span>
                        ))}
                        {article.tags.length > 2 && (
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            +{article.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Popular News */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">今週の人気記事</h2>
              <div className="space-y-3">
                {[
                  'AI技術が変える医療現場の最前線',
                  '宇宙開発競争：民間企業の挑戦',
                  '次世代エネルギー革命の全貌',
                  '地方創生：成功事例から学ぶヒント',
                  '働き方改革：企業の実践例'
                ].map((title, idx) => (
                  <div key={idx} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 transition-colors cursor-pointer">
                    <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-gray-700 hover:text-orange-600 transition-colors line-clamp-2">
                      {title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-12">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-bold text-orange-400 mb-4">夕日新聞</h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                信頼できるニュースと深い洞察を提供し、読者の皆様に価値ある情報をお届けします。
                正確で公正な報道を通じて、社会の発展に貢献してまいります。
              </p>
              <div className="flex space-x-4">
                <button className="text-gray-400 hover:text-blue-400 transition-colors">
                  <span className="sr-only">Facelook</span>
                  <div className="w-6 h-6 bg-blue-600 rounded-sm flex items-center justify-center text-white text-xs font-bold">
                    f
                  </div>
                </button>
                <button className="text-gray-400 hover:text-orange-400 transition-colors">
                  <span className="sr-only">MeTube</span>
                  <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center text-white text-xs font-bold">
                    ▶
                  </div>
                </button>
                <button className="text-gray-400 hover:text-gray-200 transition-colors">
                  <span className="sr-only">Z</span>
                  <div className="w-6 h-6 bg-black rounded flex items-center justify-center text-white text-sm font-bold">
                    Z
                  </div>
                </button>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4 whitespace-nowrap">カテゴリ</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="text-gray-300 hover:text-white transition-colors whitespace-nowrap cursor-pointer">国内ニュース</span></li>
                <li><span className="text-gray-300 hover:text-white transition-colors whitespace-nowrap cursor-pointer">国際ニュース</span></li>
                <li><span className="text-gray-300 hover:text-white transition-colors whitespace-nowrap cursor-pointer">経済</span></li>
                <li><span className="text-gray-300 hover:text-white transition-colors whitespace-nowrap cursor-pointer">スポーツ</span></li>
                <li><span className="text-gray-300 hover:text-white transition-colors whitespace-nowrap cursor-pointer">文化・芸術</span></li>
                <li><span className="text-gray-300 hover:text-white transition-colors whitespace-nowrap cursor-pointer">科学・技術</span></li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="font-semibold mb-4 whitespace-nowrap">企業情報</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="text-gray-300 hover:text-white transition-colors whitespace-nowrap cursor-pointer">About</span></li>
                <li><span className="text-gray-300 hover:text-white transition-colors whitespace-nowrap cursor-pointer">会社概要</span></li>
                <li><span className="text-gray-300 hover:text-white transition-colors whitespace-nowrap cursor-pointer">採用情報</span></li>
                <li><span className="text-gray-300 hover:text-white transition-colors whitespace-nowrap cursor-pointer">広告掲載</span></li>
                <li><span className="text-gray-300 hover:text-white transition-colors whitespace-nowrap cursor-pointer">お問い合わせ</span></li>
                <li><span className="text-gray-300 hover:text-white transition-colors whitespace-nowrap cursor-pointer">サイトマップ</span></li>
              </ul>
            </div>
          </div>

          {/* Bottom Links */}
          <div className="border-t border-gray-700 mt-8 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex flex-wrap justify-center md:justify-start space-x-4 lg:space-x-6 text-sm">
                <span className="text-gray-300 hover:text-white transition-colors whitespace-nowrap cursor-pointer">個人情報保護方針</span>
                <span className="text-gray-300 hover:text-white transition-colors whitespace-nowrap cursor-pointer">利用規約</span>
                <span className="text-gray-300 hover:text-white transition-colors whitespace-nowrap cursor-pointer">Cookie設定</span>
                <span className="text-gray-300 hover:text-white transition-colors whitespace-nowrap cursor-pointer">免責事項</span>
              </div>
              <div className="text-sm text-gray-400 whitespace-nowrap">
                © 2025 夕日新聞. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Image Modal */}
      {selectedImage && (
        <>
          <div
            className="fixed inset-0 bg-black/70 z-40"
            onClick={handleCloseModal}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="relative pointer-events-auto">
              <button
                className="absolute -top-10 right-0 text-white bg-black/50 rounded-full p-2 hover:bg-black/70"
                onClick={handleCloseModal}
              >
                <X className="w-6 h-6" />
              </button>
              <Image
                src={selectedImage}
                alt="拡大画像"
                width={1000}
                height={700}
                className="object-contain max-w-[90vw] max-h-[80vh] w-auto h-auto rounded"
                unoptimized
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};