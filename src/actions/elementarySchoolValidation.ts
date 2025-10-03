'use server'

import { z } from 'zod';
import { ElementarySchoolContent } from '@/types/elementarySchool';

const ElementarySchoolNewsSchema = z.object({
  date: z.string(),
  title: z.string(),
  content: z.string(),
});

const ElementarySchoolEventSchema = z.object({
  date: z.string(),
  title: z.string(),
  description: z.string(),
});

const ElementarySchoolContentSchema = z.object({
  schoolName: z.string(),
  principal: z.string(),
  address: z.string(),
  phone: z.string(),
  email: z.string(),
  established: z.string(),
  studentCount: z.number(),
  schoolImage: z.string().optional(),
  motto: z.string(),
  greeting: z.string(),
  news: z.array(ElementarySchoolNewsSchema),
  events: z.array(ElementarySchoolEventSchema),
});

/**
 * ElementarySchoolContentのバリデーション
 * @param data - 未検証データ
 * @returns ElementarySchoolContent - バリデーション済みデータ
 */
export async function validateElementarySchoolContent(data: unknown): Promise<ElementarySchoolContent> {
  return ElementarySchoolContentSchema.parse(data);
}
