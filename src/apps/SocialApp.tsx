'use client';

import React, { useState, useRef, useEffect, useCallback, UIEvent } from 'react';
import { BaseApp } from '@/components/BaseApp';
import { AppProps } from '@/types/app';
import { SocialAccountProvider, useSocialAccountContext } from '@/providers/SocialAccountProvider';
import { useAuthContext } from '@/providers/AuthProvider';
import { useSocial } from '@/hooks/useSocial';
import { AccountSwitcher } from '@/components/AccountSwitcher';
import {
  SocialView,
  UISocialPost,
  UISocialDMMessage,
  SocialContact,
  SocialAccount,
  SocialNPC,
  getDisplayUserId
} from '@/types/social';
import { MAX_POST_LENGTH, MAX_MESSAGE_LENGTH } from '@/lib/social/constants';

import {
  Heart,
  MessageCircle,
  Share,
  MoreHorizontal,
  User,
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
  Home,
  Search,
  Mail,
  ArrowLeft,
  Gift,
  PlusSquare,
  Send,
} from 'lucide-react';

/**
 * 個別の投稿を表示するコンポーネント
 */
const PostComponent = ({
  post,
  onUserSelect
}: {
  post: UISocialPost;
  onUserSelect: (userId: string) => void
}) => {
  const handleAuthorClick = () => onUserSelect(post.authorId);

  return (
    <div className="bg-white p-6 border-b border-gray-200">
      <div className="flex items-start space-x-3">
        <div
          className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 text-gray-600 font-bold cursor-pointer hover:opacity-80"
          onClick={handleAuthorClick}
        >
          {post.author.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3
              className="font-semibold text-gray-900 cursor-pointer hover:underline"
              onClick={handleAuthorClick}
            >
              {post.author.name}
            </h3>
            <span className="text-gray-500 text-sm">{getDisplayUserId(post.author.id)}</span>
            <span className="text-gray-500 text-sm">•</span>
            <span className="text-gray-500 text-sm">{post.timeString}</span>
          </div>
          <p className="mt-2 text-gray-800 leading-relaxed">{post.content}</p>
          <div className="flex items-center justify-between mt-4 max-w-md">
            <button className="flex items-center space-x-2 text-gray-500 hover:text-pink-600">
              <Heart size={18} />
              <span className="text-sm">{post.likes}</span>
            </button>
            <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-600">
              <MessageCircle size={18} />
              <span className="text-sm">{post.comments}</span>
            </button>
            <button className="flex items-center space-x-2 text-gray-500 hover:text-green-600">
              <Share size={18} />
              <span className="text-sm">{post.shares}</span>
            </button>
            <button className="text-gray-500 hover:text-gray-700">
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * ユーザープロフィールページコンポーネント
 */
const ProfilePage = ({
  activeAccount,
  userPosts,
  onStartDM,
  isMyProfile,
  onUserSelect,
  onEditProfile
}: {
  activeAccount: SocialAccount | SocialNPC;
  userPosts: UISocialPost[];
  onStartDM: (user: SocialAccount | SocialNPC) => void;
  isMyProfile: boolean;
  onUserSelect: (userId: string) => void;
  onEditProfile?: () => void;
}) => {
  if (!activeAccount) return <div className="p-6">プロフィールが見つかりません。</div>;

  return (
    <div className="h-full overflow-y-auto">
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-2xl font-bold">
              {activeAccount.avatar}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{activeAccount.name}</h2>
              <p className="text-gray-600">{getDisplayUserId(activeAccount.id)}</p>
              <p className="text-sm text-gray-700 mt-2 max-w-md leading-relaxed">{activeAccount.bio}</p>
            </div>
          </div>
          {isMyProfile ? (
            onEditProfile && (
              <button
                onClick={onEditProfile}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex-shrink-0 h-fit"
              >
                編集
              </button>
            )
          ) : (
            <button
              onClick={() => onStartDM(activeAccount)}
              disabled={!activeAccount.canDM}
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Mail size={20} />
            </button>
          )}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            {activeAccount.location && (
              <div className="flex items-center space-x-2 text-gray-600">
                <MapPin size={14} />
                <span>{activeAccount.location}</span>
              </div>
            )}
            <div className="flex items-center space-x-2 text-gray-600">
              <Calendar size={14} />
              <span>参加日: {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}</span>
            </div>
            {activeAccount.birthday && (
              <div className="flex items-center space-x-2 text-gray-600">
                <Gift size={14} />
                <span>誕生日: {activeAccount.birthday}</span>
              </div>
            )}
            {activeAccount.company && (
              <div className="flex items-center space-x-2 text-gray-600">
                <Briefcase size={14} />
                <span>{activeAccount.company} - {activeAccount.position}</span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            {activeAccount.education && (
              <div className="flex items-center space-x-2 text-gray-600">
                <GraduationCap size={14} />
                <span>{activeAccount.education}</span>
              </div>
            )}
            <div className="flex space-x-6 text-sm">
              <span><strong>{activeAccount.followingCount}</strong> フォロー</span>
              <span><strong>{activeAccount.followersCount}</strong> フォロワー</span>
            </div>
          </div>
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        <h3 className="p-4 font-bold text-lg bg-white">投稿一覧</h3>
        {userPosts.length > 0 ? (
          userPosts.map(post => (
            <PostComponent key={post.id} post={post} onUserSelect={onUserSelect} />
          ))
        ) : (
          <p className="p-6 text-gray-500">まだ投稿がありません。</p>
        )}
      </div>
    </div>
  );
};

/**
 * 検索機能を提供するページコンポーネント
 */
const SearchPage = ({
  posts,
  onUserSelect,
  searchQuery,
  onSearchChange,
  activeAccount,
  onAccountClick,
  npcs,
  allAccounts
}: {
  posts: UISocialPost[];
  onUserSelect: (userId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeAccount: SocialAccount | SocialNPC;
  onAccountClick: () => void;
  npcs: SocialNPC[];
  allAccounts: SocialAccount[];
}) => {
  const query = searchQuery.toLowerCase();

  // @マークで始まる場合はユーザーID検索
  const isUserIdSearch = query.startsWith('@');
  const userIdQuery = isUserIdSearch ? query.slice(1) : '';

  // 投稿内容で検索（@検索の場合は除外）
  const filteredPosts = isUserIdSearch ? [] : posts.filter(p =>
    p.content.toLowerCase().includes(query)
  );

  // ユーザーアカウントで検索
  const filteredUserAccounts = allAccounts.filter(account => {
    if (isUserIdSearch) {
      // @検索の場合はIDのみで検索
      return account.id.toLowerCase().includes(userIdQuery);
    } else {
      // 通常検索の場合は名前で検索
      return account.name.toLowerCase().includes(query);
    }
  });

  // NPC検索
  const filteredNPCs = npcs.filter(npc => {
    if (isUserIdSearch) {
      // @検索の場合はIDのみで検索
      return npc.id.toLowerCase().includes(userIdQuery);
    } else {
      // 通常検索の場合は名前で検索
      return npc.name.toLowerCase().includes(query);
    }
  });

  // ユーザーアカウントとNPCを統合
  const filteredUsers = [...filteredUserAccounts, ...filteredNPCs];

  return (
    <div className="h-full flex flex-col">
      {/* 検索画面専用ヘッダー */}
      <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <button
            onClick={onAccountClick}
            className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg p-2 transition-colors"
          >
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-sm font-bold">
              {activeAccount?.avatar}
            </div>
          </button>
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="投稿を検索"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 検索結果 */}
      <div className="flex-1 overflow-auto p-4">
        {searchQuery ? (
          <>
            {filteredUsers.length > 0 || filteredPosts.length > 0 ? (
              <div className="space-y-6">
                {/* ユーザー検索結果 */}
                {filteredUsers.length > 0 && (
                  <div>
                    <h3 className="font-bold text-lg mb-3 text-gray-800">ユーザー ({filteredUsers.length})</h3>
                    <div className="space-y-2">
                      {filteredUsers.map(user => (
                        <div
                          key={user.id}
                          onClick={() => onUserSelect(user.id)}
                          className="flex items-center space-x-3 p-3 bg-white rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-200 transition-colors"
                        >
                          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-lg font-bold flex-shrink-0">
                            {user.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate">{user.name}</h4>
                            <p className="text-sm text-gray-500 truncate">@{user.id}</p>
                            {user.bio && (
                              <p className="text-sm text-gray-600 truncate mt-1">{user.bio}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 投稿検索結果 */}
                {filteredPosts.length > 0 && (
                  <div>
                    <h3 className="font-bold text-lg mb-3 text-gray-800">投稿 ({filteredPosts.length})</h3>
                    <div className="divide-y divide-gray-200 bg-white rounded-lg border border-gray-200">
                      {filteredPosts.map(post => (
                        <PostComponent key={post.id} post={post} onUserSelect={onUserSelect} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 mt-8">
                <p className="text-lg">検索結果が見つかりませんでした</p>
                <p className="text-sm mt-2">「{searchQuery}」に一致するユーザーや投稿はありません</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-lg">検索キーワードを入力してください</p>
            <p className="text-sm mt-2">ユーザー名やユーザーID、投稿内容で検索できます</p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * DM連絡先一覧ページ
 */
const DMContactListPage = ({
  contacts,
  onSelectContact,
  searchQuery,
  onSearchChange,
  activeAccount,
  onAccountClick
}: {
  contacts: SocialContact[];
  onSelectContact: (contact: SocialContact) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeAccount: SocialAccount | SocialNPC;
  onAccountClick: () => void;
}) => {
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full bg-white flex flex-col">
      {/* DM連絡先画面専用ヘッダー */}
      <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <button
            onClick={onAccountClick}
            className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg p-2 transition-colors"
          >
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-sm font-bold">
              {activeAccount?.avatar}
            </div>
          </button>
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="連絡先を検索"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredContacts.length > 0 ? (
          filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center space-x-3 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
              onClick={() => onSelectContact(contact)}
            >
              <div className="relative w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                <User size={20} className="text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 truncate">{contact.name}</h3>
                <p className="text-sm text-gray-500 truncate mt-1">タップしてメッセージを開始</p>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center">
            <p className="text-gray-500">
              {searchQuery ? `「${searchQuery}」に一致する連絡先は見つかりませんでした。` : "連絡先がありません。"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * DMチャットページ
 */
const DMChatPage = ({
  contact,
  messages,
  onBack,
  onSendMessage,
  messagesLoading,
  isLoadingMore,
  onLoadMore
}: {
  contact: SocialContact;
  messages: UISocialDMMessage[];
  onBack: () => void;
  onSendMessage: (text: string) => Promise<void>;
  messagesLoading: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
}) => {
  const [inputText, setInputText] = useState('');
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const isScrolledToBottomRef = useRef(true);

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim()) return;

    const currentInput = inputText;
    setInputText('');

    try {
      await onSendMessage(currentInput);
    } catch {
      setInputText(currentInput);
    }
  }, [inputText, onSendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollTop < 50 && !isLoadingMore) {
      onLoadMore();
    }
    isScrolledToBottomRef.current = scrollHeight - scrollTop - clientHeight < 50;
  };

  useEffect(() => {
    if (chatAreaRef.current && isScrolledToBottomRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages.length]);

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center p-4 bg-white border-b">
        <button onClick={onBack} className="mr-3 p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex items-center space-x-3">
          <div className="relative w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            <User size={16} className="text-gray-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{contact.name}</h3>
            <p className="text-xs text-gray-500">オンライン</p>
          </div>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
        ref={chatAreaRef}
        onScroll={handleScroll}
      >
        {messagesLoading && (
          <p className="text-center text-sm text-gray-500">メッセージを読み込み中...</p>
        )}
        {isLoadingMore && (
          <p className="text-center text-sm text-gray-500">さらに読み込み中...</p>
        )}
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-md p-3 rounded-lg shadow-sm text-sm ${
              message.sender === 'me'
                ? 'bg-blue-500 text-white rounded-br-none'
                : 'bg-white text-gray-800 rounded-bl-none'
            }`}>
              <p className="whitespace-pre-wrap">{message.text}</p>
              <p className={`text-xs mt-1 text-right ${
                message.sender === 'me' ? 'text-blue-200' : 'text-gray-500'
              }`}>
                {message.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-shrink-0 p-4 border-t bg-white">
        <div className="flex items-center space-x-3">
          <input
            type="text"
            placeholder="メッセージを入力..."
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={inputText}
            onChange={(e) => setInputText(e.target.value.substring(0, MAX_MESSAGE_LENGTH))}
            onKeyDown={handleKeyDown}
            maxLength={MAX_MESSAGE_LENGTH}
          />
          <button
            onClick={handleSendMessage}
            className="bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
            disabled={!inputText.trim()}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};


/**
 * NPCプロフィールページコンポーネント
 */
const NPCProfilePage = ({
  npc,
  onStartDM,
  onBack,
  posts,
  onUserSelect
}: {
  npc: SocialNPC;
  onStartDM: (contact: { id: string; name: string }) => void;
  onBack: () => void;
  posts: UISocialPost[];
  onUserSelect: (userId: string) => void;
}) => {
  if (!npc) return <div className="p-6">プロフィールが見つかりません。</div>;

  // NPCの投稿をフィルタリング
  const npcPosts = posts.filter(post => post.authorId === npc.id);

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
        <div className="flex items-center mb-4">
          <button onClick={onBack} className="mr-3 p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h2 className="text-xl font-bold">プロフィール</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-2xl font-bold">
                {npc.avatar}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{npc.name}</h2>
                <p className="text-gray-600">{getDisplayUserId(npc.id)}</p>
                <p className="text-sm text-gray-700 mt-2 max-w-md leading-relaxed">{npc.bio}</p>
              </div>
            </div>
            {npc.canDM && (
              <button
                onClick={() => onStartDM({ id: npc.id, name: npc.name })}
                className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
              >
                <Mail size={20} />
              </button>
            )}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              {npc.location && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <MapPin size={14} />
                  <span>{npc.location}</span>
                </div>
              )}
              <div className="flex items-center space-x-2 text-gray-600">
                <Calendar size={14} />
                <span>参加日: {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}</span>
              </div>
              {npc.birthday && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <Gift size={14} />
                  <span>誕生日: {npc.birthday}</span>
                </div>
              )}
              {npc.company && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <Briefcase size={14} />
                  <span>{npc.company} - {npc.position}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              {npc.education && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <GraduationCap size={14} />
                  <span>{npc.education}</span>
                </div>
              )}
              <div className="flex space-x-6 text-sm">
                <span><strong>{npc.followersCount || 0}</strong> フォロー</span>
                <span><strong>{npc.followingCount || 0}</strong> フォロワー</span>
              </div>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          <h3 className="p-4 font-bold text-lg bg-white">投稿一覧</h3>
          {npcPosts.length > 0 ? (
            npcPosts.map(post => (
              <PostComponent key={post.id} post={post} onUserSelect={onUserSelect} />
            ))
          ) : (
            <p className="p-6 text-gray-500">まだ投稿がありません。</p>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * プロフィール編集ページコンポーネント
 */
const ProfileEditPage = ({
  account,
  onSave,
  onCancel
}: {
  account: SocialAccount;
  onSave: (updatedAccount: SocialAccount) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState(account || {});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: SocialAccount) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center p-4 bg-white border-b flex-shrink-0">
        <button onClick={onCancel} className="mr-3 p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h2 className="text-xl font-bold">プロフィールを編集</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700">名前</label>
          <input
            type="text"
            name="name"
            value={formData.name || ''}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">自己紹介</label>
          <textarea
            name="bio"
            value={formData.bio || ''}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">誕生日</label>
          <input
            type="date"
            name="birthday"
            value={formData.birthday || ''}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">所在地</label>
          <input
            type="text"
            name="location"
            value={formData.location || ''}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">会社</label>
          <input
            type="text"
            name="company"
            value={formData.company || ''}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">役職</label>
          <input
            type="text"
            name="position"
            value={formData.position || ''}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">学歴</label>
          <input
            type="text"
            name="education"
            value={formData.education || ''}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="p-4 border-t bg-white">
        <button
          onClick={() => onSave(formData)}
          className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600"
        >
          保存
        </button>
      </div>
    </div>
  );
};

/**
 * 新規投稿ページコンポーネント
 */
const NewPostPage = ({
  activeAccount,
  onAddPost,
  onCancel
}: {
  activeAccount: SocialAccount | SocialNPC;
  onAddPost: (content: string) => void;
  onCancel: () => void;
}) => {
  const [content, setContent] = useState('');

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
        <button onClick={onCancel} className="text-blue-500 hover:text-blue-700">
          キャンセル
        </button>
        <button
          onClick={() => onAddPost(content)}
          disabled={!content.trim()}
          className="bg-blue-500 text-white font-bold py-2 px-4 rounded-full hover:bg-blue-600 disabled:bg-blue-300"
        >
          投稿
        </button>
      </div>

      <div className="flex-1 p-4 flex flex-col">
        <div className="flex space-x-3 flex-1">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 text-gray-600 font-bold">
            {activeAccount?.avatar || 'U'}
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.substring(0, MAX_POST_LENGTH))}
            placeholder="いまどうしてる？"
            className="flex-1 resize-none border-none focus:outline-none text-lg"
            maxLength={MAX_POST_LENGTH}
            rows={8}
          />
        </div>

        <div className="text-right text-sm text-gray-500 mt-4">
          {content.length}/{MAX_POST_LENGTH}
        </div>
      </div>
    </div>
  );
};

/**
 * サイドパネルコンポーネント
 */
const SidePanel = ({
  isOpen,
  onClose,
  onNavigateToProfile
}: {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToProfile: () => void;
}) => {
  return (
    <div className={`absolute top-0 left-0 bottom-0 bg-white border-r border-gray-200 shadow-lg z-40 w-80 transition-transform duration-300 ease-in-out ${
      isOpen ? 'transform translate-x-0' : 'transform -translate-x-full'
    }`}>
      <div className="p-6 h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">アカウント</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
          >
            ✕
          </button>
        </div>
        <AccountSwitcher onClose={onClose} onNavigateToProfile={onNavigateToProfile} />
      </div>
    </div>
  );
};


/**
 * SocialAppの内部実装（認証・アカウント管理が必要）
 */
const SocialAppInner: React.FC<AppProps> = ({ windowId, isActive }) => {
  const { user } = useAuthContext();
  const { activeAccount, accounts, loading: accountLoading, isCreatingDefaults } = useSocialAccountContext();
  const {
    posts,
    postsLoading,
    isLoadingMorePosts,
    hasMorePosts,
    loadMorePosts,
    createPost,
    contacts,
    selectedContact,
    setSelectedContact,
    messages,
    messagesLoading,
    isLoadingMoreMessages,
    loadMoreMessages,
    sendMessage,
    addNewContact,
    updateUserProfile,
    error,
    setError,
    npcs,
    getNPCById,
  } = useSocial(activeAccount, accounts);

  const [currentView, setCurrentView] = useState<SocialView>('home');
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [selectedNPC, setSelectedNPC] = useState<SocialNPC | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const timelineRef = useRef<HTMLDivElement>(null);

  // 無限スクロール処理
  const handleTimelineScroll = useCallback((e: UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 100 && hasMorePosts && !isLoadingMorePosts) {
      loadMorePosts();
    }
  }, [hasMorePosts, isLoadingMorePosts, loadMorePosts]);

  // ユーザー選択処理
  const handleUserSelect = (userId: string) => {
    if (activeAccount && userId === activeAccount.id) {
      setCurrentView('my-profile');
    } else {
      // まず他のユーザーアカウントかチェック
      const userAccount = accounts.find(acc => acc.id === userId);
      if (userAccount) {
        // 非アクティブユーザーアカウントをNPCのように表示（DMは無効）
        const userAsNPC = {
          id: userAccount.id,
          name: userAccount.name,
          avatar: userAccount.avatar,
          bio: userAccount.bio || '',
          canDM: false, // ユーザーアカウント間のDMは無効
          location: userAccount.location,
          birthday: userAccount.birthday,
          company: userAccount.company,
          position: userAccount.position,
          education: userAccount.education,
          followersCount: userAccount.followersCount,
          followingCount: userAccount.followingCount,
          systemPrompt: '',
          isActive: false
        };
        setSelectedNPC(userAsNPC);
        setCurrentView('npc-profile');
      } else {
        // NPCのプロフィール表示
        const npc = getNPCById(userId);
        if (npc) {
          setSelectedNPC(npc);
          setCurrentView('npc-profile');
        } else {
          // フォールバック：投稿から情報を取得
          const npcPost = posts.find(p => p.authorId === userId && p.authorType === 'npc');
          if (npcPost) {
            const npcInfo: SocialNPC = {
              id: userId,
              name: npcPost.author.name,
              avatar: npcPost.author.avatar,
              bio: '',
              location: '',
              canDM: true,
              followersCount: 0,
              followingCount: 0,
              systemPrompt: '',
              isActive: false
            };
            setSelectedNPC(npcInfo);
            setCurrentView('npc-profile');
          }
        }
      }
    }
  };

  // DM開始処理
  const handleStartDM = async (contact: SocialContact | { id: string; name: string }) => {
    try {
      let actualContact: SocialContact;

      if ('type' in contact) {
        // すでにSocialContact形式の場合
        actualContact = contact;
      } else {
        // NPCとのDM開始の場合、既存の連絡先をチェック
        const existingContact = contacts.find(c => c.id === contact.id);
        if (existingContact) {
          // 既存の連絡先を使用
          actualContact = existingContact;
        } else {
          // 新しい連絡先を追加
          actualContact = await addNewContact(contact.id, contact.name);
        }
      }

      setSelectedContact(actualContact);
      setCurrentView('dm-chat');
    } catch (error) {
      console.error('Failed to start DM:', error);
      // エラーはuseSocialで管理されている
    }
  };

  // DM一覧に戻る処理
  const handleBackToDMList = () => {
    setSelectedContact(null);
    setCurrentView('dm');
  };

  // 投稿作成処理
  const handleAddNewPost = useCallback(async (content: string) => {
    if (!content.trim()) return;

    try {
      await createPost(content);
      setCurrentView('home');
    } catch {
      // エラーはuseSocialで管理されている
    }
  }, [createPost]);

  // プロフィール更新処理
  const handleProfileUpdate = async (updatedAccount: SocialAccount) => {
    try {
      await updateUserProfile(updatedAccount);
      setCurrentView('my-profile');
    } catch (error) {
      // エラーはuseSocialで管理されている
      console.error('Failed to update profile:', error);
    }
  };


  // ローディング状態
  if (!user || accountLoading || isCreatingDefaults) {
    return (
      <BaseApp windowId={windowId} isActive={isActive} statusBar="SNSアプリケーション">
        <div className="h-full bg-gray-50 flex items-center justify-center">
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </BaseApp>
    );
  }

  // アカウント未作成状態（デフォルトアカウント作成待ち）
  if (!activeAccount) {
    return (
      <BaseApp windowId={windowId} isActive={isActive} statusBar="SNSアプリケーション">
        <div className="h-full bg-gray-50 flex items-center justify-center">
          <p className="text-gray-500">アカウントを準備中...</p>
        </div>
      </BaseApp>
    );
  }

  // メインコンテンツの描画
  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return (
          <div className="h-full flex flex-col">
            {/* ホーム画面専用ヘッダー（アカウントアイコンのみ） */}
            <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
              <div className="flex items-center justify-start">
                <button
                  onClick={() => setShowSidePanel(true)}
                  className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg p-2 transition-colors"
                >
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-sm font-bold">
                    {activeAccount?.avatar}
                  </div>
                </button>
              </div>
            </div>

            {postsLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-500">投稿を読み込み中...</p>
              </div>
            ) : (
              <div
                className="flex-1 overflow-auto divide-y divide-gray-200"
                ref={timelineRef}
                onScroll={handleTimelineScroll}
              >
                {posts.map(post => (
                  <PostComponent key={post.id} post={post} onUserSelect={handleUserSelect} />
                ))}
                {isLoadingMorePosts && (
                  <div className="p-4 text-center">
                    <p className="text-gray-500">さらに読み込み中...</p>
                  </div>
                )}
                {!hasMorePosts && posts.length > 0 && (
                  <div className="p-4 text-center">
                    <p className="text-gray-500">すべての投稿を表示しました</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      case 'search':
        return (
          <SearchPage
            posts={posts}
            onUserSelect={handleUserSelect}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeAccount={activeAccount}
            onAccountClick={() => setShowSidePanel(true)}
            npcs={npcs}
            allAccounts={accounts}
          />
        );
      case 'my-profile':
        const userPosts = posts.filter(p => p.authorId === activeAccount.id);
        return (
          <ProfilePage
            activeAccount={activeAccount}
            userPosts={userPosts}
            onStartDM={handleStartDM}
            isMyProfile={true}
            onUserSelect={handleUserSelect}
            onEditProfile={() => setCurrentView('edit-profile')}
          />
        );
      case 'dm':
        return (
          <DMContactListPage
            contacts={contacts}
            onSelectContact={handleStartDM}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeAccount={activeAccount}
            onAccountClick={() => setShowSidePanel(true)}
          />
        );
      case 'dm-chat':
        return selectedContact ? (
          <DMChatPage
            contact={selectedContact}
            messages={messages}
            onBack={handleBackToDMList}
            onSendMessage={sendMessage}
            messagesLoading={messagesLoading}
            isLoadingMore={isLoadingMoreMessages}
            onLoadMore={loadMoreMessages}
          />
        ) : (
          <div>連絡先が選択されていません。</div>
        );
      case 'npc-profile':
        return selectedNPC ? (
          <NPCProfilePage
            npc={selectedNPC}
            onStartDM={handleStartDM}
            onBack={() => setCurrentView('home')}
            posts={posts}
            onUserSelect={handleUserSelect}
          />
        ) : (
          <div className="p-6">プロフィールが見つかりません。</div>
        );
      case 'edit-profile':
        return (
          <ProfileEditPage
            account={activeAccount}
            onSave={handleProfileUpdate}
            onCancel={() => setCurrentView('my-profile')}
          />
        );
      case 'new-post':
        return (
          <NewPostPage
            activeAccount={activeAccount}
            onAddPost={handleAddNewPost}
            onCancel={() => setCurrentView('home')}
          />
        );
      default:
        return <div>ホーム</div>;
    }
  };

  return (
    <BaseApp windowId={windowId} isActive={isActive} statusBar="SNSアプリケーション">
      <div className="h-full bg-gray-50 flex relative overflow-x-hidden">
        {/* サイドパネル */}
        <SidePanel
          isOpen={showSidePanel}
          onClose={() => setShowSidePanel(false)}
          onNavigateToProfile={() => {
            setCurrentView('my-profile');
            setShowSidePanel(false);
          }}
        />

        {/* メインコンテンツエリア */}
        <div className={`w-full flex flex-col transition-transform duration-300 ease-in-out ${
          showSidePanel ? 'transform translate-x-80' : 'transform translate-x-0'
        }`}>
          {/* サイドパネル用背景オーバーレイ */}
          {showSidePanel && (
            <div
              className="absolute inset-0 z-30"
              onClick={() => setShowSidePanel(false)}
            />
          )}


          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">
              {error}
              <button
                onClick={() => setError(null)}
                className="ml-2 underline hover:no-underline"
              >
                閉じる
              </button>
            </div>
          )}

          <div className="flex-1 overflow-hidden">{renderContent()}</div>

          {/* 下部ナビゲーション */}
          <div className="h-16 bg-white border-t flex justify-around items-center flex-shrink-0">
            <button
              onClick={() => setCurrentView('home')}
              className={`p-2 rounded-full transition-colors ${
                currentView === 'home' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <Home size={24} />
            </button>
            <button
              onClick={() => {
                setCurrentView('search');
                setSearchQuery(''); // 検索タブを開く時に検索クエリをリセット
              }}
              className={`p-2 rounded-full transition-colors ${
                currentView === 'search' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <Search size={24} />
            </button>
            <button
              onClick={() => setCurrentView('new-post')}
              className={`p-2 rounded-full transition-colors ${
                currentView === 'new-post' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <PlusSquare size={24} />
            </button>
            <button
              onClick={() => {
                setCurrentView('dm');
                setSearchQuery(''); // DMタブを開く時に検索クエリをリセット
              }}
              className={`p-2 rounded-full transition-colors ${
                currentView === 'dm' || currentView === 'dm-chat' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <Mail size={24} />
            </button>
          </div>
        </div>
      </div>
    </BaseApp>
  );
};

/**
 * SNSアプリケーションのメインコンポーネント（Provider付き）
 */
export const SocialApp: React.FC<AppProps> = ({ windowId, isActive }) => {
  return (
    <SocialAccountProvider>
      <SocialAppInner windowId={windowId} isActive={isActive} />
    </SocialAccountProvider>
  );
};

export default SocialApp;