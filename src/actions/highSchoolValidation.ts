'use server'

import { z } from 'zod';
import { HighSchoolContent } from '@/types/highSchool';

const HighSchoolNewsSchema = z.object({
  date: z.string(),
  category: z.string(),
  title: z.string(),
  content: z.string(),
});

const HighSchoolDepartmentSchema = z.object({
  name: z.string(),
  description: z.string(),
  features: z.array(z.string()),
});

const HighSchoolContentSchema = z.object({
  schoolName: z.string(),
  englishName: z.string(),
  principal: z.string(),
  address: z.string(),
  phone: z.string(),
  fax: z.string(),
  email: z.string(),
  established: z.string(),
  studentCount: z.number(),
  schoolImage: z.string().optional(),
  motto: z.string(),
  message: z.string(),
  news: z.array(HighSchoolNewsSchema),
  departments: z.array(HighSchoolDepartmentSchema),
  careerData: z.object({
    universityRate: z.number(),
    employmentRate: z.number(),
  }),
});

/**
 * HighSchoolContentのバリデーション
 * @param data - 未検証データ
 * @returns HighSchoolContent - バリデーション済みデータ
 */
export async function validateHighSchoolContent(data: unknown): Promise<HighSchoolContent> {
  return HighSchoolContentSchema.parse(data);
}
