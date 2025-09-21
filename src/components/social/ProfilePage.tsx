import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SocialAccount, SocialNPC, UISocialPost, getDisplayUserId } from '@/types/social';
import { PostComponent } from './PostComponent';
import { getUserAccountPosts } from '@/actions/social';
import {
  Mail,
  MapPin,
  Calendar,
  Gift,
  Briefcase,
  GraduationCap,
  Loader2,
} from 'lucide-react';

interface ProfilePageProps {
  activeAccount: SocialAccount | SocialNPC;
  onStartDM: (user: SocialAccount | SocialNPC) => void;
  isMyProfile: boolean;
  onUserSelect: (userId: string) => void;
  onEditProfile?: () => void;
}

/**
 * ユーザープロフィールページコンポーネント
 */
export const ProfilePage: React.FC<ProfilePageProps> = ({
  activeAccount,
  onStartDM,
  isMyProfile,
  onUserSelect,
  onEditProfile
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

    // 自分のプロフィールではない場合は投稿を読み込まない
    if (!isMyProfile) {
      setHasMore(false);
      return;
    }

    setLoading(true);
    try {
      const result = await getUserAccountPosts(
        activeAccount.id,
        10,
        reset ? undefined : cursor
      );

      const uiPosts: UISocialPost[] = result.items.map(post => ({
        ...post,
        timeString: formatTimestamp(post.timestamp),
        author: {
          id: activeAccount.id,
          account_id: activeAccount.account_id,
          name: activeAccount.name,
          avatar: activeAccount.avatar,
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
  }, [activeAccount, isMyProfile, loading, hasMore, cursor]);

  // refに最新の関数を保存
  loadUserPostsRef.current = loadUserPosts;

  // 初回読み込み
  useEffect(() => {
    if (isMyProfile && loadUserPostsRef.current) {
      loadUserPostsRef.current(true);
    }
  }, [activeAccount.id, isMyProfile]);

  // さらに読み込むボタンのハンドラ
  const handleLoadMore = () => {
    loadUserPosts(false);
  };

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
              <p className="text-gray-600">{getDisplayUserId(activeAccount.account_id)}</p>
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
        {isMyProfile ? (
          posts.length > 0 ? (
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
            <div className="p-6 text-center">
              <Loader2 size={24} className="animate-spin mx-auto text-gray-400" />
              <p className="text-gray-500 mt-2">投稿を読み込んでいます...</p>
            </div>
          ) : (
            <p className="p-6 text-gray-500">まだ投稿がありません。</p>
          )
        ) : (
          <p className="p-6 text-gray-500">このプロフィールの投稿は表示できません。</p>
        )}
      </div>
    </div>
  );
};