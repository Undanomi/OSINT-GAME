'use client';

import { resetUserData } from '@/actions/user';
import { useSocialStore } from '@/store/socialStore';
import { useMessengerStore } from '@/store/messengerStore';
import { useSubmissionStore } from '@/store/submissionStore';

/**
 * ゲーム全体をリセットする関数
 * - ユーザーデータのリセット（Firestore）
 * - SocialAppキャッシュのクリア
 * - MessengerAppキャッシュのクリア
 * - 提出状況のリセット
 */
export const resetGameData = async () => {
  try {
    // 1. Firestoreのユーザーデータをリセット
    await resetUserData();

    // 2. SocialAppのキャッシュをクリア
    useSocialStore.getState().clearAllData();

    // 3. MessengerAppのキャッシュをクリア
    useMessengerStore.getState().clearAllCache();

    // 4. 提出状況をリセット
    useSubmissionStore.getState().resetSubmission();
    useSubmissionStore.getState().clearSubmissionHistory();

    console.log('Game data reset completed successfully');
  } catch (error) {
    console.error('Error during game data reset:', error);
    throw error;
  }
};