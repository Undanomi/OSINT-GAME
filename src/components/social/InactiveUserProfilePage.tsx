import React, { useState, useEffect, useRef } from 'react';
import { SocialAccount, UISocialPost, getDisplayUserId } from '@/types/social';
import { PostComponent } from './PostComponent';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Gift,
  Briefcase,
  GraduationCap,
} from 'lucide-react';

interface InactiveUserProfilePageProps {
  account: SocialAccount;
  onBack: () => void;
  onUserSelect: (userId: string) => void;
  accountPosts: (accountId: string) => UISocialPost[];
}

/**
 * 非アクティブユーザーアカウントのプロフィールページコンポーネント
 */
export const InactiveUserProfilePage: React.FC<InactiveUserProfilePageProps> = ({
  account,
  onBack,
  onUserSelect,
  accountPosts
}) => {
  const [posts, setPosts] = useState<UISocialPost[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // storeから投稿を取得
  useEffect(() => {
    const postsData = accountPosts(account.id);
    setPosts(postsData);
  }, [account.id, accountPosts]);


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

      <div className="flex-1 overflow-y-auto" ref={scrollContainerRef}>
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-2xl font-bold">
                {account.avatar}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{account.name}</h2>
                <p className="text-gray-600">{getDisplayUserId(account.account_id)}</p>
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
            posts.map(post => (
              <PostComponent key={post.id} post={post} onUserSelect={onUserSelect} />
            ))
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