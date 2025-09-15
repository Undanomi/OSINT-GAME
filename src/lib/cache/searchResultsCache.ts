import { getSearchResults } from '@/actions/searchResults';
import { UnifiedSearchResult } from '@/types/search';
import { LOCAL_STORAGE_KEYS, CACHE_EXPIRY } from '@/types/localStorage';

/**
 * 検索結果をローカルストレージに保存
 * @param searchResults
 */
export function saveSearchResultsToCache(searchResults: UnifiedSearchResult[]): void {
  try {
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.setItem(LOCAL_STORAGE_KEYS.SEARCH_CACHE, JSON.stringify(searchResults));
    localStorage.setItem(LOCAL_STORAGE_KEYS.CACHE_TIMESTAMP, Date.now().toString());
  } catch (error) {
    console.error('Error saving search results to cache:', error);
  }
}

/**
 * ローカルストレージから検索結果を取得
 * @returns UnifiedSearchResult[]
 */
export function getSearchResultsFromCache(): UnifiedSearchResult[] {
  try {
    if (typeof window === 'undefined') {
      return [];
    }

    const cachedData = localStorage.getItem(LOCAL_STORAGE_KEYS.SEARCH_CACHE);
    if (!cachedData) {
      return [];
    }

    return JSON.parse(cachedData) as UnifiedSearchResult[];
  } catch (error) {
    console.error('Error getting search results from cache:', error);
    return [];
  }
}

/**
 * 検索結果キャッシュが有効かチェック
 * @returns boolean - キャッシュが有効かどうか
 */
export function isSearchResultsCacheValid(): boolean {
  try {
    if (typeof window === 'undefined') {
      return false;
    }

    const cachedData = localStorage.getItem(LOCAL_STORAGE_KEYS.SEARCH_CACHE);
    const timestampStr = localStorage.getItem(LOCAL_STORAGE_KEYS.CACHE_TIMESTAMP);

    if (!cachedData || !timestampStr) {
      return false;
    }

    const timestamp = parseInt(timestampStr, 10);
    const now = Date.now();

    return (now - timestamp) < CACHE_EXPIRY;
  } catch (error) {
    console.error('Error checking search results cache validity:', error);
    return false;
  }
}

/**
 * 検索結果キャッシュを削除
 */
export function clearSearchResultsCache(): void {
  try {
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.removeItem(LOCAL_STORAGE_KEYS.SEARCH_CACHE);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.CACHE_TIMESTAMP);
  } catch (error) {
    console.error('Error clearing search results cache:', error);
  }
}

/**
 * 検索結果をFirebaseから取得し、キャッシュに保存
 * キャッシュが有効な場合は期限を更新してキャッシュを使用
 * @returns Promise<UnifiedSearchResult[]>
 */
export async function loadSearchResults(): Promise<UnifiedSearchResult[]> {
  try {
    // キャッシュが有効な場合
    if (isSearchResultsCacheValid()) {
      // 期限を更新してキャッシュを使用
      const cachedResults = getSearchResultsFromCache();
      if (cachedResults.length > 0) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.CACHE_TIMESTAMP, Date.now().toString());
        console.log('既存のキャッシュの期限を更新しました:', cachedResults.length + '件');
        return cachedResults;
      }
    }

    // キャッシュが無効または存在しない場合、新しく取得
    clearSearchResultsCache(); // 古いキャッシュを削除
    const searchResults = await getSearchResults();
    saveSearchResultsToCache(searchResults);

    const message = isSearchResultsCacheValid()
      ? '期限切れキャッシュを削除し、新しい検索結果をキャッシュしました:'
      : '検索結果をローカルストレージにキャッシュしました:';
    console.log(message, searchResults.length + '件');

    return searchResults;
  } catch (error) {
    console.error('Error loading search results:', error);
    throw error;
  }
}