'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';

interface ScenarioLoadingProps {
  onComplete: () => void;
}

const getScenarioInfo = (scenarioId: string | null) => {
  switch (scenarioId) {
    case 'social-media-analysis':
      return {
        title: 'ソーシャルメディア分析',
        subtitle: '偽アカウントの特定と情報の真偽判断',
        description: 'あなたは情報分析のエキスパートとして、怪しいアカウントの調査を依頼されました。',
        objectives: [
          'SNSアカウントの真正性を検証する',
          '投稿内容の一貫性を分析する',
          'プロフィール情報の矛盾を発見する',
          '関連アカウントとの関係性を調べる'
        ]
      };
    default:
      return {
        title: '調査ミッション',
        subtitle: '情報収集と分析',
        description: 'あなたは情報分析のエキスパートとして、重要な調査を依頼されました。',
        objectives: [
          '公開情報を活用した調査',
          'データの収集と分析',
          '情報の真偽を判断',
          '調査結果をまとめる'
        ]
      };
  }
};

export const ScenarioLoading: React.FC<ScenarioLoadingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const { selectedScenario } = useGameStore();

  const scenarioInfo = getScenarioInfo(selectedScenario);

  const steps = [
    '調査環境を準備中...',
    'データベースに接続中...',
    'セキュリティプロトコルを確認中...',
    'ミッション情報を読み込み中...',
    '調査ツールを初期化中...',
    '準備完了'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            onComplete();
          }, 1000);
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [onComplete]);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        clearInterval(stepTimer);
        return prev;
      });
    }, 1000);

    return () => clearInterval(stepTimer);
  }, [steps.length]);

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900 relative overflow-hidden">
      {/* 背景アニメーション */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute w-96 h-96 rounded-full bg-blue-500 blur-3xl -top-48 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 rounded-full bg-cyan-500 blur-3xl -bottom-48 -right-48 animate-pulse"></div>
      </div>

      {/* グリッドパターン */}
      <div className="absolute inset-0 opacity-5">
        <div className="grid grid-cols-8 h-full">
          {Array.from({ length: 64 }).map((_, i) => (
            <div key={i} className="border border-white animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-center h-full px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* ミッション情報 */}
          <div className="mb-12">
            <div className="mb-6">
              <h1 className="text-5xl font-bold text-white mb-4 tracking-wide">
                {scenarioInfo.title}
              </h1>
              <h2 className="text-2xl text-cyan-300 mb-6">
                {scenarioInfo.subtitle}
              </h2>
              <p className="text-xl text-gray-300 leading-relaxed">
                {scenarioInfo.description}
              </p>
            </div>

            {/* 目標リスト */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-4">ミッション目標</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {scenarioInfo.objectives.map((objective, index) => (
                  <div key={index} className="flex items-center space-x-3 text-left">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0"></div>
                    <span className="text-gray-300">{objective}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* プログレスセクション */}
          <div className="mb-8">
            {/* プログレスバー */}
            <div className="mb-6">
              <div className="w-full bg-white/20 rounded-full h-3 mb-4">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-200 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-cyan-300">
                <span>準備中...</span>
                <span>{progress}%</span>
              </div>
            </div>

            {/* 現在のステップ */}
            <div className="min-h-[2rem] flex items-center justify-center">
              <p className="text-white text-lg font-medium">
                {steps[currentStep]}
              </p>
            </div>
          </div>

          {/* ローディングアニメーション */}
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
          </div>

          {/* 注意事項 */}
          <div className="mt-12 text-center">
            <p className="text-white/60 text-sm">
              この調査は教育目的のシミュレーションです
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
