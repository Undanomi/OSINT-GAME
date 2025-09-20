import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SocialNPC, UISocialPost, getDisplayUserId } from '@/types/social';
import { PostComponent } from './PostComponent';
import { getNPCPosts } from '@/actions/social';
import {
  ArrowLeft,
  Mail,
  MapPin,
  Calendar,
  Gift,
  Briefcase,
  GraduationCap,
  Loader2,
} from 'lucide-react';

interface NPCProfilePageProps {
  npc: SocialNPC;
  onStartDM: (contact: { id: string; name: string }) => void;
  onBack: () => void;
  onUserSelect: (userId: string) => void;
}

/**
 * NPCプロフィールページコンポーネント
 */
export const NPCProfilePage: React.FC<NPCProfilePageProps> = ({
  npc,
  onStartDM,
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

  const loadNPCPostsRef = useRef<((reset?: boolean) => Promise<void>) | null>(null);

  // NPC投稿を読み込む関数
  const loadNPCPosts = useCallback(async (reset = false) => {
    if (loading || (!hasMore && !reset)) return;

    setLoading(true);
    try {
      const result = await getNPCPosts(
        npc.id,
        10,
        reset ? undefined : cursor
      );

      const uiPosts: UISocialPost[] = result.items.map(post => ({
        ...post,
        timeString: formatTimestamp(post.timestamp),
        author: {
          id: npc.id,
          name: npc.name,
          avatar: npc.avatar,
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
      console.error('Failed to load NPC posts:', error);
      // エラー時もhasMoreをfalseに設定して無限ループを防ぐ
      setHasMore(false);
      setCursor(undefined);
    } finally {
      setLoading(false);
    }
  }, [npc.id, npc.name, npc.avatar, loading, hasMore, cursor]);

  // refに最新の関数を保存
  loadNPCPostsRef.current = loadNPCPosts;

  // 初回読み込み
  useEffect(() => {
    if (loadNPCPostsRef.current) {
      loadNPCPostsRef.current(true);
    }
  }, [npc.id]);

  // さらに読み込むボタンのハンドラ
  const handleLoadMore = () => {
    loadNPCPosts(false);
  };

  if (!npc) return <div className="p-6">プロフィールが見つかりません。</div>;

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
            <div className="p-6 text-center">
              <Loader2 size={24} className="animate-spin mx-auto text-gray-400" />
              <p className="text-gray-500 mt-2">投稿を読み込んでいます...</p>
            </div>
          ) : (
            <p className="p-6 text-gray-500">まだ投稿がありません。</p>
          )}
        </div>
      </div>
    </div>
  );
};