'use client';

import React, { useState } from 'react';
import { resetPassword } from '@/actions/gogglesLogin';
import { MailPageProps } from './GogglesMailPage';
import { useGogglesMailAuthStore } from '@/store/gogglesAuthStore';


export const GogglesMailPasswordResetPage: React.FC<MailPageProps> = ({ onPhaseNavigate }) => {
  const { loginToGogglesMail } = useGogglesMailAuthStore();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = await resetPassword(newPassword, confirmPassword);
      
      if (result.success) {
        // ローディング画面を表示
        setShowLoading(true);

        // 1秒後にログイン状態を更新してメール画面に遷移
        setTimeout(() => {
          loginToGogglesMail();
          onPhaseNavigate('mail-service');
        }, 1000);
      } else {
        setError(result.error || 'パスワードリセットに失敗しました');
        setIsSubmitting(false);
      }
    } catch {
      setError('予期しないエラーが発生しました');
      setIsSubmitting(false);
    }
  };

  // ローディング画面
  if (showLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-light text-gray-700 mb-2">
            <span className="text-purple-600">G</span>
            <span className="text-orange-500">o</span>
            <span className="text-cyan-500">g</span>
            <span className="text-pink-500">g</span>
            <span className="text-indigo-500">l</span>
            <span className="text-emerald-500">e</span>
            <span className="text-amber-500">s</span>
            <span className="text-gray-700 ml-2">Mail</span>
          </h1>
        </div>
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">メールボックスを読み込んでいます...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center bg-white px-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-light text-gray-700 mb-2">
          <span className="text-purple-600">G</span>
          <span className="text-orange-500">o</span>
          <span className="text-cyan-500">g</span>
          <span className="text-pink-500">g</span>
          <span className="text-indigo-500">l</span>
          <span className="text-emerald-500">e</span>
          <span className="text-amber-500">s</span>
          <span className="text-gray-700 ml-2">Mail</span>
        </h1>
        <p className="text-gray-600">新しいパスワードを設定してください</p>
      </div>

      <div className="w-full max-w-md bg-white border border-gray-200 rounded-lg shadow-sm p-8">
        {isSubmitting ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">パスワードを更新中...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                新しいパスワード
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="新しいパスワードを入力"
                required
                minLength={6}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                新しいパスワード（確認用）
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="確認のため再入力"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!newPassword || !confirmPassword}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              パスワードを更新
            </button>
          </form>
        )}

        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>セキュリティのヒント:</strong> 
            強力なパスワードを設定することをおすすめします。
          </p>
        </div>
      </div>
    </div>
  );
};