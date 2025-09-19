'use server'

import { z } from 'zod';
import { ChiitaContent } from '@/types/chiita';

// Zodスキーマ定義
const ChiitaCommentSchema = z.object({
  user: z.string(),
  date: z.string(),
  content: z.string(),
});

const ChiitaChapterSchema = z.object({
  title: z.string(),
  content: z.string(),
  image: z.string().optional(),
});

const ChiitaMainContentSchema = z.object({
  chapters: z.array(ChiitaChapterSchema),
});

const ChiitaContentSchema = z.object({
  title: z.string(),
  publicDate: z.string(),
  updateDate: z.string(),
  author: z.string(),
  content: ChiitaMainContentSchema,
  tags: z.array(z.string()),
  readTime: z.number(),
  comments: z.array(ChiitaCommentSchema),
});

/**
 * ChiitaContentのバリデーション
 * @param data
 * @returns ChiitaContent
 */
export async function validateChiitaContent(data: unknown): Promise<ChiitaContent> {
  return ChiitaContentSchema.parse(data);
}