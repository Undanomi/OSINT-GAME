'use server'

import { z } from 'zod';
import { BBSThreadContent } from '@/types/bbs';

const BBSPostSchema = z.object({
  number: z.number(),
  name: z.string(),
  date: z.string(),
  id: z.string(),
  content: z.string(),
});

const BBSThreadContentSchema = z.object({
  boardName: z.string(),
  threadTitle: z.string(),
  threadNumber: z.number(),
  posts: z.array(BBSPostSchema),
  totalPosts: z.number(),
});

/**
 * BBSThreadContentのバリデーション
 * @param data - 未検証データ
 * @returns BBSThreadContent - バリデーション済みデータ
 */
export async function validateBBSThreadContent(data: unknown): Promise<BBSThreadContent> {
  return BBSThreadContentSchema.parse(data);
}
