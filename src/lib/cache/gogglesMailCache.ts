import type { EmailData } from '@/types/email';
import { getGogglesMail } from '@/actions/gogglesMail';
import { LOCAL_STORAGE_KEYS, CACHE_EXPIRY } from '@/types/localStorage';
import { handleServerAction } from '@/utils/handleServerAction';

/**
 * メールデータをローカルストレージに保存
 * @param emailData
 */
export function saveGogglesMailToCache(emailData: EmailData[]): void {
  try {
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.setItem(LOCAL_STORAGE_KEYS.GOGGLES_MAIL_CACHE, JSON.stringify(emailData));
    localStorage.setItem(LOCAL_STORAGE_KEYS.GOGGLES_MAIL_CACHE_TIMESTAMP, Date.now().toString());
  } catch (error) {
    console.error('Error saving Goggles Mail to cache:', error);
  }
}

/**
 * ローカルストレージからメールデータを取得
 * @returns EmailData[]
 */
export function getGogglesMailFromCache(): EmailData[] {
  try {
    if (typeof window === 'undefined') {
      return [];
    }

    const cachedData = localStorage.getItem(LOCAL_STORAGE_KEYS.GOGGLES_MAIL_CACHE);
    if (!cachedData) {
      return [];
    }

    return JSON.parse(cachedData) as EmailData[];
  } catch (error) {
    console.error('Error getting Goggles Mail from cache:', error);
    return [];
  }
}

/**
 * ローカルストレージからメールキャッシュを削除
 */
export function clearGogglesMailCache(): void {
  try {
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.removeItem(LOCAL_STORAGE_KEYS.GOGGLES_MAIL_CACHE);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.GOGGLES_MAIL_CACHE_TIMESTAMP);
  } catch (error) {
    console.error('Error clearing Goggles Mail cache:', error);
  }
}

/**
 * メールキャッシュが有効かチェック
 * @returns boolean - キャッシュが有効かどうか
 */
export function isGogglesMailCacheValid(): boolean {
  try {
    if (typeof window === 'undefined') {
      return false;
    }

    const cachedData = localStorage.getItem(LOCAL_STORAGE_KEYS.GOGGLES_MAIL_CACHE);
    const timestampStr = localStorage.getItem(LOCAL_STORAGE_KEYS.GOGGLES_MAIL_CACHE_TIMESTAMP);

    if (!cachedData || !timestampStr) {
      return false;
    }

    const timestamp = parseInt(timestampStr, 10);
    const now = Date.now();

    return (now - timestamp) < CACHE_EXPIRY;
  } catch (error) {
    console.error('Error checking Goggles Mail cache validity:', error);
    return false;
  }
}

/**
 * メールキャッシュが存在するかチェック
 * @returns boolean - キャッシュが存在するかどうか
 */
export function hasGogglesMailCache(): boolean {
  try {
    if (typeof window === 'undefined') {
      return false;
    }
    return localStorage.getItem(LOCAL_STORAGE_KEYS.GOGGLES_MAIL_CACHE) !== null;
  } catch (error) {
    console.error('Error checking Goggles Mail cache:', error);
    return false;
  }
}

/**
 * メールデータをFirebaseから取得し、キャッシュに保存
 * キャッシュが有効な場合は期限を更新してキャッシュを使用
 * @returns Promise<EmailData[]>
 */
export async function loadGogglesMailData(): Promise<EmailData[]> {
  // キャッシュが有効な場合
  if (isGogglesMailCacheValid()) {
    // 期限を更新してキャッシュを使用
    const cachedEmails = getGogglesMailFromCache();
    if (cachedEmails.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.GOGGLES_MAIL_CACHE_TIMESTAMP, Date.now().toString());
      console.log('既存のメールキャッシュの期限を更新しました:', cachedEmails.length + '件');
      return cachedEmails;
    }
  }

  // キャッシュが無効または存在しない場合、新しく取得
  clearGogglesMailCache(); // 古いキャッシュを削除

  const emailData = await handleServerAction(
    () => getGogglesMail(),
    (error) => {
      console.error('Error loading Goggles Mail data:', error);
    }
  );

  if (emailData) {
    saveGogglesMailToCache(emailData);
    console.log('メールデータをローカルストレージにキャッシュしました:', emailData.length + '件');
    return emailData;
  }

  // エラー時は空の配列を返す
  return [];
}