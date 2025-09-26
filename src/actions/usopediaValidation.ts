'use server'

import { z } from 'zod';
import { UsopediaContent } from '@/types/usopedia';

const UsopediaReferenceSchema = z.object({
  title: z.string(),
  date: z.string(),
  publisher: z.string(),
});

const UsopediaRelatedContentSchema = z.object({
  title: z.string(),
});

const UsopediaChapterSchema = z.object({
  title: z.string(),
  content: z.string(),
  image: z.string().optional(),
  table: z.string().optional(),
});

const UsopediaMainContentSchema = z.object({
  chapters: z.array(UsopediaChapterSchema),
});

const UsopediaContentSchema = z.object({
  title: z.string(),
  publicDate: z.string(),
  updateDateHistory: z.array(z.string()),
  author: z.string(),
  content: UsopediaMainContentSchema,
  references: z.array(UsopediaReferenceSchema),
  relatedContents: z.array(UsopediaRelatedContentSchema),
});

/**
 * UsopediaContentのバリデーション
 * @param data
 * @returns UsopediaContent
 */
export async function validateUsopediaContent(data: unknown): Promise<UsopediaContent> {
  return UsopediaContentSchema.parse(data);
}