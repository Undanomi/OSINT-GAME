'use client';

import React from 'react';
import { useGameStore } from '@/store/gameStore';

interface SubmissionExplanationProps {
  onComplete: () => void;
}

export const SubmissionExplanation: React.FC<SubmissionExplanationProps> = ({ onComplete }) => {
  const { setGamePhase } = useGameStore();

  const handleContinue = () => {
    setGamePhase('game');
    onComplete();
  };

  return (
    <div className="w-full h-screen flex items-center justify-center bg-black text-white overflow-hidden">
      <div className="max-w-4xl mx-auto p-8 text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-green-400">
            ミッション成功
          </h1>
          <p className="text-xl text-gray-300">
            情報の送信完了
          </p>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 mb-8 text-left">
          <h2 className="text-2xl font-semibold mb-4 text-green-400">
            機密情報解説
          </h2>
          <div className="text-gray-300 leading-relaxed space-y-4">
            <p>
              送信したVPN情報は正しく、組織はターゲットネットワークへのアクセスに成功した。
            </p>
            <p>
              あなたの働きが、作戦を次の段階へと進めた。
            </p>
          </div>
        </div>

        <button
          onClick={handleContinue}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
        >
          解説に移る
        </button>
      </div>
    </div>
  );
};