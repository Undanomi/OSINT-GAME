'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { parseMarkdown } from '@/lib/markdown';
import { ChiitaContent } from '@/types/chiita';
import { UnifiedSearchResult } from '@/types/search';
import { validateChiitaContent } from '@/actions/chiitaValidation';
import {
  Clock, Calendar, User, Share2, Heart,
  MessageCircle, ChevronRight,
  Search, Menu, Home, Code, BookOpen
} from 'lucide-react';

interface ChiitaPageProps {
  documentId: string;
  initialData: UnifiedSearchResult;
}


// Chiitaのマークダウンコンテンツレンダラー
const ChiitaMarkdownContent: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className="prose prose-lg max-w-none">
      {parseMarkdown(content)}
    </div>
  );
};

export const ChiitaPage: React.FC<ChiitaPageProps> = ({ documentId, initialData }) => {
  const [articleData, setArticleData] = useState<ChiitaContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(42);

  const handleLike = useCallback(() => {
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
  }, [liked]);

  useEffect(() => {
    const fetchArticleData = async () => {
      try {
        console.log('Loading initial data for document ID:', documentId);
        const searchResult = initialData;
        console.log('Raw search result:', searchResult);

        if (searchResult.template !== 'ChiitaPage') {
          console.error('Invalid template for Chiita:', searchResult.template);
          throw new Error('Invalid template');
        }

        const data = await validateChiitaContent(searchResult.content);
        console.log('Validated data from Firestore:', data);

        // gs:// URLをHTTPS URLに並列変換
        const urlConversionPromises: Promise<void>[] = [];

        // 各章の画像URL変換（並列）
        data.content.chapters.forEach((chapter, index) => {
          if (chapter.image?.startsWith('gs://')) {
            console.log('Converting chapter image:', chapter.image);
            urlConversionPromises.push(
              getDownloadURL(ref(storage, chapter.image)).then(url => {
                chapter.image = url;
                console.log(`Converted chapter ${index} image to:`, url);
              })
            );
          }
        });

        // すべてのURL変換を並列実行
        await Promise.all(urlConversionPromises);

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
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600"></div>
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
              <div className="flex items-center mr-8">
                <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center mr-3">
                  <Code className="w-5 h-5 text-white" />
                </div>
                <div className="text-2xl font-bold text-pink-600" style={{ fontFamily: 'monospace' }}>
                  Chiita
                </div>
              </div>
              <nav className="hidden lg:flex space-x-6">
                <button className="text-gray-700 hover:text-pink-600 transition-colors flex items-center">
                  <Home className="w-4 h-4 mr-1" />
                  ホーム
                </button>
                <button className="text-gray-700 hover:text-pink-600 transition-colors flex items-center">
                  <BookOpen className="w-4 h-4 mr-1" />
                  記事
                </button>
                <button className="text-gray-700 hover:text-pink-600 transition-colors">
                  トレンド
                </button>
              </nav>
            </div>

            {/* Right section */}
            <div className="flex items-center space-x-4">
              <div className="relative hidden lg:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="記事を検索"
                  className="bg-gray-100 pl-10 pr-4 py-2 w-64 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                />
              </div>
              <button className="hidden lg:flex items-center space-x-2 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors">
                <span className="text-sm">投稿</span>
              </button>
              <button className="flex items-center space-x-2 text-gray-700 hover:text-pink-600 transition-colors">
                <User className="w-4 h-4" />
                <span className="hidden xl:inline text-sm">ログイン</span>
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg lg:hidden">
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Profile Section */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white text-lg font-medium">
                    {articleData.author.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg">{articleData.author}</h3>
                  <p className="text-sm text-gray-600">Chiita 編集者</p>
                </div>
                <button className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors text-sm">
                  フォロー
                </button>
              </div>
            </div>
          </div>

          {/* Main Article */}
          <article className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Article Header */}
              <div className="p-6 pb-4 border-b border-gray-100">
                <div className="flex flex-wrap gap-2 mb-4">
                  {articleData.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                  {articleData.title}
                </h1>

                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center mr-2">
                        <span className="text-white text-sm font-medium">
                          {articleData.author.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900">{articleData.author}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {articleData.publicDate}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      約{articleData.readTime}分
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleLike}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      liked
                        ? 'bg-red-50 text-red-600 border border-red-200'
                        : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                    <span className="text-sm">{likeCount}</span>
                  </button>
                  <button className="flex items-center space-x-2 bg-gray-50 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                    <Share2 className="w-4 h-4" />
                    <span className="text-sm">シェア</span>
                  </button>
                </div>
              </div>

              {/* Article Content */}
              <div className="p-6">
                {articleData.content.chapters.map((chapter, index) => (
                  <section key={index} className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                      {chapter.title}
                    </h2>

                    <div className="text-gray-800 leading-relaxed mb-4">
                      <ChiitaMarkdownContent content={chapter.content} />
                    </div>

                    {chapter.image && (
                      <div className="my-6">
                        <Image
                          src={chapter.image}
                          alt={chapter.title}
                          width={800}
                          height={400}
                          className="rounded-lg object-cover w-full"
                          unoptimized
                        />
                      </div>
                    )}
                  </section>
                ))}
              </div>

              {/* Comments Section */}
              <div className="border-t border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2 text-pink-600" />
                  コメント ({articleData.comments.length})
                </h3>

                <div className="space-y-4">
                  {articleData.comments.map((comment, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center mr-2">
                          <span className="text-white text-xs font-medium">
                            {comment.user.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900 mr-2">{comment.user}</span>
                        <span className="text-sm text-gray-500">{comment.date}</span>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">{comment.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>

          {/* Sidebar - Chapter List */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-20">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                チャプター
                <BookOpen className="w-4 h-4 ml-2 text-pink-600" />
              </h2>

              <div className="space-y-3">
                {articleData.content.chapters.map((chapter, idx) => (
                  <div key={idx} className="p-3 rounded-lg hover:bg-pink-50 transition-colors cursor-pointer border border-gray-100">
                    <h3 className="font-medium text-sm text-gray-900 line-clamp-2">
                      {idx + 1}. {chapter.title}
                    </h3>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {/* Related Articles at Bottom */}
        <div className="mt-12">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              関連記事
              <ChevronRight className="w-5 h-5 ml-2 text-pink-600" />
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {['React Router v6の新機能', 'TypeScript 5.0の変更点', 'Next.js 13 App Directory'].map((title, idx) => (
                <div key={idx} className="p-4 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-gray-100">
                  <div className="w-full h-32 bg-gradient-to-r from-pink-100 to-pink-200 rounded-lg mb-3 flex items-center justify-center">
                    <div className="w-12 h-12 bg-pink-500 rounded-lg flex items-center justify-center">
                      <Code className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                    {title}
                  </h3>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      約5分
                    </div>
                    <div className="flex items-center">
                      <Heart className="w-4 h-4 mr-1" />
                      {Math.floor(Math.random() * 100) + 10}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};