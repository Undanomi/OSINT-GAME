'use client';

import React, { useState } from 'react';
import { validatePasswordResetData } from '@/actions/gogglesLogin';
import { MailPageProps } from './GogglesMailPage';


export const GogglesMailPasswordEmailPage: React.FC<MailPageProps> = ({ onPhaseNavigate }) => {
  const [email, setEmail] = useState('');
  const [birthday, setBirthday] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = await validatePasswordResetData({ email, birthday });
      
      if (result.success) {
        // 正しい場合は認証選択ページに遷移
        onPhaseNavigate('forgot-method');
      } else {
        setError(result.error || 'アカウント情報の確認に失敗しました');
      }
    } catch {
      setError('予期しないエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <p className="text-gray-600">アカウント情報を入力してください</p>
      </div>

      <div className="w-full max-w-md bg-white border border-gray-200 rounded-lg shadow-sm p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="example@gmail.com"
              required
            />
          </div>

          <div>
            <label htmlFor="birthday" className="block text-sm font-medium text-gray-700 mb-2">
              生年月日
            </label>
            <input
              type="date"
              id="birthday"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              min="1950-01-01"
              max="2025-12-31"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !email || !birthday}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '確認中...' : '送信'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => onPhaseNavigate('login')}
            className="text-blue-600 hover:text-blue-800 text-sm underline"
          >
            ログインページに戻る
          </button>
        </div>
      </div>
    </div>
  );
};