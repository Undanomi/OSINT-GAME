// 統一的な検索結果の型定義
export interface UnifiedSearchResult {
  id: string;
  title: string;
  url: string;
  description: string;
  template: string; // 使用するページコンポーネント名（アイコン判定にも使用）
  content: Record<string, any>; // ページ固有のコンテンツ
  keywords: string[]; // 検索用キーワード
}

// Facelook用のコンテンツ型（1ページ完結型）
export interface FacelookContent {
  name: string;
  profileImage: string;
  coverImage: string;
  job?: string;
  company?: string;
  location?: string;
  hometown?: string;
  education?: string;
  relationshipStatus?: string;
  bio?: string;
  friendsCount: number;
  joined: string;
  website?: string;
  posts: Array<{
    content: string;
    image?: string;
    timestamp: string;
    likes: number;
    comments: number;
    shares?: number;
  }>;
  friends: Array<{
    name: string;
    profileImage: string;
    mutualFriends: number;
  }>;
  photos: string[];
}