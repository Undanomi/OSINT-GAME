'use server'

import { z } from 'zod';
import { RankedOnContent, RankedOnUser } from '@/types/rankedon';

// Zodスキーマ定義
const ExperienceSchema = z.object({
  title: z.string(),
  company: z.string(),
  employmentType: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  current: z.boolean().optional(),
  description: z.string().optional(),
  skills: z.array(z.string()).optional(),
});

const EducationSchema = z.object({
  school: z.string(),
  degree: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  startYear: z.string(),
  endYear: z.string().optional(),
  grade: z.string().optional(),
  activities: z.string().optional(),
  description: z.string().optional(),
});

const SkillSchema = z.object({
  name: z.string(),
  endorsements: z.number().optional(),
  endorsed: z.boolean().optional(),
});

const CertificationSchema = z.object({
  name: z.string(),
  issuingOrganization: z.string(),
  issueDate: z.string(),
  expirationDate: z.string().optional(),
  credentialId: z.string().optional(),
  credentialUrl: z.string().optional(),
});

const RankedOnPostSchema = z.object({
  content: z.string(),
  image: z.string().optional(),
  timestamp: z.string(),
  likes: z.number(),
  comments: z.number(),
  reposts: z.number(),
  impressions: z.number().optional(),
  authorName: z.string().optional(),
  authorTitle: z.string().optional(),
  authorImage: z.string().optional(),
});

const RecommendationSchema = z.object({
  recommenderName: z.string(),
  recommenderTitle: z.string(),
  recommenderImage: z.string().optional(),
  relationship: z.string(),
  text: z.string(),
  date: z.string(),
});

const LanguageSchema = z.object({
  name: z.string(),
  proficiency: z.string(),
});

const SocialAccountSchema = z.object({
  platform: z.string(),
  id: z.string(),
});

const RankedOnContentSchema = z.object({
  name: z.string(),
  profileImage: z.string(),
  backgroundImage: z.string().optional(),
  headline: z.string(),
  currentPosition: z.string().optional(),
  currentCompany: z.string().optional(),
  location: z.string(),
  industry: z.string().optional(),
  summary: z.string().optional(),
  connectionsCount: z.number(),
  socialAccounts: z.array(SocialAccountSchema).optional(),
  experience: z.array(ExperienceSchema),
  education: z.array(EducationSchema),
  skills: z.array(SkillSchema),
  certifications: z.array(CertificationSchema).optional(),
  posts: z.array(RankedOnPostSchema),
  recommendations: z.array(RecommendationSchema).optional(),
  languages: z.array(LanguageSchema).optional(),
});

/**
 * RankedOnContentのバリデーション
 * @param data - 未検証データ
 * @returns RankedOnContent - バリデーション済みデータ
 */
export async function validateRankedOnContent(data: unknown): Promise<RankedOnContent> {
  return RankedOnContentSchema.parse(data);
}

/**
 * RankedOnContentをRankedOnUserに変換する
 * @param rankedOnContent - RankedOnContent
 * @param documentId - ドキュメントID (userIdとして使用)
 * @returns RankedOnUser - 変換されたRankedOnUser
 */
export async function convertRankedOnContentToUser(
  rankedOnContent: RankedOnContent,
  documentId: string
): Promise<RankedOnUser> {
  const data: RankedOnUser = {
    userId: documentId,
    name: rankedOnContent.name,
    profileImage: rankedOnContent.profileImage,
    backgroundImage: rankedOnContent.backgroundImage,
    headline: rankedOnContent.headline,
    currentPosition: rankedOnContent.currentPosition,
    currentCompany: rankedOnContent.currentCompany,
    location: rankedOnContent.location,
    industry: rankedOnContent.industry,
    summary: rankedOnContent.summary,
    connectionsCount: rankedOnContent.connectionsCount,
    socialAccounts: rankedOnContent.socialAccounts,
    experience: rankedOnContent.experience || [],
    education: rankedOnContent.education || [],
    skills: rankedOnContent.skills || [],
    certifications: rankedOnContent.certifications,
    posts: rankedOnContent.posts || [],
    recommendations: rankedOnContent.recommendations,
    languages: rankedOnContent.languages,
  };

  return data;
}