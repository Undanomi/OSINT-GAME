export interface FacelookPost {
  content: string;
  image?: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares?: number;
}

export interface FacelookFriend {
  name: string;
  profileImage: string;
  mutualFriends?: number;
}

export interface FacelookUser {
  userId: string;
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
  friendsCount?: number;
  posts: FacelookPost[];
  friends: FacelookFriend[];
  photos: string[];
  joined?: string;
  website?: string;
}