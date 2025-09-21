import React, { useState, useEffect, useRef } from 'react';
import { UISocialPost, SocialAccount, SocialNPC } from '@/types/social';
import { PostComponent } from './PostComponent';
import { Search } from 'lucide-react';

interface SearchPageProps {
  posts: UISocialPost[];
  onUserSelect: (userId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeAccount: SocialAccount | SocialNPC;
  onAccountClick: () => void;
  npcs: SocialNPC[];
  allAccounts: SocialAccount[];
  searchPosts: (query: string, targetLimit?: number) => Promise<UISocialPost[]>;
}

/**
 * 検索機能を提供するページコンポーネント
 */
export const SearchPage: React.FC<SearchPageProps> = ({
  posts,
  onUserSelect,
  searchQuery,
  onSearchChange,
  activeAccount,
  onAccountClick,
  npcs,
  allAccounts,
  searchPosts
}) => {
  const query = searchQuery.toLowerCase();
  const [searchedPosts, setSearchedPosts] = useState<UISocialPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const lastSearchQueryRef = useRef<string>('');

  // @マークで始まる場合はユーザーID検索
  const isUserIdSearch = query.startsWith('@');
  const userIdQuery = isUserIdSearch ? query.slice(1) : '';

  // 投稿検索の処理（デバウンス付き）
  useEffect(() => {
    // 検索クエリが変更されていない場合はスキップ
    if (searchQuery === lastSearchQueryRef.current) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      if (!searchQuery.trim() || searchQuery.startsWith('@')) {
        setSearchedPosts([]);
        lastSearchQueryRef.current = searchQuery;
        return;
      }

      setPostsLoading(true);
      try {
        const results = await searchPosts(searchQuery, 20); // 20件まで検索
        setSearchedPosts(results);
      } catch (error) {
        console.error('Failed to search posts:', error);
        // フォールバック: 現在のpostsからフィルタリング
        setSearchedPosts(posts.filter(p =>
          p.content.toLowerCase().includes(searchQuery.toLowerCase())
        ));
      } finally {
        setPostsLoading(false);
        lastSearchQueryRef.current = searchQuery;
      }
    }, 300); // 300ms のデバウンス

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchPosts, posts]); // 必要な依存関係のみ

  // 表示用の投稿リスト
  const filteredPosts = isUserIdSearch ? [] : searchedPosts;

  // ユーザーアカウントで検索
  const filteredUserAccounts = allAccounts.filter(account => {
    if (isUserIdSearch) {
      // @検索の場合はaccount_idで検索
      return account.account_id.toLowerCase().includes(userIdQuery);
    } else {
      // 通常検索の場合は名前で検索
      return account.name.toLowerCase().includes(query);
    }
  });

  // NPC検索
  const filteredNPCs = npcs.filter(npc => {
    if (isUserIdSearch) {
      // @検索の場合はaccount_idで検索
      return npc.account_id.toLowerCase().includes(userIdQuery);
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
                            <p className="text-sm text-gray-500 truncate">@{user.account_id}</p>
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
                {(filteredPosts.length > 0 || postsLoading) && (
                  <div>
                    <h3 className="font-bold text-lg mb-3 text-gray-800">
                      投稿 ({filteredPosts.length}){postsLoading && ' - 検索中...'}
                    </h3>
                    {postsLoading && filteredPosts.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        <p>投稿を検索しています...</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200 bg-white rounded-lg border border-gray-200">
                        {filteredPosts.map(post => (
                          <PostComponent key={post.id} post={post} onUserSelect={onUserSelect} />
                        ))}
                      </div>
                    )}
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