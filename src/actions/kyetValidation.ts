'use server'

import { z } from 'zod';
import { getAuthenticatedUserId } from '@/lib/auth/server';
import type { KyetContent } from '@/types/kyet';

// Zodスキーマ定義
const KyetTourSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  duration: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  price: z.number(),
  location: z.string(),
  images: z.array(z.string()),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  maxParticipants: z.number().optional(),
  currentParticipants: z.number().optional(),
});

const KyetEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  eventType: z.enum(['workshop', 'seminar', 'outdoor_activity', 'team_building']),
  date: z.string(),
  time: z.string(),
  location: z.string(),
  price: z.number(),
  images: z.array(z.string()),
  maxParticipants: z.number().optional(),
  currentParticipants: z.number().optional(),
});

const KyetStaffSchema = z.object({
  name: z.string(),
  role: z.string(),
  bio: z.string(),
  image: z.string(),
  specialties: z.array(z.string()),
});

const KyetReviewSchema = z.object({
  customerName: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string(),
  date: z.string(),
  tourOrEventTitle: z.string(),
});

const KyetCompanyInfoSchema = z.object({
  name: z.string(),
  mission: z.string(),
  vision: z.string(),
  foundedYear: z.number(),
  location: z.string(),
  contactInfo: z.object({
    phone: z.string(),
    email: z.string(),
    address: z.string(),
  }),
});

const KyetContentSchema = z.object({
  companyInfo: KyetCompanyInfoSchema,
  featuredTours: z.array(KyetTourSchema),
  upcomingEvents: z.array(KyetEventSchema),
  staff: z.array(KyetStaffSchema),
  reviews: z.array(KyetReviewSchema),
  heroImage: z.string(),
  aboutText: z.string(),
  achievements: z.array(z.object({
    title: z.string(),
    description: z.string(),
    icon: z.string().optional(),
  })),
  socialLinks: z.object({
    link: z.string().optional(),
  }),
  rollingImages: z.array(z.string()),
});

/**
 * KyetContentのバリデーション
 * @param data - 未検証データ
 * @returns KyetContent - バリデーション済みデータ
 */
export async function validateKyetContent(data: unknown): Promise<KyetContent> {
  // 認証チェック
  try {
    await getAuthenticatedUserId();
  } catch {
    throw new Error('Unauthorized: User authentication required');
  }

  // データバリデーション
  return KyetContentSchema.parse(data);
}