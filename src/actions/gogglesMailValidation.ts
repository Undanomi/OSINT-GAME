'use server'

import { z } from 'zod';
import { EmailData } from '@/types/email';

// Zodスキーマ定義
const EmailDataSchema = z.object({
  id: z.number(),
  from: z.string(),
  to: z.string().optional(),
  subject: z.string(),
  content: z.string(),
  time: z.string(),
  unread: z.boolean(),
  starred: z.boolean(),
  folder: z.enum(['inbox', 'sent', 'trash']),
  originalFolder: z.enum(['inbox', 'sent']).optional(),
});

const EmailArraySchema = z.array(EmailDataSchema);

/**
 * EmailDataのバリデーション
 * @param data
 * @returns EmailData[]
 */
export async function validateEmailData(data: unknown): Promise<EmailData[]> {
  return EmailArraySchema.parse(data);
}