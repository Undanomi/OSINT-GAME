'use client';

import React, { useState, useEffect } from 'react';
import { Send, Inbox, Trash2, Star, Settings, Search, Plus, AlertCircle, User } from 'lucide-react';
import type { EmailData } from '../../../types/email';
import { getGogglesMailFromCache, hasGogglesMailCache, saveGogglesMailToCache } from '../../../lib/cache/gogglesMailCache';
import { parseMarkdown } from '../../../lib/markdown';

export const GogglesMailServicePage: React.FC = () => {
  const [selectedEmail, setSelectedEmail] = useState<number | null>(null);
  const [currentView, setCurrentView] = useState<'inbox' | 'compose' | 'detail'>('inbox');
  const [currentFolder, setCurrentFolder] = useState<'inbox' | 'starred' | 'sent' | 'trash'>('inbox');
  const [emails, setEmails] = useState<EmailData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const scrollPositionRef = React.useRef<number>(0);
  const mailListRef = React.useRef<HTMLDivElement>(null);

  // ローカルストレージからメールデータを取得
  useEffect(() => {
    const loadEmails = () => {
      try {
        setLoading(true);
        setError(null);

        // ローカルストレージにキャッシュがあるかチェック
        if (!hasGogglesMailCache()) {
          setError('メールデータが見つかりません。');
          setLoading(false);
          return;
        }

        // ローカルストレージからメールデータを取得
        const emailData = getGogglesMailFromCache();
        setEmails(emailData);
      } catch {
        console.error('Failed to load email data from cache.');
        setError('メールデータの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    loadEmails();
  }, []);

  // ローカルストレージを更新
  const updateLocalStorage = (updatedEmails: EmailData[]) => {
    try {
      saveGogglesMailToCache(updatedEmails);
    } catch {
      console.error('Failed to update local storage');
    }
  };

  // スクロール位置を復元
  useEffect(() => {
    if (currentView === 'inbox' && mailListRef.current && scrollPositionRef.current > 0) {
      mailListRef.current.scrollTop = scrollPositionRef.current;
    }
  }, [currentView]);

  // 既読にする
  const markAsRead = (emailId: number) => {
    setEmails(prev => {
      const updatedEmails = prev.map(email =>
        email.id === emailId ? { ...email, unread: false } : email
      );
      updateLocalStorage(updatedEmails);
      return updatedEmails;
    });
  };

  // スターを付け外しする
  const toggleStar = (emailId: number) => {
    setEmails(prev => {
      const updatedEmails = prev.map(email =>
        email.id === emailId ? { ...email, starred: !email.starred } : email
      );
      updateLocalStorage(updatedEmails);
      return updatedEmails;
    });
  };

  // ゴミ箱に移動
  const moveToTrash = (emailId: number) => {
    setEmails(prev => {
      const updatedEmails = prev.map(email =>
        email.id === emailId ? {
          ...email,
          folder: 'trash' as const,
          starred: false, // ゴミ箱に移動する時はスターを外す
          originalFolder: email.folder !== 'trash' ? email.folder : undefined
        } : email
      );
      updateLocalStorage(updatedEmails);
      return updatedEmails;
    });
    // メール詳細画面からゴミ箱に移動した場合は受信トレイに戻る
    if (selectedEmail === emailId) {
      setCurrentView('inbox');
      setCurrentFolder('inbox');
      setSelectedEmail(null);
    }
  };

  // ゴミ箱から元のフォルダに復元
  const restoreFromTrash = (emailId: number) => {
    setEmails(prev => {
      const updatedEmails = prev.map(email =>
        email.id === emailId && email.originalFolder ? {
          ...email,
          folder: email.originalFolder,
          originalFolder: undefined
        } : email
      );
      updateLocalStorage(updatedEmails);
      return updatedEmails;
    });
    // メール詳細画面から復元した場合は元のフォルダに移動
    if (selectedEmail === emailId) {
      const email = emails.find(e => e.id === emailId);
      if (email?.originalFolder) {
        setCurrentView('inbox');
        setCurrentFolder(email.originalFolder === 'inbox' ? 'inbox' : 'sent');
        setSelectedEmail(null);
      }
    }
  };

  // アバター用のイニシャルと背景色を生成
  const getAvatarInfo = (name: string) => {
    const initial = name.charAt(0).toUpperCase();
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      'bg-purple-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-cyan-500',
    ];
    const colorIndex = Math.abs(hash) % colors.length;
    return { initial, color: colors[colorIndex] };
  };

  // タイムスタンプをフォーマットして表示
  const formatEmailTime = (timestamp: string): string => {
    const emailDate = new Date(timestamp);
    const now = new Date();
    const currentYear = now.getFullYear();

    // メールが現在の年の場合MM月DD日と表示
    if (emailDate.getFullYear() === currentYear) {
      const month = emailDate.getMonth() + 1;
      const day = emailDate.getDate();
      return `${month}月${day}日`;
    }

    // メールが過去の年の場合YYYY/MM/DDと表示
    const year = emailDate.getFullYear();
    const month = (emailDate.getMonth() + 1).toString().padStart(2, '0');
    const day = emailDate.getDate().toString().padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  // メールの検索
  const searchEmails = (emailList: EmailData[], query: string): EmailData[] => {
    if (!query.trim()) return emailList;

    const lowercaseQuery = query.toLowerCase().trim();
    return emailList.filter(email =>
      email.subject.toLowerCase().includes(lowercaseQuery) ||
      email.from.toLowerCase().includes(lowercaseQuery) ||
      (email.to && email.to.toLowerCase().includes(lowercaseQuery)) ||
      email.content.toLowerCase().includes(lowercaseQuery)
    );
  };

  // フォルダと検索クエリに基づいてメールをフィルタ
  const getFilteredEmails = () => {
    let folderEmails: EmailData[];

    switch (currentFolder) {
      case 'inbox':
        folderEmails = emails.filter(email => email.folder === 'inbox');
        break;
      case 'starred':
        folderEmails = emails.filter(email => email.starred);
        break;
      case 'sent':
        folderEmails = emails.filter(email => email.folder === 'sent');
        break;
      case 'trash':
        folderEmails = emails.filter(email => email.folder === 'trash');
        break;
      default:
        folderEmails = emails.filter(email => email.folder === 'inbox');
    }

    const searchedEmails = searchEmails(folderEmails, searchQuery);

    // 時間順（新しい順）でソート
    return searchedEmails.sort((a, b) => {
      const timeA = new Date(a.time).getTime();
      const timeB = new Date(b.time).getTime();
      return timeB - timeA;
    });
  };

  // メールリストと選択中のメールデータ
  const filteredEmails = getFilteredEmails();
  const selectedEmailData = emails.find(email => email.id === selectedEmail);

  // 表示用フォルダタイトル
  const getFolderTitle = () => {
    switch (currentFolder) {
      case 'inbox': return '受信トレイ';
      case 'starred': return 'スター付き';
      case 'sent': return '送信済み';
      case 'trash': return 'ゴミ箱';
      default: return '受信トレイ';
    }
  };

  // ローディング表示
  if (loading) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">メールを読み込んでいます...</p>
        </div>
      </div>
    );
  }

  // エラー表示
  if (error) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm max-w-md w-full text-center">
          <div className="mx-auto mb-3 w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle size={20} className="text-red-600" />
          </div>
          <h2 className="text-gray-900 font-medium">エラーが発生しました</h2>
          <p className="mt-2 text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // 受信トレイの表示
  const renderInbox = () => (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-800">
          {searchQuery ? `"${searchQuery}"の検索結果` : getFolderTitle()}
        </h2>
        <p className="text-sm text-gray-600">
          {searchQuery ? (
            `${filteredEmails.length} 件のメールが見つかりました`
          ) : (
            <>
              {currentFolder === 'inbox' && `${filteredEmails.filter(e => e.unread).length} 件の未読メール`}
              {currentFolder === 'starred' && `${filteredEmails.length} 件のスター付きメール`}
              {currentFolder === 'sent' && `${filteredEmails.length} 件の送信済みメール`}
              {currentFolder === 'trash' && `${filteredEmails.length} 件の削除済みメール`}
            </>
          )}
        </p>
      </div>
      <div ref={mailListRef} className="flex-1 overflow-y-auto p-2">
        {filteredEmails.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchQuery ? (
              <>
                <Search size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">検索結果が見つかりません</p>
                <p className="text-sm">
                  「{searchQuery}」に一致するメールはありませんでした。<br />
                  検索キーワードを変更してお試しください。
                </p>
              </>
            ) : (
              <>
                <Inbox size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">メールがありません</p>
                <p className="text-sm">このフォルダにはメールがありません。</p>
              </>
            )}
          </div>
        ) : (
          filteredEmails.map((email) => {
            const senderName = currentFolder === 'sent' ? email.to || '' : email.from;
            const avatarInfo = getAvatarInfo(senderName);

            return (
              <div
                key={email.id}
                onClick={() => {
                  // スクロール位置を保存
                  if (mailListRef.current) {
                    scrollPositionRef.current = mailListRef.current.scrollTop;
                  }
                  setSelectedEmail(email.id);
                  setCurrentView('detail');
                  if (email.unread) {
                    markAsRead(email.id);
                  }
                }}
                className={`relative mb-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01] ${
                  email.unread ? 'bg-white shadow-md' : 'bg-gray-50 shadow-sm'
                }`}
              >
                {/* 未読インジケーター */}
                {email.unread && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-l-lg" />
                )}

                <div className="p-4 pl-5">
                  <div className="flex items-start space-x-3">
                    {/* アバター */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full ${avatarInfo.color} flex items-center justify-center text-white font-semibold shadow-sm`}>
                      {avatarInfo.initial}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm truncate ${email.unread ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                          {currentFolder === 'sent' ? `宛先: ${email.to}` : `差出人: ${email.from}`}
                        </span>
                        <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                          {email.starred && <Star size={16} className="text-yellow-500 fill-current" />}
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            email.unread ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {formatEmailTime(email.time)}
                          </span>
                        </div>
                      </div>
                      <h3 className={`text-sm mb-1 truncate ${email.unread ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {email.subject}
                      </h3>
                      <p className="text-xs text-gray-600 truncate">{email.content}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  // メール詳細画面の表示
  const renderEmailDetail = () => {
    if (!selectedEmailData) return null;

    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => {
                setCurrentView('inbox');
                setSelectedEmail(null);
              }}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6"/>
              </svg>
              <span>戻る</span>
            </button>
            <div className="flex items-center space-x-2">
              {currentFolder !== 'trash' && (
                <button
                  onClick={() => toggleStar(selectedEmailData.id)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Star size={16} className={selectedEmailData.starred ? 'text-yellow-500 fill-current' : 'text-gray-400'} />
                </button>
              )}
              {currentFolder === 'trash' ? (
                <button
                  onClick={() => restoreFromTrash(selectedEmailData.id)}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center space-x-1"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12l9-9 9 9"/>
                    <path d="M12 3v18"/>
                  </svg>
                  <span>元に戻す</span>
                </button>
              ) : (
                <button
                  onClick={() => moveToTrash(selectedEmailData.id)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Trash2 size={16} className="text-gray-400" />
                </button>
              )}
            </div>
          </div>
          <h1 className="text-xl font-semibold mb-2">{selectedEmailData.subject}</h1>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <User size={16} className="text-gray-400 flex-shrink-0" />
              <p className="text-sm text-gray-600">
                {currentFolder === 'sent' ? `宛先: ${selectedEmailData.to}` : `差出人: ${selectedEmailData.from}`}
              </p>
            </div>
            <p className="text-xs text-gray-500">{formatEmailTime(selectedEmailData.time)}</p>
          </div>
        </div>
        <div className="flex-1 p-6 bg-white overflow-y-auto">
          <div className="prose max-w-none">
            {parseMarkdown(selectedEmailData.content)}
          </div>
        </div>
      </div>
    );
  };

  // メール作成画面の表示
  const renderCompose = () => (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-gray-200 bg-white flex-shrink-0">
        <h2 className="text-xl font-semibold">新しいメールを作成</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-6 bg-white">
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
            <button
              disabled
              className="px-6 py-2 bg-gray-400 text-white rounded-md cursor-not-allowed flex items-center space-x-2"
            >
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
    </div>
  );

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0 sticky top-0 z-10">
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              )}
            </div>
            <button className="p-2 hover:bg-gray-100 rounded">
              <Settings size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* サイドバー */}
        <div className="w-64 bg-white border-r border-gray-200 p-4 flex-shrink-0 overflow-y-auto">
          <button
            onClick={() => setCurrentView('compose')}
            className="w-full mb-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>作成</span>
          </button>
          
          <nav className="space-y-2">
            <button
              onClick={() => {setCurrentView('inbox'); setCurrentFolder('inbox'); setSelectedEmail(null);}}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left ${
                currentFolder === 'inbox' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Inbox size={16} />
              <span>受信トレイ</span>
              <span className="ml-auto text-sm bg-gray-200 px-2 py-0.5 rounded-full">
                {emails.filter(e => e.unread && e.folder === 'inbox').length}
              </span>
            </button>
            <button
              onClick={() => {setCurrentView('inbox'); setCurrentFolder('starred'); setSelectedEmail(null);}}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left ${
                currentFolder === 'starred' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Star size={16} />
              <span>スター付き</span>
            </button>
            <button
              onClick={() => {setCurrentView('inbox'); setCurrentFolder('sent'); setSelectedEmail(null);}}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left ${
                currentFolder === 'sent' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Send size={16} />
              <span>送信済み</span>
            </button>
            <button
              onClick={() => {setCurrentView('inbox'); setCurrentFolder('trash'); setSelectedEmail(null);}}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left ${
                currentFolder === 'trash' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Trash2 size={16} />
              <span>ゴミ箱</span>
            </button>
          </nav>
        </div>

        {/* メインコンテンツ */}
        <div className="flex-1 overflow-hidden">
          {currentView === 'inbox' && renderInbox()}
          {currentView === 'compose' && renderCompose()}
          {currentView === 'detail' && renderEmailDetail()}
        </div>
      </div>
    </div>
  );
};