'use server'

import { z } from 'zod';
import { ProductReviewBlogContent } from '@/types/productReviewBlog';

const ReviewSectionSchema = z.object({
  title: z.string(),
  content: z.string(),
});

const ProductReviewBlogContentSchema = z.object({
  bloggerName: z.string(),
  bloggerProfile: z.string(),
  postDate: z.string(),
  productName: z.string(),
  manufacturer: z.string(),
  category: z.string(),
  rating: z.number().min(1).max(5),
  purchaseDate: z.string(),
  purchaseLocation: z.string(),
  price: z.number(),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  reviewSections: z.array(ReviewSectionSchema),
  overallReview: z.string(),
  recommendationScore: z.number().min(1).max(5),
});

/**
 * ProductReviewBlogContentのバリデーション
 * @param data - 未検証データ
 * @returns ProductReviewBlogContent - バリデーション済みデータ
 */
export async function validateProductReviewBlogContent(data: unknown): Promise<ProductReviewBlogContent> {
  return ProductReviewBlogContentSchema.parse(data);
}
