'use client';

import React, { useEffect, useState } from 'react';
import { Star, Sparkles, Clover, TrendingUp, Heart, Users, Home } from 'lucide-react';
import { SurnameFortuneContent } from '@/types/surnameFortune';
import { UnifiedSearchResult } from '@/types/search';
import { validateSurnameFortuneContent } from '@/actions/surnameFortuneValidation';

interface SurnameFortunePageProps {
  documentId: string;
  initialData: UnifiedSearchResult;
}

export const SurnameFortunePage: React.FC<SurnameFortunePageProps> = ({ documentId, initialData }) => {
  const [fortuneData, setFortuneData] = useState<SurnameFortuneContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFortuneData = async () => {
      try {
        const searchResult = initialData;

        if (searchResult.template !== 'SurnameFortunePage') {
          throw new Error('Invalid template');
        }

        const data = await validateSurnameFortuneContent(searchResult.content);
        setFortuneData(data);
      } catch {
        setFortuneData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchFortuneData();
  }, [documentId, initialData]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-blue-100';
    if (score >= 40) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-purple-50">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-6 h-6 text-purple-600 animate-pulse" />
          <span className="text-purple-600">占い中...</span>
        </div>
      </div>
    );
  }

  if (!fortuneData) {
    return (
      <div className="flex items-center justify-center h-screen bg-purple-50">
        <div className="text-xl text-gray-600">占いデータが見つかりません</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 via-pink-50 to-yellow-50">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes twinkle {
          0%, 100% {
            opacity: 0.2;
            transform: scale(0.8) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1.3) rotate(180deg);
          }
        }
      `}} />

      {/* ヘッダー */}
      <header className="bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 text-white shadow-lg relative z-10 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <Sparkles
              key={`header-sparkle-${i}`}
              className="absolute text-white opacity-40"
              size={4 + Math.random() * 10}
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `twinkle ${1.5 + Math.random() * 2.5}s ease-in-out ${Math.random() * 2}s infinite`,
              }}
            />
          ))}
        </div>
        <div className="max-w-5xl mx-auto px-6 py-8 relative z-10">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <Sparkles className="w-8 h-8" />
              <h1 className="text-4xl font-bold">名字占いの館</h1>
              <Sparkles className="w-8 h-8" />
            </div>
            <p className="text-sm opacity-90">あなたの名字に秘められた運命を占います</p>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-5xl mx-auto px-6 py-10 relative">
        {/* キラキラ星背景 */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden -mx-6 -my-10">
          {[...Array(50)].map((_, i) => (
            <Sparkles
              key={`sparkle-${i}`}
              className="absolute text-yellow-400 opacity-70"
              size={6 + Math.random() * 12}
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `twinkle ${1 + Math.random() * 3}s ease-in-out ${Math.random() * 3}s infinite`,
              }}
            />
          ))}
        </div>

        {/* 名字カード */}
        <div className="bg-white rounded-3xl shadow-2xl p-10 mb-8 border-4 border-purple-200 relative z-10">
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-full text-sm font-bold mb-4">
              占い結果
            </div>
            <h2 className="text-6xl font-bold text-gray-900 mb-2">{fortuneData.surname}</h2>
            <p className="text-2xl text-gray-600">（{fortuneData.reading}）</p>
          </div>

          {/* 総合運勢スコア */}
          <div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl p-8 mb-8 border-2 border-yellow-300">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Star className="w-8 h-8 text-yellow-600" />
                <h3 className="text-2xl font-bold text-gray-900">総合運勢</h3>
                <Star className="w-8 h-8 text-yellow-600" />
              </div>
              <div className={`text-7xl font-bold ${getScoreColor(fortuneData.totalScore)} mb-2`}>
                {fortuneData.totalScore}
              </div>
              <div className="flex justify-center space-x-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-8 h-8 ${
                      i < Math.floor(fortuneData.totalScore / 20) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-gray-700 font-medium">
                {fortuneData.totalScore >= 80 && '大吉！素晴らしい運勢です'}
                {fortuneData.totalScore >= 60 && fortuneData.totalScore < 80 && '吉！良い運勢です'}
                {fortuneData.totalScore >= 40 && fortuneData.totalScore < 60 && '中吉！まずまずの運勢です'}
                {fortuneData.totalScore < 40 && '小吉！これから運が向いてきます'}
              </p>
            </div>
          </div>

          {/* 名字の由来と意味 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
              <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center">
                <Home className="w-5 h-5 mr-2" />
                名字の由来
              </h3>
              <p className="text-gray-700 leading-relaxed">{fortuneData.origin}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
              <h3 className="text-lg font-bold text-green-900 mb-3 flex items-center">
                <Sparkles className="w-5 h-5 mr-2" />
                名字の意味
              </h3>
              <p className="text-gray-700 leading-relaxed">{fortuneData.meaning}</p>
            </div>
          </div>

          {/* ラッキーアイテム */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-pink-100 to-red-100 rounded-xl p-6 text-center border-2 border-pink-200">
              <Clover className="w-10 h-10 mx-auto mb-2 text-pink-600" />
              <h3 className="text-sm font-bold text-gray-600 mb-2">ラッキーカラー</h3>
              <p className="text-2xl font-bold text-gray-900">{fortuneData.luckyColor}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl p-6 text-center border-2 border-blue-200">
              <Star className="w-10 h-10 mx-auto mb-2 text-blue-600" />
              <h3 className="text-sm font-bold text-gray-600 mb-2">ラッキーナンバー</h3>
              <p className="text-2xl font-bold text-gray-900">{fortuneData.luckyNumber}</p>
            </div>
            <div className="bg-gradient-to-br from-green-100 to-teal-100 rounded-xl p-6 text-center border-2 border-green-200">
              <Sparkles className="w-10 h-10 mx-auto mb-2 text-green-600" />
              <h3 className="text-sm font-bold text-gray-600 mb-2">ラッキーアイテム</h3>
              <p className="text-2xl font-bold text-gray-900">{fortuneData.luckyItem}</p>
            </div>
          </div>
        </div>

        {/* カテゴリー別運勢 */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8 border-4 border-purple-200 relative z-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center flex items-center justify-center">
            <TrendingUp className="w-8 h-8 mr-3 text-purple-600" />
            カテゴリー別運勢
          </h2>
          <div className="space-y-4">
            {fortuneData.fortuneCategories.map((cat, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900">{cat.category}</h3>
                  <div className={`px-4 py-2 rounded-full ${getScoreBackground(cat.score)} ${getScoreColor(cat.score)} font-bold text-lg`}>
                    {cat.score}点
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                  <div
                    className={`h-3 rounded-full ${
                      cat.score >= 80 ? 'bg-green-500' : cat.score >= 60 ? 'bg-blue-500' : cat.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${cat.score}%` }}
                  ></div>
                </div>
                <p className="text-gray-700">{cat.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 相性診断 */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8 border-4 border-purple-200 relative z-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center flex items-center justify-center">
            <Heart className="w-8 h-8 mr-3 text-pink-600" />
            名字相性診断
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-300">
              <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center">
                <Users className="w-6 h-6 mr-2" />
                相性の良い名字
              </h3>
              <div className="flex flex-wrap gap-2">
                {fortuneData.compatibility.good.map((name, idx) => (
                  <span key={idx} className="px-4 py-2 bg-white text-green-800 font-bold rounded-full border-2 border-green-300">
                    {name}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-300">
              <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
                <Users className="w-6 h-6 mr-2" />
                ゆっくり関係を深めたい名字
              </h3>
              <div className="flex flex-wrap gap-2">
                {fortuneData.compatibility.bad.map((name, idx) => (
                  <span key={idx} className="px-4 py-2 bg-white text-blue-800 font-bold rounded-full border-2 border-blue-300">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 今日のアドバイス */}
        <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl shadow-2xl p-8 border-4 border-purple-300 relative z-10">
          <div className="text-center">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-purple-600" />
            <h2 className="text-3xl font-bold text-gray-900 mb-6">今日のアドバイス</h2>
            <p className="text-xl text-gray-800 leading-relaxed">{fortuneData.advice}</p>
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 text-white py-6 mt-12 relative z-10">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-sm opacity-90">© 2025 名字占いの館. All Rights Reserved.</p>
          <p className="text-xs opacity-75 mt-2">※占い結果はエンターテイメント目的です</p>
        </div>
      </footer>
    </div>
  );
};
