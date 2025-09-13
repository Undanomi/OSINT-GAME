'use client';

import React from 'react';
import { MailPageProps } from './GogglesMailPage';


export const GogglesMailPasswordMethodPage: React.FC<MailPageProps> = ({ onPhaseNavigate }) => {
  const handleSMSAuth = () => {
    onPhaseNavigate('forgot-sms');
  };

  const handleSecretQuestions = () => {
    onPhaseNavigate('forgot-questions');
  };

  const handleBack = () => {
    onPhaseNavigate('login');
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
        <p className="text-gray-600">本人確認の方法を選択してください</p>
      </div>

      <div className="w-full max-w-md bg-white border border-gray-200 rounded-lg shadow-sm p-8">
        <div className="space-y-4">
          <button
            onClick={handleSMSAuth}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-center"
          >
            <div className="text-lg font-medium">SMSで認証する</div>
            <div className="text-sm opacity-90 mt-1">登録済みの電話番号にコードを送信</div>
          </button>

          <button
            onClick={handleSecretQuestions}
            className="w-full bg-green-600 text-white py-4 px-6 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors text-center"
          >
            <div className="text-lg font-medium">秘密の質問で認証する</div>
            <div className="text-sm opacity-90 mt-1">設定済みの秘密の質問に回答</div>
          </button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={handleBack}
            className="text-blue-600 hover:text-blue-800 text-sm underline"
          >
            前のページに戻る
          </button>
        </div>
      </div>
    </div>
  );
};