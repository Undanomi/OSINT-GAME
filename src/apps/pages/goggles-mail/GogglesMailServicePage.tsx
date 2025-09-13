'use client';

import React, { useState } from 'react';
import { Send, Inbox, Trash2, Star, Settings, Search, Plus } from 'lucide-react';

export const GogglesMailServicePage: React.FC = () => {
  const [selectedEmail, setSelectedEmail] = useState<number | null>(null);
  const [currentView, setCurrentView] = useState<'inbox' | 'compose'>('inbox');

  // TODO: ISSUE-163
  // ダミーのメールデータ
  const emails = [
    {
      id: 1,
      from: 'support@bank.example.com',
      subject: '【重要】セキュリティアップデートのお知らせ',
      preview: 'お客様のアカウントのセキュリティ強化のため...',
      time: '10:30',
      unread: true,
      starred: false,
    },
    {
      id: 2,
      from: 'newsletter@tech.example.com',
      subject: '今週のテクノロジーニュース',
      preview: 'AI技術の最新動向について...',
      time: '09:15',
      unread: false,
      starred: true,
    },
    {
      id: 3,
      from: 'admin@company.example.com',
      subject: '会議の予定変更について',
      preview: '明日予定されていた会議の時間が変更になりました...',
      time: '昨日',
      unread: false,
      starred: false,
    },
  ];

  const selectedEmailData = emails.find(email => email.id === selectedEmail);

  const renderInbox = () => (
    <div className="flex h-full">
      {/* メール一覧 */}
      <div className={`${selectedEmail ? 'w-1/3' : 'w-full'} border-r border-gray-200`}>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">受信トレイ</h2>
          <p className="text-sm text-gray-600">{emails.filter(e => e.unread).length} 件の未読メール</p>
        </div>
        <div className="overflow-y-auto">
          {emails.map((email) => (
            <div
              key={email.id}
              onClick={() => setSelectedEmail(selectedEmail === email.id ? null : email.id)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                email.unread ? 'bg-blue-50' : ''
              } ${selectedEmail === email.id ? 'bg-blue-100' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm ${email.unread ? 'font-semibold' : ''}`}>
                  {email.from}
                </span>
                <div className="flex items-center space-x-2">
                  {email.starred && <Star size={16} className="text-yellow-500 fill-current" />}
                  <span className="text-xs text-gray-500">{email.time}</span>
                </div>
              </div>
              <h3 className={`text-sm mb-1 ${email.unread ? 'font-semibold' : ''}`}>
                {email.subject}
              </h3>
              <p className="text-xs text-gray-600 truncate">{email.preview}</p>
            </div>
          ))}
        </div>
      </div>

      {/* メール詳細 */}
      {selectedEmail && selectedEmailData && (
        <div className="w-2/3 flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">{selectedEmailData.subject}</h2>
              <div className="flex items-center space-x-2">
                <button className="p-1 hover:bg-gray-100 rounded">
                  <Star size={16} className={selectedEmailData.starred ? 'text-yellow-500 fill-current' : 'text-gray-400'} />
                </button>
                <button className="p-1 hover:bg-gray-100 rounded">
                  <Trash2 size={16} className="text-gray-400" />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600">差出人: {selectedEmailData.from}</p>
            <p className="text-xs text-gray-500">{selectedEmailData.time}</p>
          </div>
          <div className="flex-1 p-4 bg-white overflow-y-auto">
            <div className="prose max-w-none">
              <p>こちらは {selectedEmailData.subject} の内容です。</p>
              <p>{selectedEmailData.preview}</p>
              <p>詳細な内容がここに表示されます。このメールはデモ用のサンプルメールです。</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderCompose = () => (
    <div className="h-full p-6 bg-white">
      <h2 className="text-xl font-semibold mb-6">新しいメールを作成</h2>
      <div className="max-w-4xl space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">宛先</label>
          <input
            type="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="recipient@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">件名</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="件名を入力"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">本文</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-64 resize-none"
            placeholder="メッセージを入力..."
          ></textarea>
        </div>
        <div className="flex space-x-3">
          <button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2">
            <Send size={16} />
            <span>送信</span>
          </button>
          <button 
            onClick={() => setCurrentView('inbox')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-light text-gray-700">
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
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="メールを検索"
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
            <button className="p-2 hover:bg-gray-100 rounded">
              <Settings size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* サイドバーとメインコンテンツ */}
      <div className="flex h-full">
        {/* サイドバー */}
        <div className="w-64 bg-white border-r border-gray-200 p-4">
          <button
            onClick={() => setCurrentView('compose')}
            className="w-full mb-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>作成</span>
          </button>
          
          <nav className="space-y-2">
            <button
              onClick={() => {setCurrentView('inbox'); setSelectedEmail(null);}}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left ${
                currentView === 'inbox' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Inbox size={16} />
              <span>受信トレイ</span>
              <span className="ml-auto text-sm bg-gray-200 px-2 py-0.5 rounded-full">
                {emails.filter(e => e.unread).length}
              </span>
            </button>
            <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left text-gray-700 hover:bg-gray-50">
              <Star size={16} />
              <span>スター付き</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left text-gray-700 hover:bg-gray-50">
              <Send size={16} />
              <span>送信済み</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left text-gray-700 hover:bg-gray-50">
              <Trash2 size={16} />
              <span>ゴミ箱</span>
            </button>
          </nav>
        </div>

        {/* メインコンテンツ */}
        <div className="flex-1">
          {currentView === 'inbox' ? renderInbox() : renderCompose()}
        </div>
      </div>
    </div>
  );
};