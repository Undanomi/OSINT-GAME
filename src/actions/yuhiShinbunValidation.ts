'use server'

import { z } from 'zod';
import { YuhiShinbunContent } from '@/types/yuhishinbun';

// Zodスキーマ定義
const RelatedArticleSchema = z.object({
  title: z.string(),
  image: z.string(),
  abstract: z.string(),
  tags: z.array(z.string()),
});

const YuhiShinbunContentSchema = z.object({
  title: z.string(),
  date: z.string(),
  author: z.string(),
  image: z.string(),
  caption: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
  readTime: z.number(),
  relatedArticles: z.array(RelatedArticleSchema),
});

/**
 * YuhiShinbunContentのバリデーション
 * @param data - 未検証データ
 * @returns YuhiShinbunContent
 */
export async function validateYuhiShinbunContent(data: unknown): Promise<YuhiShinbunContent> {
  return YuhiShinbunContentSchema.parse(data);
}
