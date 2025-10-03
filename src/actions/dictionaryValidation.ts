'use server'

import { z } from 'zod';
import { DictionaryContent } from '@/types/dictionary';

const UsageExampleSchema = z.object({
  example: z.string(),
  meaning: z.string(),
});

const RelatedTermSchema = z.object({
  term: z.string(),
  relation: z.string(),
});

const DictionaryContentSchema = z.object({
  term: z.string(),
  reading: z.string(),
  partOfSpeech: z.string(),
  definitions: z.array(z.string()),
  etymology: z.string(),
  usageExamples: z.array(UsageExampleSchema),
  relatedTerms: z.array(RelatedTermSchema),
  notes: z.string(),
});

/**
 * DictionaryContentのバリデーション
 * @param data - 未検証データ
 * @returns DictionaryContent - バリデーション済みデータ
 */
export async function validateDictionaryContent(data: unknown): Promise<DictionaryContent> {
  return DictionaryContentSchema.parse(data);
}
