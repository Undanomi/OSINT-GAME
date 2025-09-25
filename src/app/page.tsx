'use client';

import React from 'react';
import { Desktop } from '@/components/Desktop';
import { Window } from '@/components/Window';
import { Taskbar } from '@/components/Taskbar';
import { TitleScreen } from '@/components/TitleScreen';
import { DisclaimerLoading } from '@/components/DisclaimerLoading';
import { ScenarioSelection } from '@/components/ScenarioSelection';
import { ScenarioLoading } from '@/components/ScenarioLoading';
import { NotificationSystem } from '@/components/NotificationSystem';
import { SubmissionExplanation } from '@/components/SubmissionExplanation';
import { SubmissionFailure } from '@/components/SubmissionFailure';
import { useGameStore } from '@/store/gameStore';
import { useWindowStore } from '@/store/windowStore';
import { useAuthContext } from '@/providers/AuthProvider';

export default function HomePage() {
  const {
    gamePhase,
    startGame,
    setGamePhase,
    setSelectedScenario
  } = useGameStore();
  const windows = useWindowStore(state => state.windows);
  const { user } = useAuthContext();

  const handleGameStart = () => {
    if (user) {
      startGame(); // gamePhase を 'disclaimer' に設定
    }
  };

  const handleDisclaimerComplete = () => {
    setGamePhase('scenario-selection');
  };

  const handleScenarioSelect = (scenarioId: string) => {
    setSelectedScenario(scenarioId); // gamePhase を 'scenario-loading' に設定
  };

  const handleScenarioLoadingComplete = () => {
    setGamePhase('game');
  };

  const handleSubmissionExplanationComplete = () => {
    // 解説完了後はゲーム画面に戻る
  };

  const handleSubmissionFailureComplete = () => {
    // 失敗シーン完了後の処理（既にシーン遷移済み）
  };

  // フェーズに応じて適切なコンポーネントを表示
  switch (gamePhase) {
    case 'title':
      return <TitleScreen onGameStart={handleGameStart} />;

    case 'disclaimer':
      return <DisclaimerLoading onComplete={handleDisclaimerComplete} />;

    case 'scenario-selection':
      return <ScenarioSelection onScenarioSelect={handleScenarioSelect} />;

    case 'scenario-loading':
      return <ScenarioLoading onComplete={handleScenarioLoadingComplete} />;

    case 'game':
      return (
        <div className="w-full h-screen overflow-hidden relative">
          {/* デスクトップ背景とアイコン */}
          <Desktop />

          {/* 開いているウィンドウをすべて表示 */}
          {windows.map((window) => (
            <Window key={window.id} windowId={window.id} />
          ))}

          {/* タスクバー */}
          <Taskbar />

          {/* 通知システム */}
          <NotificationSystem />
        </div>
      );

    case 'submission-explanation':
      return <SubmissionExplanation onComplete={handleSubmissionExplanationComplete} />;

    case 'submission-failure':
      return <SubmissionFailure onComplete={handleSubmissionFailureComplete} />;

    default:
      return <TitleScreen onGameStart={handleGameStart} />;
  }
}