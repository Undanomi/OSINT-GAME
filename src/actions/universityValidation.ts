'use server'

import { z } from 'zod';
import { UniversityContent } from '@/types/university';

const UniversityNewsSchema = z.object({
  date: z.string(),
  category: z.string(),
  title: z.string(),
  summary: z.string(),
});

const UniversityFacultySchema = z.object({
  name: z.string(),
  description: z.string(),
  departments: z.array(z.string()),
});

const UniversityCampusSchema = z.object({
  name: z.string(),
  address: z.string(),
  description: z.string(),
});

const UniversityContentSchema = z.object({
  universityName: z.string(),
  englishName: z.string(),
  president: z.string(),
  address: z.string(),
  phone: z.string(),
  email: z.string(),
  established: z.string(),
  studentCount: z.number(),
  campusImage: z.string().optional(),
  vision: z.string(),
  presidentMessage: z.string(),
  news: z.array(UniversityNewsSchema),
  faculties: z.array(UniversityFacultySchema),
  campuses: z.array(UniversityCampusSchema),
});

/**
 * UniversityContentのバリデーション
 * @param data - 未検証データ
 * @returns UniversityContent - バリデーション済みデータ
 */
export async function validateUniversityContent(data: unknown): Promise<UniversityContent> {
  return UniversityContentSchema.parse(data);
}
