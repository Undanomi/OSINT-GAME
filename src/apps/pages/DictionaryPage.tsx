'use client';

import React, { useEffect, useState } from 'react';
import { Book, BookOpen, Lightbulb, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { DictionaryContent } from '@/types/dictionary';
import { UnifiedSearchResult } from '@/types/search';
import { validateDictionaryContent } from '@/actions/dictionaryValidation';

interface DictionaryPageProps {
  documentId: string;
  initialData: UnifiedSearchResult;
}

export const DictionaryPage: React.FC<DictionaryPageProps> = ({ documentId, initialData }) => {
  const [dictionaryData, setDictionaryData] = useState<DictionaryContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDictionaryData = async () => {
      try {
        const searchResult = initialData;

        if (searchResult.template !== 'DictionaryPage') {
          throw new Error('Invalid template');
        }

        const data = await validateDictionaryContent(searchResult.content);
        setDictionaryData(data);
      } catch {
        setDictionaryData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDictionaryData();
  }, [documentId, initialData]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-blue-50">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dictionaryData) {
    return (
      <div className="flex items-center justify-center h-screen bg-blue-50">
        <div className="text-xl text-gray-600">辞書データが見つかりません</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-blue-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Book className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">日本語辞書Un</h1>
            </div>
            <nav className="flex space-x-6 text-sm">
              <button className="text-gray-600 hover:text-gray-900">ホーム</button>
              <button className="text-gray-600 hover:text-gray-900">カテゴリー</button>
              <button className="text-gray-600 hover:text-gray-900">新着</button>
            </nav>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* 見出し語カード */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          {/* 見出し語 */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{dictionaryData.term}</h1>
            <div className="flex items-center space-x-4 text-gray-600">
              <span className="text-lg">【{dictionaryData.reading}】</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {dictionaryData.partOfSpeech}
              </span>
            </div>
          </div>

          {/* 定義・意味 */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <BookOpen className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-xl font-bold text-gray-900">意味</h2>
            </div>
            <ol className="space-y-3">
              {dictionaryData.definitions.map((definition, index) => (
                <li key={index} className="flex">
                  <span className="text-blue-600 font-bold mr-3">{index + 1}.</span>
                  <span className="text-gray-700 leading-relaxed">{definition}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* 語源 */}
          <div className="mb-8 bg-amber-50 rounded-lg p-6 border border-amber-200">
            <div className="flex items-center mb-3">
              <Lightbulb className="w-5 h-5 text-amber-600 mr-2" />
              <h2 className="text-lg font-bold text-gray-900">語源</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">{dictionaryData.etymology}</p>
          </div>

          {/* 使用例 */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-blue-600 pl-3">
              使用例
            </h2>
            <div className="space-y-4">
              {dictionaryData.usageExamples.map((usage, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-900 font-medium mb-2">「{usage.example}」</p>
                  <p className="text-gray-600 text-sm pl-4 border-l-2 border-gray-300">
                    {usage.meaning}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 関連用語 */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <LinkIcon className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-xl font-bold text-gray-900">関連用語</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {dictionaryData.relatedTerms.map((related, index) => (
                <div
                  key={index}
                  className="bg-blue-50 rounded-lg p-3 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900 font-medium">{related.term}</span>
                    <span className="text-xs text-blue-600 bg-white px-2 py-1 rounded">
                      {related.relation}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 補足・注意事項 */}
          {dictionaryData.notes && (
            <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">補足・注意事項</h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {dictionaryData.notes}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ページフッター */}
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <p className="text-gray-600 text-sm mb-3">
            この用語について、さらに詳しく知りたい方は関連用語もご覧ください。
          </p>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            他の用語を検索
          </button>
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-gray-800 text-white mt-16 py-8">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-sm">© 2025 日本語辞書Un. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
};
