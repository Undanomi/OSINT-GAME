'use server';

import { getAdminFirestore } from '@/lib/auth/firebase-admin';
import { ensureAuth } from '@/lib/auth/server';

/**
 * シナリオの解説動画URLを取得
 */
export const getExplanationVideoUrl = ensureAuth(async (): Promise<string | null> => {
  const db = getAdminFirestore();
  try {
    const scenarioDoc = await db.collection('explanation').doc("video").get();

    if (!scenarioDoc.exists) {
      return null;
    }

    const data = scenarioDoc.data();
    return data?.url || null;
  } catch (error) {
    console.error('Failed to get explanation video URL:', error);
    throw new Error('解説動画の取得に失敗しました');
  }
});
