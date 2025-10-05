'use server';

import { getAdminFirestore } from '@/lib/auth/firebase-admin';
import { requireAuth } from '@/lib/auth/server';

/**
 * ユーザーのゲームデータが存在するかチェックする
 * シナリオに応じたデータの存在を確認
 */
export const checkUserDataExists = requireAuth(async (userId: string, scenarioId: string): Promise<boolean> => {
  const db = getAdminFirestore();

  try {
    const userDocRef = db.collection('users').doc(userId);

    // シナリオごとに確認するコレクションを定義
    const collectionsToCheck: string[] = [];

    switch (scenarioId) {
      case 'social-media-analysis':
        collectionsToCheck.push('messages');
        break;
      case 'basic-osint':
        break;
      case 'geolocation-and-image-analysis':
        break;
      case 'dark-web-osint':
        break;
      default:
        return false;
    }

    // いずれかのコレクションにデータが存在するかチェック
    for (const collectionName of collectionsToCheck) {
      const snapshot = await userDocRef.collection(collectionName).limit(1).get();
      if (!snapshot.empty) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Failed to check user data:', error);
    return false;
  }
});

/**
 * ユーザーの全データをリセットする
 * メインドキュメントを削除すると、Cloud Functionが自動的にサブコレクションを削除
 */
export const resetUserData = requireAuth(async (userId: string): Promise<void> => {
  const db = getAdminFirestore();

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
});