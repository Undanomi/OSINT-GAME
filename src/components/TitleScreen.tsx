'use client';

import React, { useState } from 'react';
import { Play, Settings, Info, User as UserIcon } from 'lucide-react';
import { useAuthContext } from '@/providers/AuthProvider';

interface TitleScreenProps {
  onGameStart: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onGameStart }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showAbout, setShowAbout] = useState(false);
  const [hasReadAbout, setHasReadAbout] = useState(false);

  const { user, loading, signInWithGoogle } = useAuthContext();

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
            Open Source Intelligence Game
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
          <div className="bg-slate-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20 dark-scrollbar">
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
            <div className="text-gray-300 space-y-8 p-6 bg-gray-800 rounded-lg shadow-xl">

              {/* 1. 最重要：免責事項　*/}
              <div>
                <h4 className="text-xl font-bold text-white mb-3 border-b border-gray-600 pb-2">
                  免責事項
                </h4>
                <ul className="list-disc list-outside ml-5 space-y-2 leading-relaxed">
                  <li>
                    本ゲームに登場する<span className="font-bold">人物、団体、事件、情報等はすべて架空</span>の創作物であり、実在の人物、団体、過去の出来事とは<span className="font-bold">一切の関連性を有しません</span>。
                  </li>
                  <li>
                    ゲームの現実感を高める目的で、災害やスポーツ等の<span className="font-bold">一般的な時事</span>から着想を得た要素を設定として使用しております。これらは特定の事象を忠実に描写する、または特定の立場を主張する意図はございません。
                  </li>
                  <li>
                    本ゲームの利用により利用者に生じた<span className="font-bold">一切の損害、損失、またはトラブル</span>について、当方は<span className="font-bold">いかなる責任も負いません</span>。本ゲームの利用は、利用者の<span className="font-bold">自己責任</span>において行っていただくものとします。
                  </li>
                </ul>
              </div>

              <hr className="border-gray-700" />

              {/* 2. ゲームの目的（厳格な表現） */}
              <div>
                <h4 className="text-xl font-bold text-white mb-3 border-b border-gray-600 pb-2">
                  本ゲームの利用目的
                </h4>
                <p className="leading-relaxed mb-3">
                  本ゲームは、<span className="font-bold">OSINT（オープンソース・インテリジェンス）の基本的な技術と手法</span>を体験し、公開情報から個人や組織の情報が特定され得る<span className="font-bold">リスクと社会的な影響</span>について深く認識いただくことを目的として開発されております。
                </p>
                <p className="leading-relaxed">
                  情報の収集、分析、検証の手法を実践的に学ぶことで、インターネット上での情報公開および利用に関する<span className="font-bold">セキュリティ意識と倫理観</span>を涵養することを目指します。
                </p>
              </div>

              <hr className="border-gray-700" />

              {/* 3. プライバシーポリシー */}
              <div>
                <h4 className="text-xl font-bold text-white mb-3 border-b border-gray-600 pb-2">
                  プライバシーポリシー
                </h4>
                <p className="leading-relaxed mb-2">
                  本ゲームのログインには<span className="font-bold">Googleアカウント認証システム</span>を利用しております。
                </p>

                <h5 className="text-lg font-semibold text-white mt-4 mb-2">
                  取得情報と利用範囲の特定
                </h5>
                <p className="leading-relaxed mb-1">
                  当方が認証システムを通じて取得し、利用する情報は以下の通りです。
                </p>
                <ul className="list-disc list-outside ml-5 space-y-1 leading-relaxed">
                  <li>
                    <span className="font-bold">利用情報：ユーザー識別子 (UID)</span>
                    <p className="ml-4 text-gray-400">利用者を一意に識別し、ゲームデータの保存・管理を目的として<span className="font-bold">利用</span>します。</p>
                  </li>
                  <li>
                    <span className="font-bold">非利用情報：表示名/ニックネーム、メールアドレス</span>
                    <p className="ml-4 text-gray-400">これらの情報は認証プロセスの過程でシステムに提供されますが、<span className="font-bold">保存および利用は一切行いません</span>。</p>
                  </li>
                </ul>

                <h5 className="text-lg font-semibold text-white mt-4 mb-2">
                  情報の管理体制
                </h5>
                <p className="leading-relaxed">
                  利用情報（UID）は、<span className="font-bold">本ゲームの運用および機能提供の目的を超えて利用することはございません</span>。法令に基づく開示請求がある場合を除き、利用者の同意なく第三者へ提供することもございません。
                </p>
              </div>

              <hr className="border-gray-700" />

              {/* 4. 倫理的・法的な注意事項 */}
              <div>
                <h4 className="text-xl font-bold text-white mb-3 border-b border-gray-600 pb-2">
                  遵守義務事項および禁止行為
                </h4>
                <p className="leading-relaxed mb-3">
                  本ゲームは、技術の<span className="font-bold">教育・啓発を目的</span>とするものであり、利用者は以下の事項を<span className="font-bold">厳正に遵守</span>する義務を負います。
                </p>
                <ul className="list-disc list-outside ml-5 space-y-2 leading-relaxed">
                  <li>
                    本ゲームを通じて得られた知識および手法は、<span className="font-bold">いかなる場合も、倫理的規範および適用される法令の範囲内でのみ</span>使用してください。
                  </li>
                  <li>
                    <span className="font-bold">他者のプライバシー権の侵害、不正アクセス、各種違法行為</span>に該当する一切の行為を<span className="font-bold">固く禁じます</span>。
                  </li>
                  <li>
                    ゲーム内の情報はすべて創作された架空のものです。本ゲームはOSINT技術の学習を目的とするものであり、現実世界の情報の正確性、完全性、最新性を保証するものではございません。
                  </li>
                </ul>
              </div>

              <hr className="border-gray-700" />

              {/* 5. 技術仕様 (補足情報) */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">
                  技術仕様
                </h4>
                <p className="leading-relaxed text-gray-400">
                  本ゲームはWebブラウザ環境で動作するデスクトップエミュレータ形式を採用しております。仮想化されたアプリケーションやウェブサイトを通じて調査体験を提供いたします。
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