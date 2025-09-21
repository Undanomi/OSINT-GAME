'use client';

import React from 'react';
import { useGameStore } from '@/store/gameStore';
import { useSubmissionStore } from '@/store/submissionStore';

interface SubmissionFailureProps {
  onComplete: () => void;
}

export const SubmissionFailure: React.FC<SubmissionFailureProps> = ({ onComplete }) => {
  const { setGamePhase } = useGameStore();
  const { resetSubmission } = useSubmissionStore();

  const handleReturnToDesktop = () => {
    resetSubmission();
    setGamePhase('game');
    onComplete();
  };

  const handleReturnToScenarioSelection = () => {
    resetSubmission();
    setGamePhase('scenario-selection');
    onComplete();
  };

  return (
    <div className="w-full h-screen flex items-center justify-center bg-black text-white overflow-hidden">
      <div className="max-w-4xl mx-auto p-8 text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-red-400">
            ミッション失敗
          </h1>
          <p className="text-xl text-gray-300">
            誤った情報を送信
          </p>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 mb-8 text-left">
          <div className="text-gray-300 leading-relaxed space-y-4">
            <p>
              提供した情報に誤りがあったため、組織の次の攻撃は失敗に終わりました。
            </p>
            <p>
              作戦は振り出しに戻る。
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleReturnToDesktop}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
            >
              やり直す
            </button>

            <button
              onClick={handleReturnToScenarioSelection}
              className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
            >
              ゲームを終了する
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};