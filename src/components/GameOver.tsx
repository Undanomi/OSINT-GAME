'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useSubmissionStore } from '@/store/submissionStore';
import { useAuthContext } from '@/providers/AuthProvider';
import { resetUserData } from '@/actions/user';

type GameOverReason = 'submission-failure' | 'social-relationship';

interface GameOverState {
  reason: GameOverReason;
  details?: string;
}

interface GameOverProps {
  gameOverState: GameOverState | null;
  onComplete: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({ gameOverState, onComplete }) => {
  const { setGamePhase } = useGameStore();
  const { resetSubmission } = useSubmissionStore();
  const { user } = useAuthContext();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleReturnToDesktop = () => {
    resetSubmission();
    setGamePhase('game');
    onComplete();
  };

  const handleReturnToScenarioSelection = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmReset = async () => {
    if (!user) {
      console.error('No user found in GameOver component');
      return;
    }

    try {
      setIsDeleting(true);
      await resetUserData();

      resetSubmission();
      setGamePhase('scenario-selection');
      onComplete();
    } catch {
      // エラーが発生してもゲーム終了は続行
      resetSubmission();
      setGamePhase('scenario-selection');
      onComplete();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelReset = () => {
    setShowConfirmDialog(false);
  };

  // ゲームオーバー理由に基づいてメッセージを決定
  const getGameOverContent = () => {
    if (!gameOverState) {
      return {
        title: 'ミッション失敗',
        subtitle: '予期しないエラー',
        description: ['不明なエラーが発生しました。']
      };
    }

    switch (gameOverState.reason) {
      case 'submission-failure':
        return {
          title: 'ミッション失敗',
          subtitle: '誤った情報を送信',
          description: [
            '提供した情報に誤りがあったため、組織の次の攻撃は失敗に終わりました。',
            '作戦は振り出しに戻る。'
          ]
        };
      case 'social-relationship':
        return {
          title: 'ミッション失敗',
          subtitle: '関係性の悪化',
          description: [
            gameOverState.details || 'ターゲットとの関係性が悪化し、これ以上の情報収集が困難になりました。',
            '作戦は振り出しに戻る。'
          ]
        };
      default:
        return {
          title: 'ミッション失敗',
          subtitle: '作戦中断',
          description: ['作戦が中断されました。']
        };
    }
  };

  const { title, subtitle, description } = getGameOverContent();

  return (
    <div className="w-full h-screen flex items-center justify-center bg-black text-white overflow-hidden">
      <div className="max-w-4xl mx-auto p-8 text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-red-400">
            {title}
          </h1>
          <p className="text-xl text-gray-300">
            {subtitle}
          </p>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 mb-8 text-left">
          <div className="text-gray-300 leading-relaxed space-y-4">
            {description.map((text, index) => (
              <p key={index}>
                {text}
              </p>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {gameOverState?.reason !== 'social-relationship' && (
              <button
                onClick={handleReturnToDesktop}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
              >
                途中からやり直す
              </button>
            )}

            <button
              onClick={handleReturnToScenarioSelection}
              disabled={isDeleting}
              className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-50 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
            >
              はじめからやり直す
            </button>
          </div>
        </div>

        {/* 確認ダイアログ */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg p-6 max-w-md mx-4 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">
                データ削除の確認
              </h3>
              <p className="text-gray-300 mb-6">
                すべてのプレイデータが削除されます。
                この操作は取り消せません。
                <br />
                本当にはじめからやり直しますか？
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleConfirmReset}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  やり直す
                </button>
                <button
                  onClick={handleCancelReset}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};