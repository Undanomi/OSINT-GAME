'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { doc, getDoc } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { FacelookUser } from '@/types/facelook';
import { UnifiedSearchResult, FacelookContent } from '@/types/search';
import { 
  Search, Home, Users, PlayCircle, Store, Menu, 
  MessageCircle, Bell, ChevronDown, ThumbsUp, MessageSquare, 
  Share2, MoreHorizontal, MapPin, Briefcase, GraduationCap,
  Heart, Calendar, Globe, Camera, Video, Smile
} from 'lucide-react';

interface FacelookProfilePageProps {
  documentId: string; // Firestore document ID
}

export const FacelookProfilePage: React.FC<FacelookProfilePageProps> = ({ documentId }) => {
  const [userData, setUserData] = useState<FacelookUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log('Fetching document with ID:', documentId);
        
        // 統一された構造からデータを取得
        const docRef = doc(db, 'search_results', documentId);
        console.log('Document path:', docRef.path);
        
        const docSnapshot = await getDoc(docRef);
        console.log('Document exists:', docSnapshot.exists());
        
        if (docSnapshot.exists()) {
          const searchResult = docSnapshot.data() as UnifiedSearchResult;
          console.log('Raw search result:', searchResult);
          
          // templateがFacelookProfilePageであることを確認
          if (searchResult.template !== 'FacelookProfilePage') {
            console.error('Invalid template for Facelook:', searchResult.template);
            throw new Error('Invalid template');
          }
          
          // contentをFacelookContentとして扱う
          const facelookContent = searchResult.content as FacelookContent;
          
          // FacelookUser形式に変換（userIdはドキュメントIDを使用）
          const data: FacelookUser = {
            userId: documentId, // ドキュメントIDをuserIdとして使用
            name: facelookContent.name,
            profileImage: facelookContent.profileImage,
            coverImage: facelookContent.coverImage,
            job: facelookContent.job,
            company: facelookContent.company,
            location: facelookContent.location,
            hometown: facelookContent.hometown,
            education: facelookContent.education,
            relationshipStatus: facelookContent.relationshipStatus,
            bio: facelookContent.bio,
            friendsCount: facelookContent.friendsCount,
            joined: facelookContent.joined,
            website: facelookContent.website,
            posts: facelookContent.posts, // IDは不要（インデックスをkeyに使用）
            friends: facelookContent.friends, // IDは不要（インデックスをkeyに使用）
            photos: facelookContent.photos
          };
          console.log('Raw data from Firestore:', data);
          
          // gs:// URLをHTTPS URLに変換
          if (data.profileImage?.startsWith('gs://')) {
            console.log('Converting profile image:', data.profileImage);
            data.profileImage = await getDownloadURL(ref(storage, data.profileImage));
            console.log('Converted to:', data.profileImage);
          }
          if (data.coverImage?.startsWith('gs://')) {
            console.log('Converting cover image:', data.coverImage);
            data.coverImage = await getDownloadURL(ref(storage, data.coverImage));
            console.log('Converted to:', data.coverImage);
          }
          
          // 投稿画像のURL変換
          for (const post of data.posts) {
            if (post.image?.startsWith('gs://')) {
              console.log('Converting post image:', post.image);
              post.image = await getDownloadURL(ref(storage, post.image));
              console.log('Converted to:', post.image);
            }
          }
          
          // 友達のプロフィール画像URL変換
          for (const friend of data.friends) {
            if (friend.profileImage?.startsWith('gs://')) {
              friend.profileImage = await getDownloadURL(ref(storage, friend.profileImage));
            }
          }
          
          // フォトギャラリーのURL変換
          for (let i = 0; i < data.photos.length; i++) {
            if (data.photos[i]?.startsWith('gs://')) {
              data.photos[i] = await getDownloadURL(ref(storage, data.photos[i]));
            }
          }
          
          console.log('Final data after URL conversion:', data);
          setUserData(data);
        } else {
          console.log('Document does not exist, using mock data');
          // モックデータを使用
          setUserData(getMockData());
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        console.error('Error details:', {
          message: (error as any).message,
          code: (error as any).code,
          stack: (error as any).stack,
          fullError: error
        });
        console.log('Attempted path:', `search_results/${documentId}`);
        console.log('Firebase config:', {
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
        });
        // エラー時はモックデータを使用
        setUserData(getMockData());
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [documentId]);

  const getMockData = (): FacelookUser => ({
    userId: 'user001',
    name: '山田 太郎',
    profileImage: 'https://via.placeholder.com/168',
    coverImage: 'https://via.placeholder.com/940x348',
    job: 'ソフトウェアエンジニア',
    company: 'Tech Solutions Inc.',
    location: '東京都渋谷区',
    hometown: '大阪府大阪市',
    education: '東京工業大学',
    relationshipStatus: '既婚',
    bio: 'テクノロジーとイノベーションに情熱を注ぐエンジニア。週末はハイキングとコーディングを楽しんでいます。',
    friendsCount: 523,
    joined: '2015年3月',
    website: 'https://yamada-taro.dev',
    posts: [
      {
        id: '1',
        content: '新しいプロジェクトのキックオフミーティングが終わりました！チーム全員のモチベーションが高くて、これからが楽しみです。#TeamWork #Innovation',
        timestamp: '2時間前',
        likes: 42,
        comments: 5,
        shares: 2
      },
      {
        id: '2',
        content: '週末は家族と一緒に箱根に行ってきました。自然の中でリフレッシュできました。',
        image: 'https://via.placeholder.com/600x400',
        timestamp: '昨日 18:30',
        likes: 128,
        comments: 23,
        shares: 8
      },
      {
        id: '3',
        content: 'React 18の新機能について勉強中。Suspenseの使い方がようやく理解できてきた気がする。',
        timestamp: '3日前',
        likes: 67,
        comments: 12,
        shares: 15
      }
    ],
    friends: [
      { id: 'f1', name: '佐藤 花子', profileImage: 'https://via.placeholder.com/40', mutualFriends: 12 },
      { id: 'f2', name: '鈴木 一郎', profileImage: 'https://via.placeholder.com/40', mutualFriends: 8 },
      { id: 'f3', name: '高橋 美咲', profileImage: 'https://via.placeholder.com/40', mutualFriends: 23 },
      { id: 'f4', name: '田中 健太', profileImage: 'https://via.placeholder.com/40', mutualFriends: 5 },
      { id: 'f5', name: '伊藤 さくら', profileImage: 'https://via.placeholder.com/40', mutualFriends: 15 },
      { id: 'f6', name: '渡辺 大輔', profileImage: 'https://via.placeholder.com/40', mutualFriends: 7 }
    ],
    photos: [
      'https://via.placeholder.com/200',
      'https://via.placeholder.com/200',
      'https://via.placeholder.com/200',
      'https://via.placeholder.com/200',
      'https://via.placeholder.com/200',
      'https://via.placeholder.com/200',
      'https://via.placeholder.com/200',
      'https://via.placeholder.com/200',
      'https://via.placeholder.com/200'
    ]
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-xl text-gray-600">ユーザーが見つかりません</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-300 sticky top-0 z-50">
        <div className="max-w-full px-2 sm:px-4">
          <div className="flex items-center justify-between h-14">
            {/* Left section */}
            <div className="flex items-center flex-1">
              <div className="text-2xl font-bold text-[#1877f2] mr-2">f</div>
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Facelookを検索"
                  className="bg-gray-100 rounded-full pl-10 pr-4 py-2 w-60 focus:outline-none"
                />
              </div>
            </div>

            {/* Center section - Navigation */}
            <nav className="hidden lg:flex items-center space-x-2">
              <button className="px-8 py-2 hover:bg-gray-100 rounded-lg text-[#1877f2] border-b-3 border-[#1877f2]">
                <Home className="w-6 h-6" />
              </button>
              <button className="px-8 py-2 hover:bg-gray-100 rounded-lg text-gray-600">
                <Users className="w-6 h-6" />
              </button>
              <button className="px-8 py-2 hover:bg-gray-100 rounded-lg text-gray-600">
                <PlayCircle className="w-6 h-6" />
              </button>
              <button className="px-8 py-2 hover:bg-gray-100 rounded-lg text-gray-600">
                <Store className="w-6 h-6" />
              </button>
              <button className="px-8 py-2 hover:bg-gray-100 rounded-lg text-gray-600">
                <Users className="w-6 h-6" />
              </button>
            </nav>

            {/* Right section */}
            <div className="flex items-center space-x-2 flex-1 justify-end">
              <button className="p-2 bg-gray-200 rounded-full hover:bg-gray-300">
                <Menu className="w-5 h-5" />
              </button>
              <button className="p-2 bg-gray-200 rounded-full hover:bg-gray-300">
                <MessageCircle className="w-5 h-5" />
              </button>
              <button className="p-2 bg-gray-200 rounded-full hover:bg-gray-300">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-gray-200 rounded-full">
                <Image 
                  src={userData.profileImage} 
                  alt="Profile" 
                  width={28} 
                  height={28} 
                  className="rounded-full" 
                  unoptimized
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Profile Section */}
      <div className="bg-white">
        {/* Cover Photo */}
        <div className="relative">
          <div className="h-[200px] sm:h-[250px] md:h-[300px] lg:h-[348px] bg-gradient-to-b from-gray-300 to-gray-400 relative">
            <Image 
              src={userData.coverImage} 
              alt="Cover" 
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <button className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-100">
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">カバー写真を編集</span>
          </button>
        </div>

        {/* Profile Info */}
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-8 sm:-mt-12 pb-4">
            {/* Profile Picture */}
            <div className="relative">
              <div className="w-32 h-32 sm:w-40 sm:h-40 relative">
                <Image
                  src={userData.profileImage}
                  alt={userData.name}
                  fill
                  className="rounded-full border-4 border-white bg-white object-cover"
                  unoptimized
                />
              </div>
              <button className="absolute bottom-2 right-2 bg-gray-200 p-2 rounded-full hover:bg-gray-300">
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Name and Friends */}
            <div className="flex-1 sm:ml-6 text-center sm:text-left mt-4 sm:mt-0">
              <h1 className="text-2xl sm:text-3xl font-bold">{userData.name}</h1>
              <p className="text-gray-600 mt-1">{userData.friendsCount} 人の友達</p>
              <div className="flex -space-x-2 mt-2 justify-center sm:justify-start">
                {userData.friends.slice(0, 8).map((friend, idx) => (
                  <div key={idx} className="w-8 h-8 relative">
                    <Image
                      src={friend.profileImage}
                      alt={friend.name}
                      fill
                      className="rounded-full border-2 border-white object-cover"
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 mt-4 sm:mt-0">
              <button className="bg-[#1877f2] text-white px-4 py-2 rounded-lg hover:bg-[#166fe5] flex items-center space-x-2">
                <span>友達を追加</span>
              </button>
              <button className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 flex items-center space-x-2">
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">メッセージ</span>
              </button>
              <button className="bg-gray-200 p-2 rounded-lg hover:bg-gray-300">
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-t mt-4">
            <nav className="flex space-x-1 overflow-x-auto">
              <button 
                onClick={() => setActiveTab('posts')}
                className={`px-4 py-3 font-medium hover:bg-gray-100 rounded-lg ${
                  activeTab === 'posts' ? 'text-[#1877f2] border-b-3 border-[#1877f2]' : 'text-gray-600'
                }`}
              >
                投稿
              </button>
              <button 
                onClick={() => setActiveTab('about')}
                className={`px-4 py-3 font-medium hover:bg-gray-100 rounded-lg ${
                  activeTab === 'about' ? 'text-[#1877f2] border-b-3 border-[#1877f2]' : 'text-gray-600'
                }`}
              >
                基本データ
              </button>
              <button 
                onClick={() => setActiveTab('friends')}
                className={`px-4 py-3 font-medium hover:bg-gray-100 rounded-lg ${
                  activeTab === 'friends' ? 'text-[#1877f2] border-b-3 border-[#1877f2]' : 'text-gray-600'
                }`}
              >
                友達
              </button>
              <button 
                onClick={() => setActiveTab('photos')}
                className={`px-4 py-3 font-medium hover:bg-gray-100 rounded-lg ${
                  activeTab === 'photos' ? 'text-[#1877f2] border-b-3 border-[#1877f2]' : 'text-gray-600'
                }`}
              >
                写真
              </button>
              <button className="px-4 py-3 font-medium text-gray-600 hover:bg-gray-100 rounded-lg">
                動画
              </button>
              <button className="px-4 py-3 font-medium text-gray-600 hover:bg-gray-100 rounded-lg">
                その他
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Intro Card */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-xl font-bold mb-4">自己紹介</h2>
              <p className="text-gray-700 mb-4">{userData.bio}</p>
              
              <div className="space-y-3">
                {userData.job && (
                  <div className="flex items-center space-x-3">
                    <Briefcase className="w-5 h-5 text-gray-500" />
                    <span>
                      <span className="font-medium">{userData.job}</span>
                      {userData.company && <span className="text-gray-600"> · {userData.company}</span>}
                    </span>
                  </div>
                )}
                {userData.education && (
                  <div className="flex items-center space-x-3">
                    <GraduationCap className="w-5 h-5 text-gray-500" />
                    <span>{userData.education}に在学</span>
                  </div>
                )}
                {userData.location && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-gray-500" />
                    <span>{userData.location}在住</span>
                  </div>
                )}
                {userData.hometown && (
                  <div className="flex items-center space-x-3">
                    <Home className="w-5 h-5 text-gray-500" />
                    <span>{userData.hometown}出身</span>
                  </div>
                )}
                {userData.relationshipStatus && (
                  <div className="flex items-center space-x-3">
                    <Heart className="w-5 h-5 text-gray-500" />
                    <span>{userData.relationshipStatus}</span>
                  </div>
                )}
                {userData.joined && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <span>{userData.joined}にFacelookに参加</span>
                  </div>
                )}
                {userData.website && (
                  <div className="flex items-center space-x-3">
                    <Globe className="w-5 h-5 text-gray-500" />
                    <a href={userData.website} className="text-[#1877f2] hover:underline">
                      {userData.website.replace('https://', '')}
                    </a>
                  </div>
                )}
              </div>

              <button className="w-full mt-4 bg-gray-200 py-2 rounded-lg hover:bg-gray-300 font-medium">
                自己紹介を編集
              </button>
            </div>

            {/* Photos Card */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">写真</h2>
                <a href="#" className="text-[#1877f2] hover:underline">すべて見る</a>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {userData.photos.slice(0, 9).map((photo, idx) => (
                  <div key={idx} className="relative h-24">
                    <Image
                      src={photo}
                      alt={`Photo ${idx + 1}`}
                      fill
                      className="object-cover rounded-lg cursor-pointer hover:opacity-90"
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Friends Card */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-bold">友達</h2>
                  <p className="text-gray-600">{userData.friendsCount}人の友達</p>
                </div>
                <a href="#" className="text-[#1877f2] hover:underline">すべて見る</a>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {userData.friends.slice(0, 9).map((friend, idx) => (
                  <div key={idx} className="text-center">
                    <div className="relative h-24">
                      <Image
                        src={friend.profileImage}
                        alt={friend.name}
                        fill
                        className="object-cover rounded-lg cursor-pointer hover:opacity-90"
                        unoptimized
                      />
                    </div>
                    <p className="text-sm mt-1 truncate">{friend.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-4">
            {/* Create Post */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex space-x-3">
                <div className="w-10 h-10 relative flex-shrink-0">
                  <Image
                    src={userData.profileImage}
                    alt={userData.name}
                    fill
                    className="rounded-full object-cover"
                    unoptimized
                  />
                </div>
                <button className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-left text-gray-500 hover:bg-gray-200">
                  {userData.name}さん、その気持ち、シェアしよう
                </button>
              </div>
              <div className="flex justify-around mt-3 pt-3 border-t">
                <button className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 rounded-lg">
                  <Video className="w-5 h-5 text-red-500" />
                  <span className="text-gray-600">ライブ動画</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 rounded-lg">
                  <Camera className="w-5 h-5 text-green-500" />
                  <span className="text-gray-600">写真/動画</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 rounded-lg">
                  <Smile className="w-5 h-5 text-yellow-500" />
                  <span className="text-gray-600">気分/アクティビティ</span>
                </button>
              </div>
            </div>

            {/* Posts */}
            {userData.posts.map((post, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow">
                {/* Post Header */}
                <div className="p-4">
                  <div className="flex justify-between">
                    <div className="flex space-x-3">
                      <div className="w-10 h-10 relative flex-shrink-0">
                        <Image
                          src={userData.profileImage}
                          alt={userData.name}
                          fill
                          className="rounded-full object-cover"
                          unoptimized
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold">{userData.name}</h3>
                        <p className="text-sm text-gray-500">{post.timestamp}</p>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded-full">
                      <MoreHorizontal className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>

                  {/* Post Content */}
                  <div className="mt-3">
                    <p className="text-gray-800">{post.content}</p>
                  </div>
                </div>

                {/* Post Image */}
                {post.image && (
                  <div className="relative w-full h-[400px]">
                    <Image
                      src={post.image}
                      alt="Post"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}

                {/* Post Stats */}
                <div className="px-4 py-2">
                  <div className="flex justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <div className="bg-[#1877f2] rounded-full p-1">
                        <ThumbsUp className="w-3 h-3 text-white fill-white" />
                      </div>
                      <span>{post.likes}</span>
                    </div>
                    <div className="flex space-x-4">
                      <span>{post.comments}件のコメント</span>
                      {post.shares && <span>{post.shares}件のシェア</span>}
                    </div>
                  </div>
                </div>

                {/* Post Actions */}
                <div className="px-4 py-2 border-t">
                  <div className="flex justify-around">
                    <button className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 rounded-lg">
                      <ThumbsUp className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-600">いいね！</span>
                    </button>
                    <button className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 rounded-lg">
                      <MessageSquare className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-600">コメント</span>
                    </button>
                    <button className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 rounded-lg">
                      <Share2 className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-600">シェア</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};