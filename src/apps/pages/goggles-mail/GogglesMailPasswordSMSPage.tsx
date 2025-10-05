'use client';

import React, { useState } from 'react';
import { validateSMSCode } from '@/actions/gogglesLogin';
import { MailPageProps } from './GogglesMailPage';


export const GogglesMailPasswordSMSPage: React.FC<MailPageProps> = ({ onPhaseNavigate }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await validateSMSCode(phoneNumber);
      
      if (result.success) {
        onPhaseNavigate('password-reset');
      } else {
        setError(result.error || 'SMS認証に失敗しました');
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
        <p className="text-gray-600">SMS認証</p>
      </div>

      <div className="w-full max-w-md bg-white border border-gray-200 rounded-lg shadow-sm p-8">
        <div className="mb-6 text-center">
          <p className="text-gray-700">
            XXX-XXXX-9999へSMSを送ります。<br />
            電話番号を入力してください
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
              電話番号
            </label>
            <input
              type="tel"
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="090-1234-5678"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-md">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !phoneNumber}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'SMS送信中...' : '送信'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => onPhaseNavigate('forgot-method')}
            className="text-blue-600 hover:text-blue-800 text-sm underline"
          >
            認証方法選択に戻る
          </button>
        </div>
      </div>
    </div>
  );
};