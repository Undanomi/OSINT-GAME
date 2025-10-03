'use server'

import { z } from 'zod';
import { SchoolReviewContent } from '@/types/schoolReview';

const SchoolReviewItemSchema = z.object({
  reviewer: z.string(),
  date: z.string(),
  rating: z.number().min(1).max(5),
  category: z.string(),
  title: z.string(),
  content: z.string(),
  helpful: z.number(),
});

const SchoolReviewContentSchema = z.object({
  schoolName: z.string(),
  schoolType: z.string(),
  location: z.string(),
  averageRating: z.number().min(1).max(5),
  totalReviews: z.number(),
  reviews: z.array(SchoolReviewItemSchema),
});

/**
 * SchoolReviewContentのバリデーション
 * @param data - 未検証データ
 * @returns SchoolReviewContent - バリデーション済みデータ
 */
export async function validateSchoolReviewContent(data: unknown): Promise<SchoolReviewContent> {
  return SchoolReviewContentSchema.parse(data);
}
