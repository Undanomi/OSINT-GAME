'use server'

import { z } from 'zod';
import { NittaBlogContent } from '@/types/nittaBlog';

const NittaBlogChapterSchema = z.object({
  title: z.string(),
  content: z.string(),
});

const NittaBlogMainContentSchema = z.object({
  chapters: z.array(NittaBlogChapterSchema),
});

const NittaBlogAuthorSchema = z.object({
  name: z.string(),
  englishName: z.string(),
  title: z.string(),
  bio: z.string(),
  experience: z.string(),
  techStack: z.string(),
  email: z.string(),
});

const NittaBlogContentSchema = z.object({
  title: z.string(),
  publicDate: z.string(),
  content: NittaBlogMainContentSchema,
  tags: z.array(z.string()),
  author: NittaBlogAuthorSchema,
});

/**
 * NittaBlogContentのバリデーション
 * @param data - 未検証データ
 * @returns NittaBlogContent - バリデーション済みデータ
 */
export async function validateNittaBlogContent(data: unknown): Promise<NittaBlogContent> {
  return NittaBlogContentSchema.parse(data);
}