'use server'

import { z } from 'zod';
import { NyahooNewsContent } from '@/types/nyahooNews';

const NyahooNewsCommentSchema = z.object({
  user: z.string(),
  date: z.string(),
  content: z.string(),
  likes: z.number(),
});

const RelatedArticleSchema = z.object({
  title: z.string(),
  date: z.string(),
  author: z.string(),
  likes: z.number(),
  bads: z.number(),
  replys: z.number(),
});

const NyahooNewsContentSchema = z.object({
  title: z.string(),
  date: z.string(),
  publisher: z.string(),
  image: z.string(),
  caption: z.string(),
  category: z.string(),
  content: z.string(),
  likes: z.number(),
  bads: z.number(),
  bookmarks: z.number(),
  comments: z.array(NyahooNewsCommentSchema),
  relatedArticles: z.array(RelatedArticleSchema),
});

/**
 * NyahooNewsContentの検証
 * @param data - 検証するデータ
 * @returns NyahooNewsContent
 */
export async function validateNyahooNewsContent(data: unknown): Promise<NyahooNewsContent> {
  return NyahooNewsContentSchema.parse(data);
}