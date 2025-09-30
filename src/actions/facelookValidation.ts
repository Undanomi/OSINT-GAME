'use server'

import { z } from 'zod';
import { FacelookContent, FacelookUser } from '@/types/facelook';

// Zodスキーマ定義
const FacelookPostSchema = z.object({
  content: z.string(),
  image: z.string().optional(),
  timestamp: z.string(),
  likes: z.number(),
  comments: z.number(),
  shares: z.number().optional(),
});

const FacelookFriendSchema = z.object({
  name: z.string(),
  profileImage: z.string(),
});

const FacelookContentSchema = z.object({
  name: z.string(),
  profileImage: z.string(),
  coverImage: z.string(),
  job: z.string().optional(),
  company: z.string().optional(),
  location: z.string().optional(),
  hometown: z.string().optional(),
  education: z.string().optional(),
  relationshipStatus: z.string().optional(),
  bio: z.string().optional(),
  friendsCount: z.number(),
  joined: z.string(),
  website: z.string().optional(),
  posts: z.array(FacelookPostSchema),
  friends: z.array(FacelookFriendSchema),
  photos: z.array(z.string()),
});

/**
 * FacelookContentのバリデーション
 * @param data - 未検証データ
 * @returns FacelookContent - バリデーション済みデータ
 */
export async function validateFacelookContent(data: unknown): Promise<FacelookContent> {
  return FacelookContentSchema.parse(data);
}

/**
 * FacelookContentをFacelookUserに変換する
 * @param facelookContent - FacelookContent
 * @param documentId - ドキュメントID (userIdとして使用)
 * @returns FacelookUser - 変換されたFacelookUser
 */
export async function convertFacelookContentToUser(
  facelookContent: FacelookContent,
  documentId: string
): Promise<FacelookUser> {
  const data: FacelookUser = {
    userId: documentId,
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
    posts: facelookContent.posts,
    friends: facelookContent.friends,
    photos: facelookContent.photos
  };
  
  return data;
}