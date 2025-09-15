'use client';

import React, { useState } from 'react';
import { Play, FileText, Users, Building2, Globe } from 'lucide-react';
import { loadSearchResults } from '@/lib/cache/searchResultsCache';
import { loadGogglesMailData } from '@/lib/cache/gogglesMailCache';

interface Scenario {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  isImplemented: boolean;
}

interface ScenarioSelectionProps {
  onScenarioSelect: (scenarioId: string) => void;
}

const scenarios: Scenario[] = [
  {
    id: 'social-media-analysis',
    title: 'SNSを活用したOSINTとスピアフィッシング',
    description: 'SNSに公開されている情報を調査し、とある企業のエンジニアのアカウントが侵害されるまでの手順を攻撃者視点で体験します。',
    difficulty: 'beginner',
    estimatedTime: '20-30分',
    icon: Globe,
    isImplemented: true,
  },
  {
    id: 'missing-person',
    title: '[ToDo]行方不明者の調査',
    description: 'SNSやインターネット上の情報を活用して、行方不明になった人物の手がかりを探します。',
    difficulty: 'beginner',
    estimatedTime: '30-45分',
    icon: Users,
    isImplemented: false,
  },
  {
    id: 'corporate-investigation',
    title: '[ToDo]企業調査',
    description: '企業の背景、関係者、財務状況などを公開情報から調査します。',
    difficulty: 'intermediate',
    estimatedTime: '45-60分',
    icon: Building2,
    isImplemented: false,
  },
  {
    id: 'document-verification',
    title: '[ToDo]文書検証',
    description: '画像や文書の真正性を検証し、改ざんや偽造を見抜く方法を学びます。',
    difficulty: 'advanced',
    estimatedTime: '60-90分',
    icon: FileText,
    isImplemented: false,
  },
];

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'beginner':
      return 'text-green-400 bg-green-400/20';
    case 'intermediate':
      return 'text-yellow-400 bg-yellow-400/20';
    case 'advanced':
      return 'text-red-400 bg-red-400/20';
    default:
      return 'text-gray-400 bg-gray-400/20';
  }
};

const getDifficultyLabel = (difficulty: string) => {
  switch (difficulty) {
    case 'beginner':
      return '初級';
    case 'intermediate':
      return '中級';
    case 'advanced':
      return '上級';
    default:
      return '不明';
  }
};

export const ScenarioSelection: React.FC<ScenarioSelectionProps> = ({ onScenarioSelect }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [comingSoonScenario, setComingSoonScenario] = useState<string>('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleScenarioClick = async (scenario: Scenario) => {
    if (!scenario.isImplemented) {
      setComingSoonScenario(scenario.title);
      setShowComingSoon(true);
      setTimeout(() => {
        setShowComingSoon(false);
      }, 3000);
      return;
    }

    setIsLoading(true);

    try {
      // 検索結果とメールデータを取得
      const [searchResults, emailData] = await Promise.all([
        loadSearchResults(),
        loadGogglesMailData()
      ]);

      // データが取得できているかチェック
      if (!searchResults || searchResults.length === 0) {
        console.error('検索結果の取得に失敗しました');
        throw new Error;
      }
      if (!emailData || emailData.length === 0) {
        console.error('メールデータの取得に失敗しました');
        throw new Error;
      }
      console.log('シナリオデータの取得完了:', {
        searchResults: searchResults.length + '件',
        emailData: emailData.length + '件'
      });

      // アニメーション効果のための遅延
      setTimeout(() => {
        onScenarioSelect(scenario.id);
      }, 1000);
    } catch {
      console.error('キャッシュの保存に失敗しました:');
      setIsLoading(false);
      
      // エラーメッセージを表示
      const errorMsg = 'ゲームの読み込みに失敗しました。';
      setErrorMessage(errorMsg);
      setShowError(true);

      // エラーメッセージを非表示
      setTimeout(() => {
        setShowError(false);
      }, 5000);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-3 border-white border-t-transparent rounded-full mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-white mb-4">シナリオを準備中...</h2>
          <p className="text-cyan-300 text-lg">まもなく調査を開始します</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900 overflow-y-auto relative">
      {/* 背景アニメーション */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute w-96 h-96 rounded-full bg-blue-500 blur-3xl -top-48 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 rounded-full bg-cyan-500 blur-3xl -bottom-48 -right-48 animate-pulse"></div>
      </div>

      {/* Coming Soon モーダル */}
      {showComingSoon && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 max-w-md mx-4 text-center border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-4">Coming Soon!</h3>
            <p className="text-cyan-300 mb-4">
              「{comingSoonScenario}」は現在開発中です。
            </p>
            <p className="text-gray-300 text-sm">
              他のシナリオをお試しください。
            </p>
          </div>
        </div>
      )}

      {/* エラーモーダル */}
      {showError && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-red-900/30 backdrop-blur-md rounded-xl p-8 max-w-md mx-4 text-center border border-red-500/30">
            <h3 className="text-2xl font-bold text-white mb-4">エラー</h3>
            <p className="text-red-300 mb-4">
              {errorMessage}
            </p>
            <p className="text-gray-300 text-sm">
              インターネット接続を確認し、しばらくしてからお試しください。
            </p>
            <button
              onClick={() => setShowError(false)}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            調査シナリオを選択
          </h1>
          <p className="text-xl text-cyan-300">
            あなたの興味に合わせて調査シナリオを選んでください
          </p>
        </div>

        {/* シナリオカード */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {scenarios.map((scenario) => {
            const IconComponent = scenario.icon;
            const isDisabled = !scenario.isImplemented;

            return (
              <div
                key={scenario.id}
                onClick={() => handleScenarioClick(scenario)}
                className={`bg-white/10 backdrop-blur-sm rounded-xl p-6 cursor-pointer transform transition-all duration-300 border border-white/20 ${
                  isDisabled
                    ? 'opacity-60 hover:opacity-80'
                    : 'hover:scale-105 hover:bg-white/20 hover:border-cyan-400/50'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      isDisabled
                        ? 'bg-gray-600'
                        : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                    }`}>
                      <IconComponent size={24} className="text-white" />
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-xl font-semibold text-white">
                          {scenario.title}
                        </h3>
                        {!scenario.isImplemented && (
                          <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full font-medium">
                            開発中
                          </span>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(scenario.difficulty)}`}>
                        {getDifficultyLabel(scenario.difficulty)}
                      </span>
                    </div>

                    <p className="text-gray-300 mb-4 leading-relaxed">
                      {scenario.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-cyan-400 text-sm font-medium">
                        推定時間: {scenario.estimatedTime}
                      </span>
                      <div className="flex items-center space-x-2 text-white">
                        <Play size={16} />
                        <span className="text-sm">
                          {scenario.isImplemented ? '開始' : 'Coming Soon'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* フッター */}
        <div className="text-center mt-12">
          <p className="text-white/60 text-sm">
            実装済みのシナリオは独立しており、どの順番でも楽しめます
          </p>
        </div>
      </div>
    </div>
  );
};