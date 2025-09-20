import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SocialAccount, UISocialPost, getDisplayUserId } from '@/types/social';
import { PostComponent } from './PostComponent';
import { getUserAccountPosts } from '@/actions/social';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Gift,
  Briefcase,
  GraduationCap,
  Loader2,
} from 'lucide-react';

interface InactiveUserProfilePageProps {
  account: SocialAccount;
  onBack: () => void;
  onUserSelect: (userId: string) => void;
}

/**
 * 非アクティブユーザーアカウントのプロフィールページコンポーネント
 */
export const InactiveUserProfilePage: React.FC<InactiveUserProfilePageProps> = ({
  account,
  onBack,
  onUserSelect
}) => {
  const [posts, setPosts] = useState<UISocialPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>();

  // タイムスタンプフォーマット関数
  const formatTimestamp = (timestamp: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return '1時間未満前';
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;
    return timestamp.toLocaleDateString('ja-JP');
  };

  const loadUserPostsRef = useRef<((reset?: boolean) => Promise<void>) | null>(null);

  // ユーザー投稿を読み込む関数
  const loadUserPosts = useCallback(async (reset = false) => {
    if (loading || (!hasMore && !reset)) return;

    setLoading(true);
    try {
      const result = await getUserAccountPosts(
        account.id,
        10,
        reset ? undefined : cursor
      );

      const uiPosts: UISocialPost[] = result.items.map(post => ({
        ...post,
        timeString: formatTimestamp(post.timestamp),
        author: {
          id: account.id,
          name: account.name,
          avatar: account.avatar,
        }
      }));

      if (reset) {
        setPosts(uiPosts);
      } else {
        setPosts(prev => [...prev, ...uiPosts]);
      }

      // 投稿が0件の場合は確実にhasMoreをfalseに設定
      if (result.items.length === 0) {
        setHasMore(false);
        setCursor(undefined);
      } else {
        setHasMore(result.hasMore);
        setCursor(result.lastCursor);
      }
    } catch (error) {
      console.error('Failed to load user posts:', error);
      // エラー時もhasMoreをfalseに設定して無限ループを防ぐ
      setHasMore(false);
      setCursor(undefined);
    } finally {
      setLoading(false);
    }
  }, [account.id, account.name, account.avatar, loading, hasMore, cursor]);

  // refに最新の関数を保存
  loadUserPostsRef.current = loadUserPosts;

  // 初回読み込み
  useEffect(() => {
    if (loadUserPostsRef.current) {
      loadUserPostsRef.current(true);
    }
  }, [account.id]);

  // さらに読み込むボタンのハンドラ
  const handleLoadMore = () => {
    loadUserPosts(false);
  };

  if (!account) return <div className="p-6">プロフィールが見つかりません。</div>;

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
                {account.avatar}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{account.name}</h2>
                <p className="text-gray-600">{getDisplayUserId(account.id)}</p>
                <p className="text-sm text-gray-700 mt-2 max-w-md leading-relaxed">{account.bio}</p>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              {account.location && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <MapPin size={14} />
                  <span>{account.location}</span>
                </div>
              )}
              <div className="flex items-center space-x-2 text-gray-600">
                <Calendar size={14} />
                <span>参加日: {account.createdAt ? account.createdAt.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' }) : '不明'}</span>
              </div>
              {account.birthday && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <Gift size={14} />
                  <span>誕生日: {account.birthday}</span>
                </div>
              )}
              {account.company && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <Briefcase size={14} />
                  <span>{account.company} - {account.position}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              {account.education && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <GraduationCap size={14} />
                  <span>{account.education}</span>
                </div>
              )}
              <div className="flex space-x-6 text-sm">
                <span><strong>{account.followersCount || 0}</strong> フォロー</span>
                <span><strong>{account.followingCount || 0}</strong> フォロワー</span>
              </div>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          <h3 className="p-4 font-bold text-lg bg-white">投稿一覧</h3>
          {posts.length > 0 ? (
            <>
              {posts.map(post => (
                <PostComponent key={post.id} post={post} onUserSelect={onUserSelect} />
              ))}
              {hasMore && (
                <div className="p-4 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin mr-2" />
                        読み込み中...
                      </>
                    ) : (
                      'さらに読み込む'
                    )}
                  </button>
                </div>
              )}
            </>
          ) : loading ? (
            <div className="p-8 text-center bg-white">
              <Loader2 className="animate-spin text-gray-400 mx-auto" size={24} />
              <p className="text-gray-500 mt-2">投稿を読み込み中...</p>
            </div>
          ) : (
            <div className="p-8 text-center bg-white">
              <p className="text-gray-500">投稿がありません</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};