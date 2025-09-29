'use server'

import { z } from 'zod';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
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
 * gs:// URLをHTTPS URLに変換する
 */
async function convertGsUrlToHttps(url: string): Promise<string> {
  if (!url || !url.startsWith('gs://')) {
    return url; // 既にHTTPS URLの場合はそのまま
  }

  try {
    return await getDownloadURL(ref(storage, url));
  } catch (error) {
    console.error('Failed to convert URL:', url, error);
    return url; // 変換に失敗した場合は元のURLを返す
  }
}

/**
 * KyetContentの画像URLを変換する
 */
async function processImageUrls(kyetContent: KyetContent): Promise<KyetContent> {
  // ディープコピーして元データを保護
  const processedContent = JSON.parse(JSON.stringify(kyetContent)) as KyetContent;

  try {
    // ヒーロー画像の変換
    processedContent.heroImage = await convertGsUrlToHttps(processedContent.heroImage);

    // ローリング画像の変換
    for (let i = 0; i < processedContent.rollingImages.length; i++) {
      processedContent.rollingImages[i] = await convertGsUrlToHttps(processedContent.rollingImages[i]);
    }

    // ツアー画像の変換
    for (const tour of processedContent.featuredTours) {
      for (let i = 0; i < tour.images.length; i++) {
        tour.images[i] = await convertGsUrlToHttps(tour.images[i]);
      }
    }

    // イベント画像の変換
    for (const event of processedContent.upcomingEvents) {
      for (let i = 0; i < event.images.length; i++) {
        event.images[i] = await convertGsUrlToHttps(event.images[i]);
      }
    }

    // スタッフ画像の変換
    for (const staff of processedContent.staff) {
      staff.image = await convertGsUrlToHttps(staff.image);
    }

    return processedContent;
  } catch (error) {
    console.error('Error processing images:', error);
    throw new Error('Failed to process images');
  }
}

/**
 * KyetContentのバリデーションと画像URL変換
 * @param data - 未検証データ
 * @returns KyetContent - バリデーション済み・画像URL変換済みデータ
 */
export async function validateKyetContent(data: unknown): Promise<KyetContent> {
  // 認証チェック
  try {
    await getAuthenticatedUserId();
  } catch {
    throw new Error('Unauthorized: User authentication required');
  }

  // データバリデーション
  const validatedContent = KyetContentSchema.parse(data);

  // 画像URL変換
  return await processImageUrls(validatedContent);
}