import React, { useState, useEffect, useCallback, useRef, UIEvent } from 'react';
import { SocialNPC, UISocialPost, getDisplayUserId } from '@/types/social';
import { PostComponent } from './PostComponent';
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
  loadInitialNPCPosts: (npcId: string) => Promise<void>;
  loadMoreNPCPosts: (npcId: string) => Promise<void>;
  npcPosts: (npcId: string) => { posts: UISocialPost[]; hasMore: boolean };
}

/**
 * NPCプロフィールページコンポーネント
 */
export const NPCProfilePage: React.FC<NPCProfilePageProps> = ({
  npc,
  onStartDM,
  onBack,
  onUserSelect,
  loadInitialNPCPosts,
  loadMoreNPCPosts,
  npcPosts
}) => {
  const [posts, setPosts] = useState<UISocialPost[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 初回読み込み
  useEffect(() => {
    loadInitialNPCPosts(npc.id);
  }, [npc.id, loadInitialNPCPosts]);

  // storeから投稿を取得
  useEffect(() => {
    const { posts: postsData, hasMore: hasMoreData } = npcPosts(npc.id);
    setPosts(postsData);
    setHasMore(hasMoreData);
  }, [npc.id, npcPosts]);

  // 無限スクロール処理
  const handleScroll = useCallback(async (e: UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 100 && hasMore && !isLoadingMore) {
      setIsLoadingMore(true);
      await loadMoreNPCPosts(npc.id);
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, npc.id, loadMoreNPCPosts]);


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

      <div className="flex-1 overflow-y-auto" ref={scrollContainerRef} onScroll={handleScroll}>
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-2xl font-bold">
                {npc.avatar}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{npc.name}</h2>
                <p className="text-gray-600">{getDisplayUserId(npc.account_id)}</p>
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
                <span>参加日: {npc.createdAt ? npc.createdAt.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' }) : '不明'}</span>
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
              {isLoadingMore && (
                <div className="p-4 text-center">
                  <Loader2 size={16} className="animate-spin mx-auto text-gray-400" />
                  <p className="text-gray-500 mt-2">さらに読み込み中...</p>
                </div>
              )}
            </>
          ) : (
            <p className="p-6 text-gray-500">まだ投稿がありません。</p>
          )}
        </div>
      </div>
    </div>
  );
};