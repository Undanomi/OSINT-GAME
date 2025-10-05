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
    if (score >= 80) return 'text-[#6b8e23]';
    if (score >= 60) return 'text-[#4682b4]';
    if (score >= 40) return 'text-[#daa520]';
    return 'text-[#cd5c5c]';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'bg-[#f0f8e8]';
    if (score >= 60) return 'bg-[#e8f4f8]';
    if (score >= 40) return 'bg-[#fef9e8]';
    return 'bg-[#fef0f0]';
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#faf8f3]">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-6 h-6 text-[#9e8a6f] animate-pulse" />
          <span className="text-[#5a4a3a]">占い中...</span>
        </div>
      </div>
    );
  }

  if (!fortuneData) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#faf8f3]">
        <div className="text-xl text-[#5a4a3a]">占いデータが見つかりません</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f3]">
      {/* ヘッダー */}
      <header className="bg-gradient-to-b from-[#d4a574] via-[#c8a06d] to-[#c49a6c] text-[#5a4a3a] shadow-lg relative z-10 border-b-4 border-[#9e8a6f]">
        {/* 上部装飾ライン */}
        <div className="bg-gradient-to-r from-[#9e8a6f] via-[#b89968] to-[#9e8a6f] h-2"></div>

        <div className="max-w-6xl mx-auto px-6 py-8 relative z-10">
          {/* メインタイトル */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-3">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#9e8a6f] to-transparent"></div>
              <Sparkles className="w-6 h-6 mx-4 text-[#9e8a6f]" />
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#9e8a6f] to-transparent"></div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#3a2a1a] mb-2 tracking-wider">
              名字占い
            </h1>
            <p className="text-base text-[#5a4a3a] mb-3">あなたの名字に秘められた運命を占います</p>
            <div className="flex items-center justify-center">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#9e8a6f] to-transparent"></div>
              <Star className="w-5 h-5 mx-4 text-[#d4a574] fill-[#d4a574]" />
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#9e8a6f] to-transparent"></div>
            </div>
          </div>

          {/* ナビゲーション */}
          <nav className="flex flex-wrap justify-center gap-3 text-sm">
            <button className="px-5 py-2 bg-white/80 hover:bg-white text-[#3a2a1a] font-medium rounded border border-[#d4a574] transition-colors shadow-sm">
              ホーム
            </button>
            <button className="px-5 py-2 bg-white/80 hover:bg-white text-[#3a2a1a] font-medium rounded border border-[#d4a574] transition-colors shadow-sm">
              名字検索
            </button>
            <button className="px-5 py-2 bg-white/80 hover:bg-white text-[#3a2a1a] font-medium rounded border border-[#d4a574] transition-colors shadow-sm">
              相性診断
            </button>
            <button className="px-5 py-2 bg-white/80 hover:bg-white text-[#3a2a1a] font-medium rounded border border-[#d4a574] transition-colors shadow-sm">
              ランキング
            </button>
          </nav>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-5xl mx-auto px-6 py-10 relative">
        {/* 名字カード */}
        <div className="bg-white rounded-lg shadow-lg p-10 mb-8 border border-[#d4a574] relative z-10">
          <div className="text-center mb-8">
            <div className="inline-block bg-[#f1e5a9] text-[#5a4a3a] px-8 py-2 rounded text-sm font-bold mb-4 border border-[#d4a574]">
              占い結果
            </div>
            <h2 className="text-5xl font-bold text-[#3a2a1a] mb-2">{fortuneData.surname}</h2>
            <p className="text-xl text-[#5a4a3a]">（{fortuneData.reading}）</p>
          </div>

          {/* 総合運勢スコア */}
          <div className="bg-[#f1e5a9] rounded-lg p-8 mb-8 border-2 border-[#d4a574]">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-[#3a2a1a] mb-4">総合運勢</h3>
              <div className={`text-6xl font-bold ${getScoreColor(fortuneData.totalScore)} mb-2`}>
                {fortuneData.totalScore}
              </div>
              <div className="flex justify-center space-x-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-7 h-7 ${
                      i < Math.floor(fortuneData.totalScore / 20) ? 'text-[#d4a574] fill-[#d4a574]' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-[#5a4a3a] font-medium text-lg">
                {fortuneData.totalScore >= 80 && '大吉！素晴らしい運勢です'}
                {fortuneData.totalScore >= 60 && fortuneData.totalScore < 80 && '吉！良い運勢です'}
                {fortuneData.totalScore >= 40 && fortuneData.totalScore < 60 && '中吉！まずまずの運勢です'}
                {fortuneData.totalScore < 40 && '小吉！これから運が向いてきます'}
              </p>
            </div>
          </div>

          {/* 名字の由来と意味 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-[#f9f5ed] rounded-lg p-6 border border-[#d4a574]">
              <h3 className="text-lg font-bold text-[#3a2a1a] mb-3 flex items-center">
                <Home className="w-5 h-5 mr-2 text-[#9e8a6f]" />
                名字の由来
              </h3>
              <p className="text-[#5a4a3a] leading-relaxed">{fortuneData.origin}</p>
            </div>
            <div className="bg-[#f9f5ed] rounded-lg p-6 border border-[#d4a574]">
              <h3 className="text-lg font-bold text-[#3a2a1a] mb-3 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-[#9e8a6f]" />
                名字の意味
              </h3>
              <p className="text-[#5a4a3a] leading-relaxed">{fortuneData.meaning}</p>
            </div>
          </div>

          {/* ラッキーアイテム */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-[#fef9f0] rounded-lg p-6 text-center border border-[#d4a574]">
              <Clover className="w-10 h-10 mx-auto mb-2 text-[#9e8a6f]" />
              <h3 className="text-sm font-bold text-[#5a4a3a] mb-2">ラッキーカラー</h3>
              <p className="text-xl font-bold text-[#3a2a1a]">{fortuneData.luckyColor}</p>
            </div>
            <div className="bg-[#fef9f0] rounded-lg p-6 text-center border border-[#d4a574]">
              <Star className="w-10 h-10 mx-auto mb-2 text-[#9e8a6f]" />
              <h3 className="text-sm font-bold text-[#5a4a3a] mb-2">ラッキーナンバー</h3>
              <p className="text-xl font-bold text-[#3a2a1a]">{fortuneData.luckyNumber}</p>
            </div>
            <div className="bg-[#fef9f0] rounded-lg p-6 text-center border border-[#d4a574]">
              <Sparkles className="w-10 h-10 mx-auto mb-2 text-[#9e8a6f]" />
              <h3 className="text-sm font-bold text-[#5a4a3a] mb-2">ラッキーアイテム</h3>
              <p className="text-xl font-bold text-[#3a2a1a]">{fortuneData.luckyItem}</p>
            </div>
          </div>
        </div>

        {/* カテゴリー別運勢 */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8 border border-[#d4a574] relative z-10">
          <h2 className="text-2xl font-bold text-[#3a2a1a] mb-6 text-center flex items-center justify-center">
            <TrendingUp className="w-7 h-7 mr-3 text-[#9e8a6f]" />
            カテゴリー別運勢
          </h2>
          <div className="space-y-4">
            {fortuneData.fortuneCategories.map((cat, index) => (
              <div key={index} className="border border-[#d4a574] rounded-lg p-5 bg-[#faf8f3] hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-[#3a2a1a]">{cat.category}</h3>
                  <div className={`px-4 py-2 rounded ${getScoreBackground(cat.score)} ${getScoreColor(cat.score)} font-bold text-lg border border-[#d4a574]`}>
                    {cat.score}点
                  </div>
                </div>
                <div className="w-full bg-[#e8e0d0] rounded-full h-3 mb-3">
                  <div
                    className={`h-3 rounded-full ${
                      cat.score >= 80 ? 'bg-[#8fbc8f]' : cat.score >= 60 ? 'bg-[#87ceeb]' : cat.score >= 40 ? 'bg-[#f0e68c]' : 'bg-[#dda0a0]'
                    }`}
                    style={{ width: `${cat.score}%` }}
                  ></div>
                </div>
                <p className="text-[#5a4a3a]">{cat.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 相性診断 */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8 border border-[#d4a574] relative z-10">
          <h2 className="text-2xl font-bold text-[#3a2a1a] mb-6 text-center flex items-center justify-center">
            <Heart className="w-7 h-7 mr-3 text-[#9e8a6f]" />
            名字相性診断
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#f9f5ed] rounded-lg p-6 border border-[#d4a574]">
              <h3 className="text-lg font-bold text-[#3a2a1a] mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-[#9e8a6f]" />
                相性の良い名字
              </h3>
              <div className="flex flex-wrap gap-2">
                {fortuneData.compatibility.good.map((name, idx) => (
                  <span key={idx} className="px-4 py-2 bg-white text-[#3a2a1a] font-bold rounded border border-[#d4a574]">
                    {name}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-[#f9f5ed] rounded-lg p-6 border border-[#d4a574]">
              <h3 className="text-lg font-bold text-[#3a2a1a] mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-[#9e8a6f]" />
                ゆっくり関係を深めたい名字
              </h3>
              <div className="flex flex-wrap gap-2">
                {fortuneData.compatibility.bad.map((name, idx) => (
                  <span key={idx} className="px-4 py-2 bg-white text-[#3a2a1a] font-bold rounded border border-[#d4a574]">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 今日のアドバイス */}
        <div className="bg-[#f1e5a9] rounded-lg shadow-lg p-8 border-2 border-[#d4a574] relative z-10">
          <div className="text-center">
            <Sparkles className="w-10 h-10 mx-auto mb-4 text-[#9e8a6f]" />
            <h2 className="text-2xl font-bold text-[#3a2a1a] mb-6">今日のアドバイス</h2>
            <p className="text-lg text-[#5a4a3a] leading-relaxed">{fortuneData.advice}</p>
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-gradient-to-b from-[#c49a6c] via-[#b8906a] to-[#a88560] text-[#3a2a1a] mt-12 relative z-10 border-t-4 border-[#9e8a6f] shadow-2xl">
        {/* 上部装飾ライン */}
        <div className="bg-gradient-to-r from-[#9e8a6f] via-[#b89968] to-[#9e8a6f] h-2"></div>

        <div className="max-w-6xl mx-auto px-6 py-10">
          {/* メインフッターコンテンツ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* サイト情報 */}
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-[#9e8a6f]" />
                名字占い
              </h3>
              <p className="text-sm text-[#5a4a3a] leading-relaxed mb-3">
                あなたの名字に秘められた運命を詳しく占います。由来、意味、運勢まで完全網羅。
              </p>
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-[#d4a574] fill-[#d4a574]" />
                <Star className="w-4 h-4 text-[#d4a574] fill-[#d4a574]" />
                <Star className="w-4 h-4 text-[#d4a574] fill-[#d4a574]" />
                <Star className="w-4 h-4 text-[#d4a574] fill-[#d4a574]" />
                <Star className="w-4 h-4 text-[#d4a574] fill-[#d4a574]" />
              </div>
            </div>

            {/* クイックリンク */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-[#3a2a1a]">メニュー</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <button className="text-[#5a4a3a] hover:text-[#3a2a1a] hover:underline transition-colors flex items-center">
                    <Home className="w-4 h-4 mr-2" />
                    ホーム
                  </button>
                </li>
                <li>
                  <button className="text-[#5a4a3a] hover:text-[#3a2a1a] hover:underline transition-colors flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    名字検索
                  </button>
                </li>
                <li>
                  <button className="text-[#5a4a3a] hover:text-[#3a2a1a] hover:underline transition-colors flex items-center">
                    <Heart className="w-4 h-4 mr-2" />
                    相性診断
                  </button>
                </li>
                <li>
                  <button className="text-[#5a4a3a] hover:text-[#3a2a1a] hover:underline transition-colors flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    人気ランキング
                  </button>
                </li>
              </ul>
            </div>

            {/* お知らせ */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-[#3a2a1a]">ご利用案内</h3>
              <ul className="space-y-2 text-sm text-[#5a4a3a]">
                <li className="flex items-start">
                  <Clover className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-[#9e8a6f]" />
                  <span>毎日更新される占い結果</span>
                </li>
                <li className="flex items-start">
                  <Clover className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-[#9e8a6f]" />
                  <span>10,000以上の名字データ</span>
                </li>
                <li className="flex items-start">
                  <Clover className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-[#9e8a6f]" />
                  <span>詳細な由来・意味解説</span>
                </li>
                <li className="flex items-start">
                  <Clover className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-[#9e8a6f]" />
                  <span>無料でご利用可能</span>
                </li>
              </ul>
            </div>
          </div>

          {/* ボトムバー */}
          <div className="border-t border-[#9e8a6f] pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-[#5a4a3a]">
                © 2025 名字占い. All Rights Reserved.
              </p>
              <div className="flex items-center space-x-4 text-xs text-[#5a4a3a]">
                <button className="hover:text-[#3a2a1a] hover:underline transition-colors">プライバシーポリシー</button>
                <span>|</span>
                <button className="hover:text-[#3a2a1a] hover:underline transition-colors">利用規約</button>
                <span>|</span>
                <button className="hover:text-[#3a2a1a] hover:underline transition-colors">お問い合わせ</button>
              </div>
            </div>
            <p className="text-xs mt-4 text-center text-[#5a4a3a]">
              ※占い結果はエンターテイメント目的です。実際の運勢や人生の決定には影響しません。
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
