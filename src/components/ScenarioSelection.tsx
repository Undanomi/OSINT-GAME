'use client';

import React, { useState } from 'react';
import { Play, FileText, Search, MapPin, Globe } from 'lucide-react';
import { checkUserDataExists } from '@/actions/user';
import { handleServerAction } from '@/utils/handleServerAction';

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
  onScenarioSelect: (scenarioId: string, shouldReset?: boolean) => void;
}

const scenarios: Scenario[] = [
  {
    id: 'social-media-analysis',
    title: 'SNSを活用したOSINTとスピアフィッシング',
    description: 'SNSに公開されている情報を調査し、とある企業のエンジニアのアカウントが侵害されるまでの手順を攻撃者視点で体験します。',
    difficulty: 'intermediate',
    estimatedTime: '90-150分',
    icon: Globe,
    isImplemented: true,
  },
  {
    id: 'basic-osint',
    title: '検索エンジンを使った基本的なOSINT',
    description: '検索エンジンを利用すると、様々なWebページを得ることができます。ここでは検索の結果から得られる情報をOSINTしてみましょう。',
    difficulty: 'beginner',
    estimatedTime: '10-30分',
    icon: Search,
    isImplemented: false,
  },
  {
    id: 'geolocation-and-image-analysis',
    title: '位置情報と画像を活用した行動特定',
    description: 'インターネット上には個人を特定しうる情報が多数存在します。本シナリオでは位置情報や画像から得られる情報により、標的の行動を推定します。',
    difficulty: 'intermediate',
    estimatedTime: '45-60分',
    icon: MapPin,
    isImplemented: false,
  },
  {
    id: 'dark-web-osint',
    title: 'ダークウェブを活用したOSINT',
    description: 'ダークウェブには攻撃者コミュニティが存在し、情報の売買などが行われています。とある企業の漏洩情報や認証情報をダークウェブで収集し、企業に攻撃を仕掛けましょう。',
    difficulty: 'advanced',
    estimatedTime: '180-240分',
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
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [comingSoonScenario, setComingSoonScenario] = useState<string>('');
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);

  const handleScenarioClick = async (scenario: Scenario) => {
    if (!scenario.isImplemented) {
      setComingSoonScenario(scenario.title);
      setShowComingSoon(true);
      setTimeout(() => {
        setShowComingSoon(false);
      }, 3000);
      return;
    }

    // ユーザーデータの存在をチェック
    const hasData = await handleServerAction(
      () => checkUserDataExists(scenario.id),
      (error) => console.error('Failed to check user data:', error)
    );

    if (hasData) {
      // データが存在する場合は進行状況確認ダイアログを表示
      setSelectedScenario(scenario);
      setShowProgressDialog(true);
      return;
    }

    // データが存在しない場合はそのままシナリオを開始（リセット不要）
    onScenarioSelect(scenario.id, false);
  };

  const handleScenarioStart = (shouldReset: boolean) => {
    setShowProgressDialog(false);
    if (selectedScenario) {
      onScenarioSelect(selectedScenario.id, shouldReset);
    }
  };

  const handleCancelProgressDialog = () => {
    setShowProgressDialog(false);
    setSelectedScenario(null);
  };

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900 overflow-y-auto overflow-x-hidden relative">
      {/* 背景アニメーション */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute w-96 h-96 rounded-full bg-blue-500 blur-3xl -top-48 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 rounded-full bg-cyan-500 blur-3xl -bottom-48 -right-48 animate-pulse"></div>
      </div>

      {/* Coming Soon モーダル */}
      {showComingSoon && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-8 max-w-md mx-4 text-center border border-gray-700">
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

      {/* 進行状況確認ダイアログ */}
      {showProgressDialog && selectedScenario && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-8 max-w-md mx-4 text-center border border-gray-700">
            <h3 className="text-2xl font-bold text-white mb-4">リプレイの確認</h3>
            <p className="text-cyan-300 mb-4">
              セーブデータが存在します。
            </p>
            <p className="text-gray-300 text-sm mb-6">
              途中から続けますか？それとも最初からやり直しますか？
            </p>
            <div className="flex flex-col gap-3 mb-4">
              <button
                onClick={() => handleScenarioStart(false)}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                途中から続ける
              </button>
              <button
                onClick={() => handleScenarioStart(true)}
                className="w-full px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors"
              >
                最初からやり直す
              </button>
              <button
                onClick={handleCancelProgressDialog}
                className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
              >
                キャンセル
              </button>
            </div>
            <p className="text-yellow-300 text-xs">
              最初からやり直すとすべてのプレイデータが削除されます
            </p>
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