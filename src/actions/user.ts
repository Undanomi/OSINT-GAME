'use server';

import { getAdminFirestore } from '@/lib/auth/firebase-admin';
import { getAuthenticatedUserId } from '@/lib/auth/server';

/**
 * ユーザーの全データをリセットする
 * メインドキュメントを削除すると、Cloud Functionが自動的にサブコレクションを削除
 */
export async function resetUserData(): Promise<void> {
  const db = getAdminFirestore();
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    throw new Error('認証が必要です');
  }

  try {
    const userDocRef = db.collection('users').doc(userId);

    // 削除前にドキュメントの存在確認
    const docSnapshot = await userDocRef.get();

    // 親ドキュメントが存在しない場合は作成（Cloud Functionトリガーのため）
    if (!docSnapshot.exists) {
      await userDocRef.set({ createdAt: new Date() });
    }

    // メインドキュメントを削除（Cloud Functionトリガー発火）
    await userDocRef.delete();
  } catch (error) {
    console.error('Failed to reset user data:', error);
    throw new Error('ユーザーデータのリセットに失敗しました');
  }
}