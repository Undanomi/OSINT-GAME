import React, { useState, useMemo } from 'react';
import { BaseApp } from '@/components/BaseApp';
import { AppProps } from '@/types/app';

import { Heart, MessageCircle, Share, MoreHorizontal, User, MapPin, Calendar, Briefcase, GraduationCap, Home, Search, Settings, UserCircle } from 'lucide-react';


// --- データ型定義 ---
interface UserProfile {
  id: string;
  name: string;
  username: string;
  avatar: string; // アバター画像のURLなどを想定
  bio: string;
  location: string;
  joinDate: string;
  company?: string;
  position?: string;
  education?: string;
  followersCount: number;
  followingCount: number;
}

interface Post {
  id: string;
  userId: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  location?: string;
}

const users: UserProfile[] = [
  {
    id: 'user1',
    name: '田中太郎',
    username: '@tanaka_taro',
    avatar: 'T',
    bio: 'ABC株式会社 マーケティング部長 | デジタル戦略とブランドマーケティングの専門家。',
    location: '東京, 日本',
    joinDate: '2019年3月',
    company: 'ABC株式会社',
    position: 'マーケティング部長',
    education: '東京大学 経済学部',
    followersCount: 1205,
    followingCount: 324,
  },
  {
    id: 'user2',
    name: '鈴木花子',
    username: '@suzuki_hanako',
    avatar: 'H',
    bio: 'フリーランスのUI/UXデザイナー。シンプルで使いやすいデザインを追求しています。',
    location: '大阪, 日本',
    joinDate: '2020年5月',
    education: '京都芸術大学',
    followersCount: 850,
    followingCount: 210,
  },
  {
    id: 'user3',
    name: '佐藤健太',
    username: '@sato_kenta_dev',
    avatar: 'K',
    bio: 'Webデベロッパー。ReactとTypeScriptが好き。趣味は登山とコーヒー。',
    location: '福岡, 日本',
    joinDate: '2018年11月',
    company: 'Tech Startup Inc.',
    position: 'フロントエンドエンジニア',
    followersCount: 1500,
    followingCount: 500,
  },
];

const posts: Post[] = [
  { id: 'p1', userId: 'user1', content: '今日はABC Cloud Proのローンチイベントでした！チーム全員での3ヶ月の努力が実を結び、素晴らしいプロダクトができました。 #プロダクトローンチ', timestamp: '2時間前', likes: 45, comments: 12, shares: 8, location: '東京, 日本' },
  { id: 'p2', userId: 'user1', content: '愛犬のポチと代々木公園を散歩中。天気が良くて気持ちいい！', timestamp: '5時間前', likes: 32, comments: 18, shares: 3, location: '代々木公園, 東京' },
  { id: 'p3', userId: 'user2', content: '新しいポートフォリオサイトを公開しました！ぜひご覧ください。フィードバックお待ちしています。 #uidesign #uxdesign', timestamp: '8時間前', likes: 120, comments: 35, shares: 20 },
  { id: 'p4', userId: 'user3', content: 'Reactの新しいバージョン、パフォーマンスがかなり改善されてるみたい。早速個人プロジェクトで試してみよう。 #react #frontend', timestamp: '1日前', likes: 98, comments: 22, shares: 15 },
  { id: 'p5', userId: 'user2', content: 'クライアントとの打ち合わせで大阪へ。美味しいてこ焼き食べたいな。', timestamp: '2日前', likes: 67, comments: 15, shares: 5, location: '大阪, 日本' },
  { id: 'p6', userId: 'user1', content: '東大経済学部の同窓会に参加してきました。久しぶりに恩師の佐藤教授にお会いできて嬉しかったです。', timestamp: '3日前', likes: 56, comments: 24, shares: 12 },
];

const currentUser = users[0];

const PostComponent = ({ post, author }: { post: Post, author: UserProfile | undefined }) => {
  if (!author) return null;
  return (
    <div className="bg-white p-6 border-b border-gray-200">
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 text-gray-600 font-bold">
          {author.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-gray-900">{author.name}</h3>
            <span className="text-gray-500 text-sm">{author.username}</span>
            <span className="text-gray-500 text-sm">•</span>
            <span className="text-gray-500 text-sm">{post.timestamp}</span>
          </div>
          <p className="mt-2 text-gray-800 leading-relaxed">{post.content}</p>
          <div className="flex items-center justify-between mt-4 max-w-md">
            <button className="flex items-center space-x-2 text-gray-500 hover:text-pink-600 transition-colors">
              <Heart size={18} /> <span className="text-sm">{post.likes}</span>
            </button>
            <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors">
              <MessageCircle size={18} /> <span className="text-sm">{post.comments}</span>
            </button>
            <button className="flex items-center space-x-2 text-gray-500 hover:text-green-600 transition-colors">
              <Share size={18} /> <span className="text-sm">{post.shares}</span>
            </button>
            <button className="text-gray-500 hover:text-gray-700 transition-colors">
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfilePage = ({ user, userPosts }: { user: UserProfile, userPosts: Post[] }) => {
  return (
    <div>
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-2xl font-bold">
              {user.avatar}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{user.name}</h2>
              <p className="text-gray-600">{user.username}</p>
              <p className="text-sm text-gray-700 mt-2 max-w-md leading-relaxed">{user.bio}</p>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-gray-600"><MapPin size={14} /><span>{user.location}</span></div>
            <div className="flex items-center space-x-2 text-gray-600"><Calendar size={14} /><span>参加日: {user.joinDate}</span></div>
            {user.company && <div className="flex items-center space-x-2 text-gray-600"><Briefcase size={14} /><span>{user.company} - {user.position}</span></div>}
          </div>
          <div className="space-y-2">
            {user.education && <div className="flex items-center space-x-2 text-gray-600"><GraduationCap size={14} /><span>{user.education}</span></div>}
            <div className="flex space-x-6 text-sm">
              <span><strong>{user.followingCount}</strong> フォロー</span>
              <span><strong>{user.followersCount}</strong> フォロワー</span>
            </div>
          </div>
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        <h3 className="p-4 font-bold text-lg">投稿一覧</h3>
        {userPosts.length > 0 ? (
          userPosts.map(post => <PostComponent key={post.id} post={post} author={user} />)
        ) : (
          <p className="p-6 text-gray-500">まだ投稿がありません。</p>
        )}
      </div>
    </div>
  );
};

const SearchPage = ({ onUserSelect }: { onUserSelect: (userId: string) => void }) => {
    const [query, setQuery] = useState('');

    const filteredUsers = useMemo(() => {
        if (!query) return [];
        return users.filter(user =>
            user.name.toLowerCase().includes(query.toLowerCase()) ||
            user.username.toLowerCase().includes(query.toLowerCase())
        );
    }, [query]);

    const filteredPosts = useMemo(() => {
        if (!query) return [];
        return posts.filter(post =>
            post.content.toLowerCase().includes(query.toLowerCase())
        );
    }, [query]);

    return (
        <div className="p-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="ユーザーや投稿を検索"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <div className="mt-6">
                {query && (
                    <>
                        {filteredUsers.length > 0 && (
                            <div className="mb-6">
                                <h3 className="font-bold text-lg mb-2">ユーザー</h3>
                                <div className="space-y-2">
                                    {filteredUsers.map(user => (
                                        <div key={user.id} onClick={() => onUserSelect(user.id)} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
                                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-bold">{user.avatar}</div>
                                            <div>
                                                <p className="font-semibold">{user.name}</p>
                                                <p className="text-sm text-gray-500">{user.username}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {filteredPosts.length > 0 && (
                            <div>
                                <h3 className="font-bold text-lg mb-2">投稿</h3>
                                <div className="divide-y divide-gray-200">
                                    {filteredPosts.map(post => (
                                        <PostComponent key={post.id} post={post} author={users.find(u => u.id === post.userId)} />
                                    ))}
                                </div>
                            </div>
                        )}
                        {filteredUsers.length === 0 && filteredPosts.length === 0 && (
                            <p className="text-center text-gray-500 mt-8">「{query}」に一致する結果は見つかりませんでした。</p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

const MorePage = () => {
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">機能一覧</h2>
      <div className="space-y-2">
        <button className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-100 border">アカウント設定</button>
        <button className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-100 border">新規アカウント作成</button>
        <button className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-100 border">プライバシーポリシー</button>
        <button className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-100 border">ログアウト</button>
      </div>
    </div>
  );
};

type View = 'home' | 'search' | 'profile' | 'my-profile' | 'more';

export const SocialApp: React.FC<AppProps> = ({ windowId, isActive }) => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    setCurrentView('profile');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return (
          <div className="divide-y divide-gray-200">
            {posts.map(post => (
              <PostComponent key={post.id} post={post} author={users.find(u => u.id === post.userId)} />
            ))}
          </div>
        );
      case 'search':
        return <SearchPage onUserSelect={handleUserSelect} />;
      case 'profile':
        const selectedUser = users.find(u => u.id === selectedUserId);
        if (selectedUser) {
          const userPosts = posts.filter(p => p.userId === selectedUserId);
          return <ProfilePage user={selectedUser} userPosts={userPosts} />;
        }
        return <p>ユーザーが見つかりません。</p>;
      case 'my-profile':
        const myPosts = posts.filter(p => p.userId === currentUser.id);
        return <ProfilePage user={currentUser} userPosts={myPosts} />;
      case 'more':
        return <MorePage />;
      default:
        return <div>ホーム</div>;
    }
  };

  return (
    <BaseApp windowId={windowId} isActive={isActive} statusBar="SNSアプリケーション">
      <div className="h-full bg-gray-50 flex flex-col">
        <div className="flex-1 overflow-auto pb-16">
          {renderContent()}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex justify-around items-center">
          <button onClick={() => setCurrentView('home')} className={`p-2 rounded-full transition-colors ${currentView === 'home' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-100'}`}><Home size={24} /></button>
          <button onClick={() => setCurrentView('search')} className={`p-2 rounded-full transition-colors ${currentView === 'search' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-100'}`}><Search size={24} /></button>
          <button onClick={() => setCurrentView('my-profile')} className={`p-2 rounded-full transition-colors ${currentView === 'my-profile' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-100'}`}><UserCircle size={24} /></button>
          <button onClick={() => setCurrentView('more')} className={`p-2 rounded-full transition-colors ${currentView === 'more' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-100'}`}><Settings size={24} /></button>
        </div>
      </div>
    </BaseApp>
  );
};

export default SocialApp;
