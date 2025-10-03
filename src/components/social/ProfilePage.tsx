import React, { useState, useEffect, useRef } from 'react';
import { SocialAccount, UISocialPost, getDisplayUserId } from '@/types/social';
import { PostComponent } from './PostComponent';
import {
  MapPin,
  Calendar,
  Gift,
  Briefcase,
  GraduationCap,
} from 'lucide-react';

interface ProfilePageProps {
  activeAccount: SocialAccount;
  onUserSelect: (userId: string) => void;
  onEditProfile: () => void;
  accountPosts: (accountId: string) => UISocialPost[];
}

/**
 * ユーザープロフィールページコンポーネント
 */
export const ProfilePage: React.FC<ProfilePageProps> = ({
  activeAccount,
  onUserSelect,
  onEditProfile,
  accountPosts
}) => {
  const [posts, setPosts] = useState<UISocialPost[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // storeから投稿を取得
  useEffect(() => {
    const postsData = accountPosts(activeAccount.id);
    setPosts(postsData);
  }, [activeAccount.id, accountPosts]);


  if (!activeAccount) return <div className="p-6">プロフィールが見つかりません。</div>;

  return (
    <div className="h-full overflow-y-auto" ref={scrollContainerRef}>
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
          <button
            onClick={onEditProfile}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex-shrink-0 h-fit"
          >
            編集
          </button>
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
        {posts.length > 0 ? (
          posts.map(post => (
            <PostComponent key={post.id} post={post} onUserSelect={onUserSelect} />
          ))
        ) : (
          <p className="p-6 text-gray-500">まだ投稿がありません。</p>
        )}
      </div>
    </div>
  );
};