'use server'

import { z } from 'zod';
import { JuniorHighSchoolContent } from '@/types/juniorHighSchool';

const JuniorHighSchoolNewsSchema = z.object({
  date: z.string(),
  category: z.string(),
  title: z.string(),
  content: z.string(),
});

const JuniorHighSchoolClubSchema = z.object({
  name: z.string(),
  description: z.string(),
  achievement: z.string().optional(),
});

const JuniorHighSchoolContentSchema = z.object({
  schoolName: z.string(),
  principal: z.string(),
  address: z.string(),
  phone: z.string(),
  fax: z.string(),
  email: z.string(),
  established: z.string(),
  studentCount: z.number(),
  schoolImage: z.string().optional(),
  philosophy: z.string(),
  greeting: z.string(),
  news: z.array(JuniorHighSchoolNewsSchema),
  clubs: z.array(JuniorHighSchoolClubSchema),
});

/**
 * JuniorHighSchoolContentのバリデーション
 * @param data - 未検証データ
 * @returns JuniorHighSchoolContent - バリデーション済みデータ
 */
export async function validateJuniorHighSchoolContent(data: unknown): Promise<JuniorHighSchoolContent> {
  return JuniorHighSchoolContentSchema.parse(data);
}
