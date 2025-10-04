'use server'

import { z } from 'zod';
import { OSINTricksHomeContent } from '@/types/osintrick';

// 共通スキーマ
const OSINTricksSectionSchema = z.object({
  title: z.string(),
  content: z.string(),
  examples: z.array(z.string()).optional(),
});

// Tips詳細
const OSINTricksTipFullSchema = z.object({
  id: z.string(),
  tipNumber: z.number(),
  title: z.string(),
  description: z.string(),
  sections: z.array(OSINTricksSectionSchema).optional(),
});

// ホームページ用のスキーマ
const OSINTricksHomeContentSchema = z.object({
  title: z.string(),
  description: z.string(),
  subtitle: z.string(),
  tips: z.array(OSINTricksTipFullSchema),
});

/**
 * OSINTricksホームページコンテンツのバリデーション
 * @param data
 * @returns OSINTricksHomeContent
 */
export async function validateOSINTricksHomeContent(data: unknown): Promise<OSINTricksHomeContent> {
  return OSINTricksHomeContentSchema.parse(data);
}

/**
 * Basic認証
 * @param username ユーザー名
 * @param password パスワード
 * @returns 認証成功の場合true、失敗の場合false
 */
export async function authenticateOSINTricks(username: string, password: string): Promise<boolean> {
  const VALID_USERNAME = 'osint';
  const VALID_PASSWORD = 'tricks';

  return username === VALID_USERNAME && password === VALID_PASSWORD;
}
