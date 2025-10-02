'use server'

import { z } from 'zod';
import { CompanyReviewContent } from '@/types/companyReview';

const CompanyReviewItemSchema = z.object({
  reviewer: z.string(),
  date: z.string(),
  rating: z.number().min(1).max(5),
  category: z.string(),
  title: z.string(),
  content: z.string(),
  helpful: z.number(),
});

const CompanyReviewContentSchema = z.object({
  companyName: z.string(),
  industry: z.string(),
  location: z.string(),
  employeeCount: z.string(),
  averageRating: z.number().min(1).max(5),
  totalReviews: z.number(),
  reviews: z.array(CompanyReviewItemSchema),
});

/**
 * CompanyReviewContentのバリデーション
 * @param data - 未検証データ
 * @returns CompanyReviewContent - バリデーション済みデータ
 */
export async function validateCompanyReviewContent(data: unknown): Promise<CompanyReviewContent> {
  return CompanyReviewContentSchema.parse(data);
}
