'use client';

import React, { useEffect } from 'react';
import { Desktop } from '@/components/Desktop';
import { Window } from '@/components/Window';
import { Taskbar } from '@/components/Taskbar';
import { TitleScreen } from '@/components/TitleScreen';
import { DisclaimerLoading } from '@/components/DisclaimerLoading';
import { ScenarioSelection } from '@/components/ScenarioSelection';
import { ScenarioLoading } from '@/components/ScenarioLoading';
import { useGameStore } from '@/store/gameStore';
import { useWindowStore } from '@/store/windowStore';
import { useAuthContext } from '@/components/AuthProvider';

export default function HomePage() {
  const {
    gamePhase,
    isAuthenticated,
    startGame,
    setUser,
    setAuthenticated,
    setGamePhase,
    setSelectedScenario
  } = useGameStore();
  const windows = useWindowStore(state => state.windows);
  const { user } = useAuthContext();

  useEffect(() => {
    if (user) {
      setUser(user);
      setAuthenticated(true);
    } else {
      setUser(null);
      setAuthenticated(false);
    }
  }, [user, setUser, setAuthenticated]);

  const handleGameStart = () => {
    if (isAuthenticated) {
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
        </div>
      );

    default:
      return <TitleScreen onGameStart={handleGameStart} />;
  }
}