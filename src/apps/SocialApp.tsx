'use client';

import React, { useState, useRef, useCallback, UIEvent, useEffect } from 'react';
import { BaseApp } from '@/components/BaseApp';
import { AppProps } from '@/types/app';
import { SocialAccountProvider, useSocialAccountContext } from '@/providers/SocialAccountProvider';
import { useAuthContext } from '@/providers/AuthProvider';
import { useSocial } from '@/hooks/useSocial';
import {
  PostComponent,
  ProfilePage,
  SearchPage,
  DMContactListPage,
  DMChatPage,
  NPCProfilePage,
  InactiveUserProfilePage,
  ProfileEditPage,
  NewPostPage,
  SidePanel
} from '@/components/social';
import {
  SocialView,
  SocialContact,
  SocialAccount,
  SocialNPC,
} from '@/types/social';

import {
  Home,
  Search,
  Mail,
  PlusSquare,
} from 'lucide-react';

/**
 * SocialAppの内部実装（認証・アカウント管理が必要）
 */
const SocialAppInner: React.FC<AppProps> = ({ windowId, isActive }) => {
  const { user } = useAuthContext();
  const { activeAccount, accounts, loading: accountLoading, isCreatingDefaults, updateAccount } = useSocialAccountContext();
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
    isWaitingForAI,
    addNewContact,
    error,
    setError,
    npcs,
    getNPCById,
    searchPosts,
    refreshTimeline,
    accountPosts,
    loadInitialNPCPosts,
    loadMoreNPCPosts,
    npcPosts,
  } = useSocial(activeAccount, accounts, updateAccount);

  const [currentView, setCurrentView] = useState<SocialView>('home');
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [selectedNPC, setSelectedNPC] = useState<SocialNPC | null>(null);
  const [selectedInactiveUser, setSelectedInactiveUser] = useState<SocialAccount | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileEditError, setProfileEditError] = useState<string>('');
  const timelineRef = useRef<HTMLDivElement>(null);

  // 初回マウント時にタイムラインをリフレッシュ（時刻表示を更新）
  useEffect(() => {
    refreshTimeline();
  }, []);

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
        // 非アクティブユーザーアカウント専用ページを表示
        setSelectedInactiveUser(userAccount);
        setCurrentView('inactive-user-profile');
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
              account_id: npcPost.author.account_id,
              name: npcPost.author.name,
              avatar: npcPost.author.avatar,
              bio: '',
              location: '',
              canDM: true,
              followersCount: 0,
              followingCount: 0,
              systemPrompt: '',
              isActive: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              isGameOverTarget: false,
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
      setProfileEditError(''); // エラーをクリア
      await updateAccount(activeAccount?.id || '', updatedAccount);
      setCurrentView('my-profile');
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'accountDuplicate') {
          setProfileEditError('このユーザーIDは既に使用されています。別のIDを選択してください。');
        } else {
          setProfileEditError('プロフィールの更新に失敗しました。しばらく待ってから再試行してください。');
        }
      } else {
        setProfileEditError('プロフィールの更新に失敗しました。しばらく待ってから再試行してください。');
      }
      // エラーがある場合は画面遷移しない（edit-profileに留まる）
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
            searchPosts={searchPosts}
          />
        );
      case 'my-profile':
        return (
          <ProfilePage
            activeAccount={activeAccount}
            onUserSelect={handleUserSelect}
            onEditProfile={() => setCurrentView('edit-profile')}
            accountPosts={accountPosts}
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
            isWaitingForAI={isWaitingForAI}
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
            onUserSelect={handleUserSelect}
            loadInitialNPCPosts={loadInitialNPCPosts}
            loadMoreNPCPosts={loadMoreNPCPosts}
            npcPosts={npcPosts}
          />
        ) : (
          <div className="p-6">プロフィールが見つかりません。</div>
        );
      case 'inactive-user-profile':
        return selectedInactiveUser ? (
          <InactiveUserProfilePage
            account={selectedInactiveUser}
            onBack={() => setCurrentView('home')}
            onUserSelect={handleUserSelect}
            accountPosts={accountPosts}
          />
        ) : (
          <div className="p-6">プロフィールが見つかりません。</div>
        );
      case 'edit-profile':
        return (
          <ProfileEditPage
            account={activeAccount}
            error={profileEditError}
            onSave={handleProfileUpdate}
            onCancel={() => {
              setProfileEditError(''); // エラーをクリア
              setCurrentView('my-profile');
            }}
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
              onClick={() => {
                if (currentView === 'home') {
                  // ホームにいる場合は、スクロールをトップに戻してタイムスタンプを更新
                  if (timelineRef.current) {
                    timelineRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                  refreshTimeline();
                } else {
                  setCurrentView('home');
                }
              }}
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