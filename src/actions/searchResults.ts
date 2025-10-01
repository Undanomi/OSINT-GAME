'use server'

import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { UnifiedSearchResult } from '@/types/search';

/**
 * 検索結果アイテムのデータ構造を定義するインターフェース
 */
export interface SearchResult {
  /** 検索結果アイテムの一意識別子 */
  id: string;
  /** ページのタイトル */
  title: string;
  /** ページのURL */
  url: string;
  /** ページの説明文 */
  description: string;
  /** ページの種類（企業サイト、SNS、ニュース、個人サイト、ディレクトリ） */
  type: 'corporate' | 'social' | 'news' | 'personal' | 'directory';
}

/**
 * Firebaseのsearch_resultsコレクションからデータを取得する
 */
export const getSearchResults = async (): Promise<UnifiedSearchResult[]> => {
	const searchResultsRef = collection(db, 'search_results');
	const querySnapshot = await getDocs(searchResultsRef);
	const firebaseResults: UnifiedSearchResult[] = [];
	querySnapshot.forEach((doc) => {
		const data = doc.data() as UnifiedSearchResult;
		firebaseResults.push({
			...data,
			id: doc.id,
		});
	});
	return firebaseResults;
};

/**
 * キャッシュされたsearch_resultsに対して部分一致検索を実行する
 * 複数のキーワードをスペース、「OR」、「|」で区切って指定した場合、OR検索を実行する
 * @param cache - 検索対象のUnifiedSearchResultの配列
 * @param query - 検索クエリ（スペース、「OR」、「|」で区切って複数キーワード指定可能）
 * @returns Promise<SearchResult[]> - フィルタリングされた検索結果
 */
export const filterSearchResults = async (
  cache: UnifiedSearchResult[],
  query: string
): Promise<SearchResult[]> => {
  // クエリを全角・半角スペース、「OR」、「|」で分割してキーワード配列を作成
  const keywords = query
    .split(/\s*(?:OR|\|)\s*|[\s　]+/)  // OR、|（前後の空白含む）、またはスペースで分割
    .map(k => k.toLowerCase().trim())
    .filter(k => k.length > 0);

  // Playback Machine関連の検索キーワード
  const playbackKeywords = ['playback', 'archive', 'アーカイブ', 'wayback', '過去', 'キャッシュ', 'cache'];
  const isPlaybackSearch = keywords.some(keyword =>
    playbackKeywords.some(playbackKeyword => keyword.includes(playbackKeyword))
  );

  // Playback Machineを検索結果に追加
  const staticResults: SearchResult[] = [];
  if (isPlaybackSearch) {
    staticResults.push({
      id: 'playback-machine-static',
      title: 'Playback Machine - インターネットアーカイブ',
      url: 'https://playback.archive',
      description: '過去にアーカイブされたウェブページを閲覧できます。削除されたページや失効したドメインのサイトも表示可能です。',
      type: 'directory' as const,
    });
  }

  // キャッシュから部分一致で検索（expired状態のドメインは除外）
  // いずれかのキーワードにマッチする結果を返す（OR検索）
  const filteredItems = cache.filter(item => {
    console.log('Filtering item:', item);

    // expired状態のドメインは検索結果から除外
    if (item.domainStatus === 'expired') {
      console.log('Skipping expired domain:', item.url);
      return false;
    }

    // いずれかのキーワードがマッチするかチェック（OR検索）
    const anyKeywordMatches = keywords.some(keyword => {
      // キーワードフィールドでの部分一致
      const matchesKeywords = item.keywords?.some(k =>
        k.toLowerCase().includes(keyword)
      );

      // タイトルでの部分一致
      const matchesTitle = item.title.toLowerCase().includes(keyword);

      // 説明文での部分一致
      const matchesDescription = item.description.toLowerCase().includes(keyword);

      const matches = matchesKeywords || matchesTitle || matchesDescription;
      console.log(`Keyword "${keyword}" matches:`, matches);
      return matches;
    });

    console.log('Any keyword matches:', anyKeywordMatches);
    return anyKeywordMatches;
  });

  // 非同期変換処理
  const filteredResults = await Promise.all(
    filteredItems.map(item => convertFirebaseResult(item))
  );

  // 静的な結果とFirebaseの結果を結合
  const allResults = [...staticResults, ...filteredResults];

  // 検索結果をシャッフル（Fisher-Yatesアルゴリズム）
  const shuffledResults = [...allResults];
  for (let i = shuffledResults.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledResults[i], shuffledResults[j]] = [shuffledResults[j], shuffledResults[i]];
  }

  console.log('検索結果:', shuffledResults);
  console.log('検索結果数:', shuffledResults.length);

  return shuffledResults;
};

/**
 * UnifiedSearchResultをSearchResultに変換する
 */
export const convertFirebaseResult = async (unifiedResult: UnifiedSearchResult): Promise<SearchResult> => {
  let type: SearchResult['type'] = 'directory';
  
  // templateからページタイプを判定（NOTE: 将来不要）
  if (unifiedResult.template === 'FacelookProfilePage' || 
      unifiedResult.template === 'LinkedInProfilePage') {
    type = 'social';
  } else if (unifiedResult.template === 'AbcCorpPage') {
    type = 'corporate';
  }

  return {
    id: unifiedResult.id,
    title: unifiedResult.title,
    url: unifiedResult.url,
    description: unifiedResult.description,
    type: type,
  };
};