import { showNotification } from '@/utils/notifications';

/**
 * 認証エラー専用の処理関数
 * 将来的に通知以外の処理（例：ログアウト、リダイレクトなど）を追加できるように独立させています
 */
export function handleAuthError(): void {
  // 通知を表示
  showNotification.error(
    '認証エラー',
    'セッションが期限切れです。再度ログインしてください。',
    8000
  );

  // 将来的に追加する処理:
  // - 自動ログアウト
  // - ログイン画面へのリダイレクト
  // - 認証トークンのクリア
  // など
}

/**
 * エラーが認証エラーかどうかを判定
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('認証が必要です') ||
      message.includes('認証エラー') ||
      message.includes('セッションが期限切れ') ||
      message.includes('autherror') ||
      message.includes('authentication') ||
      message.includes('unauthorized') ||
      message.includes('authError')
    );
  }
  return false;
}

/**
 * Server Actionの呼び出しをラップして、認証エラーを自動的に処理するヘルパー関数
 *
 * @param action - 実行するServer Action
 * @param onError - 認証エラー以外のエラー時のカスタム処理（オプション）
 * @returns Server Actionの結果
 * @throws 認証エラー以外のエラーを再スロー（onErrorが指定されていない場合）
 *
 * @example
 * const data = await handleServerAction(
 *   () => getSocialAccounts(),
 *   (error) => {
 *     console.error('Failed to load accounts:', error);
 *     setError("アカウントの読み込みに失敗しました");
 *   }
 * );
 * // 成功時の処理
 * setAccounts(data);
 */
export async function handleServerAction<T>(
  action: () => Promise<T>,
  onError?: (error: Error) => void
): Promise<T> {
  try {
    return await action();
  } catch (error) {
    // 認証エラーの場合
    if (isAuthError(error)) {
      handleAuthError();
      throw error; // 認証エラーも再スロー
    }

    // その他のエラーの場合
    if (onError && error instanceof Error) {
      onError(error);
      throw error; // エラーを再スロー
    } else {
      console.error('Server action error:', error);
      throw error; // エラーを再スロー
    }
  }
}
