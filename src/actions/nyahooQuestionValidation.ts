'use server'

import { z } from 'zod';
import { NyahooQuestionContent, NyahooQuestionReply} from '@/types/nyahooQuestion';

const NyahooQuestionAdSchema = z.object({
  text: z.string(),
  button: z.string(),
});

const NyahooQuestionTrendingSchema = z.object({
  title: z.string(),
  replies: z.number(),
  category: z.string(),
});

const NyahooQuestionReplySchema: z.ZodType<NyahooQuestionReply> = z.lazy(() => z.object({
  user_id: z.string(),
  content: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  likes: z.number(),
  bads: z.number(),
  thanks: z.number(),
  replies: z.array(NyahooQuestionReplySchema),
}));

const NyahooQuestionContentSchema = z.object({
  user_id: z.string(),
  date: z.string(),
  content: z.string(),
  supplement: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  tag: z.string(),
  likes: z.number(),
  reply_count: z.number(),
  replies: z.array(NyahooQuestionReplySchema),
  ads: z.array(NyahooQuestionAdSchema),
  trending_questions: z.array(NyahooQuestionTrendingSchema),
});

/**
 * NyahooQuestionContentのバリデーション
 * @param data - 検証対象のデータ
 * @returns NyahooQuestionContent - バリデーション済みのデータ
 */
export async function validateNyahooQuestionContent(data: unknown): Promise<NyahooQuestionContent> {
  return NyahooQuestionContentSchema.parse(data);
}