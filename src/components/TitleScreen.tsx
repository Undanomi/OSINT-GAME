'use client';

import React, { useState, useEffect } from 'react';
import { Play, Settings, Info, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useGameStore } from '@/store/gameStore';

interface TitleScreenProps {
  onGameStart: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onGameStart }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const { user, loading, signInWithGoogle } = useAuth();
  const { setUser, setAuthenticated } = useGameStore();

  useEffect(() => {
    if (user) {
      setUser(user);
      setAuthenticated(true);
    }
  }, [user, setUser, setAuthenticated]);

  const handleStart = () => {
    if (!user) {
      handleGoogleSignIn();
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      onGameStart();
    }, 1000);
  };

  const handleGoogleSignIn = async () => {
    try {
      setAuthError('');
      await signInWithGoogle();
      // 認証成功後は手動でゲーム開始ボタンを押す必要がある
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Google認証に失敗しました。もう一度お試しください。';
      setAuthError(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900 flex items-center justify-center">
        <div className="flex items-center space-x-3 text-white">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full"></div>
          <span className="text-xl">認証状態を確認中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900 flex items-center justify-center relative overflow-hidden">
      {/* 背景アニメーション */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute w-96 h-96 rounded-full bg-blue-500 blur-3xl -top-48 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 rounded-full bg-cyan-500 blur-3xl -bottom-48 -right-48 animate-pulse"></div>
      </div>

      <div className="relative z-10 text-center max-w-2xl mx-auto p-8">
        {/* ゲームタイトル */}
        <div className="mb-12">
          <h1 className="text-6xl font-bold text-white mb-4 tracking-wider">
            OSINT GAME
          </h1>
          <h2 className="text-2xl text-cyan-300 font-light tracking-wide">
            Open Source Intelligence Training
          </h2>
        </div>

        {/* 認証状態表示 */}
        {user && (
          <div className="mb-6 flex items-center justify-center space-x-3 text-white bg-white/10 rounded-lg px-4 py-2">
            <UserIcon size={20} />
            <span>ログイン中: {user.email || user.displayName}</span>
          </div>
        )}

        {/* エラーメッセージ */}
        {authError && (
          <div className="mb-6 text-red-400 text-center bg-red-400/10 rounded-lg px-4 py-2">
            {authError}
          </div>
        )}

        {/* メニューボタン */}
        <div className="space-y-4 mb-8">
          <button
            onClick={handleStart}
            disabled={isLoading || loading}
            className="w-full max-w-xs mx-auto flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                <span>起動中...</span>
              </>
            ) : loading ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                <span>認証中...</span>
              </>
            ) : (
              <>
                <Play size={20} />
                <span>{user ? 'ゲーム開始' : 'Googleでログインしてゲーム開始'}</span>
              </>
            )}
          </button>

          <button className="w-full max-w-xs mx-auto flex items-center justify-center space-x-3 bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-lg font-medium transition-all">
            <Settings size={18} />
            <span>設定</span>
          </button>

          <button className="w-full max-w-xs mx-auto flex items-center justify-center space-x-3 bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-lg font-medium transition-all">
            <Info size={18} />
            <span>ゲームについて</span>
          </button>
        </div>

        {/* フッター */}
        <div className="text-white/60 text-sm">
          <p>情報収集と分析のスキルを身につけよう</p>
          {!user && (
            <p className="mt-2 text-xs">※ ゲームを開始するにはGoogleアカウントでのログインが必要です</p>
          )}
        </div>
      </div>
    </div>
  );
};