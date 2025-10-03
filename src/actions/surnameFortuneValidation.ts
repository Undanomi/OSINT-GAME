'use server'

import { z } from 'zod';
import { SurnameFortuneContent } from '@/types/surnameFortune';

const FortuneCategorySchema = z.object({
  category: z.string(),
  score: z.number().min(1).max(100),
  description: z.string(),
});

const SurnameFortuneContentSchema = z.object({
  surname: z.string(),
  reading: z.string(),
  origin: z.string(),
  meaning: z.string(),
  totalScore: z.number().min(1).max(100),
  luckyColor: z.string(),
  luckyNumber: z.number(),
  luckyItem: z.string(),
  fortuneCategories: z.array(FortuneCategorySchema),
  compatibility: z.object({
    good: z.array(z.string()),
    bad: z.array(z.string()),
  }),
  advice: z.string(),
});

/**
 * SurnameFortuneContentのバリデーション
 * @param data - 未検証データ
 * @returns SurnameFortuneContent - バリデーション済みデータ
 */
export async function validateSurnameFortuneContent(data: unknown): Promise<SurnameFortuneContent> {
  return SurnameFortuneContentSchema.parse(data);
}
