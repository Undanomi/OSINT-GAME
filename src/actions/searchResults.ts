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
 * @param cache - 検索対象のUnifiedSearchResultの配列
 * @param query - 検索クエリ
 * @returns Promise<SearchResult[]> - フィルタリングされた検索結果
 */
export const filterSearchResults = async (
  cache: UnifiedSearchResult[], 
  query: string
): Promise<SearchResult[]> => {
  const queryLower = query.toLowerCase();
  
  // キャッシュから部分一致で検索
  const filteredItems = cache.filter(item => {
    console.log('Filtering item:', item);
    
    // キーワードでの部分一致
    const matchesKeywords = item.keywords?.some(keyword => {
      const match = keyword.toLowerCase().includes(queryLower);
      console.log(`Keyword "${keyword}" includes "${query}":`, match);
      return match;
    });
    
    // タイトルでの部分一致
    const matchesTitle = item.title.toLowerCase().includes(queryLower);
    
    // 説明文での部分一致
    const matchesDescription = item.description.toLowerCase().includes(queryLower);
    
    console.log('Matches - keywords:', matchesKeywords, 'title:', matchesTitle, 'description:', matchesDescription);
    return matchesKeywords || matchesTitle || matchesDescription;
  });

  // 非同期変換処理
  const filteredResults = await Promise.all(
    filteredItems.map(item => convertFirebaseResult(item))
  );

  console.log('検索結果:', filteredResults);
  console.log('検索結果数:', filteredResults.length);
  
  return filteredResults;
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