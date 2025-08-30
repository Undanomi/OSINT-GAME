'use client';

import React, { useState, useEffect } from 'react';
import { Play, Settings, Info, User as UserIcon } from 'lucide-react';
import { useAuthContext } from '@/components/AuthProvider';
import { useGameStore } from '@/store/gameStore';

interface TitleScreenProps {
  onGameStart: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onGameStart }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showAbout, setShowAbout] = useState(false);
  const [hasReadAbout, setHasReadAbout] = useState(false);

  const { user, loading, signInWithGoogle } = useAuthContext();
  const { setUser, setAuthenticated } = useGameStore();

  useEffect(() => {
    if (user) {
      setUser(user);
      setAuthenticated(true);
    }
  }, [user, setUser, setAuthenticated]);

  const handleStart = () => {
    if (!user) {
      if (!hasReadAbout) {
        setShowAbout(true);
        return;
      }
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

  const handleAgreeAndLogin = async () => {
    setHasReadAbout(true);
    setShowAbout(false);
    await handleGoogleSignIn();
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
            className="w-full max-w-sm mx-auto flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-10 py-5 rounded-lg text-lg font-semibold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <Play size={21} />
                <span>{user ? 'ゲーム開始' : 'Googleでログインしてゲーム開始'}</span>
              </>
            )}
          </button>

          <button className="w-full max-w-xs mx-auto flex items-center justify-center space-x-3 bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-lg font-medium transition-all">
            <Settings size={18} />
            <span>設定</span>
          </button>

          <button
            onClick={() => setShowAbout(true)}
            className="w-full max-w-xs mx-auto flex items-center justify-center space-x-3 bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-lg font-medium transition-all"
          >
            <Info size={18} />
            <span>ゲームについて</span>
          </button>
        </div>

        {/* フッター */}
        <div className="text-white/60 text-sm">
          {!user && (
            <p className="mt-2 text-xs">
              ※ ゲームを開始するには「ゲームについて」をお読みいただき、Googleアカウントでのログインが必要です
            </p>
          )}
        </div>
      </div>

      {/* ゲームについてモーダル */}
      {showAbout && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">ゲームについて</h3>
              <button
                onClick={() => setShowAbout(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="text-gray-300 space-y-4">
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">免責事項</h4>
                <p className="leading-relaxed">
                  この物語はフィクションであり、実在の人物、団体などとは一切関係ありません。
                  本ゲームは教育目的で作成されており、OSINT（オープンソースインテリジェンス）の
                  基本的な技術と手法を学習するためのトレーニングゲームです。
                  本ゲームの利用によって生じたトラブル・損失・損害には一切責任を負いかねます。
                  また、本ゲームの利用は利用者の責任によって行っていただけるようお願い致します。
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-2">ゲームの目的</h4>
                <p className="leading-relaxed">
                  公開されている情報を活用して、与えられた課題を解決する能力を養うことを目的としています。
                  情報の収集、分析、検証の手法を実践的に学ぶことができます。
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-2">注意事項</h4>
                <ul className="list-disc list-inside space-y-1 leading-relaxed">
                  <li>ゲーム内の情報は全て架空のものです</li>
                  <li>学習目的でのみご利用ください</li>
                  <li>本ゲームで習得した技術や知識は、倫理的かつ法的な範囲内でのみ使用してください</li>
                  <li>他者のプライバシーの侵害や不正アクセス等の違法行為は一切禁止します</li>
                  <li>本ゲームは、OSINTの技術と手法の学習を目的としており、正確性、完全性、最新性を保証するものではありません</li>
                </ul>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-2">技術仕様</h4>
                <p className="leading-relaxed">
                  本ゲームはWebブラウザ上で動作するデスクトップエミュレータです。
                  様々なアプリケーションやウェブサイトを模擬した環境で調査体験を提供します。
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              {!hasReadAbout && !user ? (
                <button
                  onClick={handleAgreeAndLogin}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center space-x-2"
                >
                  <span>同意してGoogleでログイン</span>
                </button>
              ) : null}
              <button
                onClick={() => setShowAbout(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-all"
              >
                {user ? '閉じる' : 'キャンセル'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};