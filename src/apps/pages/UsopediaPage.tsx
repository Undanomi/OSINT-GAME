'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { parseMarkdown, parseInlineMarkdown } from '@/lib/markdown';
import { UsopediaContent } from '@/types/usopedia';
import { UnifiedSearchResult } from '@/types/search';
import { validateUsopediaContent } from '@/actions/usopediaValidation';
import {
  Globe, Search, Menu, History, BookOpen, ExternalLink,
  User, Edit, Share2, Languages, Info
} from 'lucide-react';

interface UsopediaPageProps {
  documentId: string;
  initialData: UnifiedSearchResult;
}

export const UsopediaPage: React.FC<UsopediaPageProps> = ({ documentId, initialData }) => {
  const [articleData, setArticleData] = useState<UsopediaContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticleData = async () => {
      try {
        console.log('Loading initial data for document ID:', documentId);
        const searchResult = initialData;
        console.log('Raw search result:', searchResult);

        if (searchResult.template !== 'UsopediaPage') {
          console.error('Invalid template for Usopedia:', searchResult.template);
          throw new Error('Invalid template');
        }

        const data = await validateUsopediaContent(searchResult.content);
        console.log('Validated data from Firestore:', data);

        // 画像URL変換（Firebase Storage対応）
        for (const chapter of data.content.chapters) {
          if (chapter.image?.startsWith('gs://')) {
            console.log('Converting chapter image:', chapter.image);
            chapter.image = await getDownloadURL(ref(storage, chapter.image));
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b-2 border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Left section */}
            <div className="flex items-center">
              <div className="flex items-center mr-8">
                <div className="w-8 h-8 bg-blue-600 rounded-sm flex items-center justify-center mr-3">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div className="text-xl font-bold text-gray-900" style={{ fontFamily: 'serif' }}>
                  Usopedia
                </div>
              </div>
            </div>

            {/* Right section */}
            <div className="flex items-center space-x-1">
              <button className="hidden lg:flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors px-2 py-1 text-sm">
                <Languages className="w-4 h-4" />
                <span>日本語</span>
              </button>
              <button className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors px-2 py-1 text-sm">
                <User className="w-4 h-4" />
                <span className="hidden xl:inline">ログイン</span>
              </button>
              <div className="relative hidden lg:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Usopediaを検索"
                  className="border border-gray-300 pl-10 pr-4 py-1.5 w-48 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button className="p-2 hover:bg-gray-100 rounded lg:hidden">
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center text-sm text-gray-600">
            <span className="hover:text-blue-600 cursor-pointer">メインページ</span>
            <span className="mx-2">›</span>
            <span className="text-gray-900">{articleData.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Sidebar - Table of Contents */}
          <aside className="lg:col-span-1 py-6">
            <div className="bg-gray-50 border border-gray-200 rounded mb-6 sticky top-20">
              <div className="bg-blue-600 text-white px-4 py-2 text-sm font-medium rounded-t">
                目次
              </div>
              <div className="p-4">
                <ul className="space-y-2">
                  {articleData.content.chapters.map((chapter, idx) => (
                    <li key={idx}>
                      <a
                        href={`#section-${idx}`}
                        className="text-blue-600 hover:underline text-sm block py-1"
                      >
                        {idx + 1}. {chapter.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <article className="lg:col-span-3 py-6">
            {/* Article Header */}
            <div className="mb-6">
              <h1 className="text-4xl font-bold text-gray-900 mb-4 font-serif leading-tight">
                {articleData.title}
              </h1>

              <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
                <div className="text-sm text-gray-600">
                  最終更新: {articleData.updateDateHistory[articleData.updateDateHistory.length - 1]}
                </div>
                <div className="flex items-center space-x-4">
                  <button className="flex items-center space-x-1 text-blue-600 hover:underline text-sm">
                    <Edit className="w-4 h-4" />
                    <span>編集</span>
                  </button>
                  <button className="flex items-center space-x-1 text-blue-600 hover:underline text-sm">
                    <History className="w-4 h-4" />
                    <span>履歴</span>
                  </button>
                  <button className="flex items-center space-x-1 text-blue-600 hover:underline text-sm">
                    <Share2 className="w-4 h-4" />
                    <span>共有</span>
                  </button>
                </div>
              </div>

              {/* Info box */}
              <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-700">
                    この記事は <strong>{articleData.author}</strong> によって {articleData.publicDate} に作成されました。
                    情報の正確性については、各参考文献をご確認ください。
                  </div>
                </div>
              </div>
            </div>

            {/* Article Content */}
            <div className="prose prose-lg max-w-none">
              {articleData.content.chapters.map((chapter, index) => (
                <section key={index} className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-blue-600 pb-2 font-serif">
                    {chapter.title}
                  </h2>

                  <div className="text-gray-800 leading-relaxed mb-4 text-justify">
                    {chapter.content.split('\n\n').map((paragraph, pIdx) => (
                      <p key={pIdx} className="mb-4">
                        {parseInlineMarkdown(paragraph)}
                      </p>
                    ))}
                  </div>

                  {chapter.image && (
                    <div className="my-6 border border-gray-200 rounded overflow-hidden">
                      <Image
                        src={chapter.image}
                        alt={chapter.title}
                        width={800}
                        height={400}
                        className="w-full object-cover"
                        unoptimized
                      />
                      <div className="bg-gray-50 px-4 py-2 text-sm text-gray-600 border-t border-gray-200">
                        図: {chapter.title}
                      </div>
                    </div>
                  )}

                  {chapter.table && (
                    <div className="my-6 border border-gray-200 rounded overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 border-b border-gray-200">
                        表: {chapter.title}に関するデータ
                      </div>
                      <div className="p-4">
                        {parseMarkdown(chapter.table)}
                      </div>
                    </div>
                  )}
                </section>
              ))}
            </div>

            {/* References Section */}
            <div className="mt-12 border-t border-gray-200 pt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b-2 border-blue-600 pb-2 font-serif">
                参考文献
              </h2>
              <ol className="space-y-2">
                {articleData.references.map((ref, index) => (
                  <li key={index} className="text-sm text-gray-700">
                    <span className="font-medium">{index + 1}.</span> {ref.title}. {ref.publisher}, {ref.date}.
                  </li>
                ))}
              </ol>
            </div>

            {/* Categories Section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                <span className="font-medium">カテゴリ:</span>
                <span className="ml-2 text-blue-600 hover:underline cursor-pointer">人物</span>
                <span className="mx-1">|</span>
                <span className="text-blue-600 hover:underline cursor-pointer">科学</span>
                <span className="mx-1">|</span>
                <span className="text-blue-600 hover:underline cursor-pointer">情報技術</span>
              </div>
            </div>
          </article>

          {/* Right Sidebar */}
          <aside className="lg:col-span-1 py-6">
            {/* Tools Box */}
            <div className="bg-gray-50 border border-gray-200 rounded mb-6">
              <div className="bg-gray-200 text-gray-800 px-4 py-2 text-sm font-medium rounded-t">
                ツール
              </div>
              <div className="p-4 space-y-2">
                <button className="flex items-center space-x-2 text-blue-600 hover:underline text-sm w-full text-left">
                  <ExternalLink className="w-4 h-4" />
                  <span>リンク元</span>
                </button>
                <button className="flex items-center space-x-2 text-blue-600 hover:underline text-sm w-full text-left">
                  <History className="w-4 h-4" />
                  <span>履歴表示</span>
                </button>
                <button className="flex items-center space-x-2 text-blue-600 hover:underline text-sm w-full text-left">
                  <BookOpen className="w-4 h-4" />
                  <span>PDF として保存</span>
                </button>
                <button className="flex items-center space-x-2 text-blue-600 hover:underline text-sm w-full text-left">
                  <Share2 className="w-4 h-4" />
                  <span>引用</span>
                </button>
              </div>
            </div>

            {/* Related Contents */}
            <div className="bg-gray-50 border border-gray-200 rounded">
              <div className="bg-gray-200 text-gray-800 px-4 py-2 text-sm font-medium rounded-t">
                関連項目
              </div>
              <div className="p-4 space-y-2">
                {articleData.relatedContents.map((content, index) => (
                  <a key={index} href="#" className="block text-blue-600 hover:underline text-sm">
                    • {content.title}
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-gray-900 mb-4">Usopedia</h3>
              <p className="text-sm text-gray-600">
                自由に利用できる百科事典。誰でも編集に参加できます。
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">参加する</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-blue-600">記事を編集</a></li>
                <li><a href="#" className="hover:text-blue-600">新規記事作成</a></li>
                <li><a href="#" className="hover:text-blue-600">コミュニティ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">ヘルプ</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-blue-600">利用案内</a></li>
                <li><a href="#" className="hover:text-blue-600">編集の仕方</a></li>
                <li><a href="#" className="hover:text-blue-600">よくある質問</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">プロジェクト</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-blue-600">プライバシーポリシー</a></li>
                <li><a href="#" className="hover:text-blue-600">免責事項</a></li>
                <li><a href="#" className="hover:text-blue-600">著作権について</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-4 text-center text-sm text-gray-600">
            <p>この記事は <a href="#" className="text-blue-600 hover:underline">Creative Commons</a> ライセンスの下で提供されています。</p>
          </div>
        </div>
      </footer>
    </div>
  );
};