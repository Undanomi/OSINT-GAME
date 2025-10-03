'use client';

import { resetUserData } from '@/actions/user';
import { useSocialStore } from '@/store/socialStore';
import { useMessengerStore } from '@/store/messengerStore';
import { useSubmissionStore } from '@/store/submissionStore';
import { handleServerAction } from '@/utils/handleServerAction';

/**
 * ゲーム全体をリセットする関数
 * - ユーザーデータのリセット（Firestore）
 * - SocialAppキャッシュのクリア
 * - MessengerAppキャッシュのクリア
 * - 提出状況のリセット
 */
export const resetGameData = async () => {
  // 1. Firestoreのユーザーデータをリセット
  const result = await handleServerAction(
    () => resetUserData(),
    (error) => {
      console.error('Error during game data reset:', error);
    }
  );

  if (result !== null) {
    // 2. SocialAppのキャッシュをクリア
    useSocialStore.getState().clearAllData();

    // 3. MessengerAppのキャッシュをクリア
    useMessengerStore.getState().clearAllCache();

    // 4. 提出状況をリセット
    useSubmissionStore.getState().resetSubmission();
    useSubmissionStore.getState().clearSubmissionHistory();

    console.log('Game data reset completed successfully');
  } else {
    throw new Error('Failed to reset user data');
  }
};