'use server'

import { getAdminFirestore } from '@/lib/auth/firebase-admin';
import { UnifiedSearchResult } from '@/types/search';
import { ensureAuth } from '@/lib/auth/server';

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
 * 検索結果と提案を含むデータ構造
 */
export interface SearchResultsWithSuggestion {
  /** 検索結果のリスト */
  results: SearchResult[];
  /** もしかしての提案キーワード（存在する場合） */
  suggestion?: string;
}

/**
 * よくある誤植とその提案の静的マッピング
 */
const SPELLING_SUGGESTIONS: Record<string, string> = {
  // Facelook
  'facelok': 'facelook',
  'faceloook': 'facelook',
  'facebook': 'facelook',
  'facebok': 'facelook',
  'faceboook': 'facelook',

  // Goggles
  'gogles': 'goggles',
  'gogle': 'goggles',
  'goggels': 'goggles',
  'goggle': 'goggles',
  'google': 'goggles',
  'googles': 'goggles',

  // RankedOn
  'rankedin': 'rankedon',
  'linkedin': 'rankedon',
  'linkedon': 'rankedon',

  // Playback Machine
  'wayback': 'playback',

  // Nyahoo
  'yahoo': 'nyahoo',
  'yahoo!': 'nyahoo',
  'nyaho': 'nyahoo',
  'nyahooo': 'nyahoo',
  'nyaho!': 'nyahoo',
  'nyahooo!': 'nyahoo',

  // Chiita
  'chitta': 'chiita',
  'chiiita': 'chiita',
  'qiita': 'chiita',
  'qiiita': 'chiita',

  // Usopedia
  'wikipedia': 'usopedia',
  'wiki' : 'usopedia',

  // 日本語サービス名
  'むち袋': '無知袋',
  '無地袋': '無知袋',
  '夕陽新聞': '夕日新聞',
  'ゆうひ新聞': '夕日新聞',
  '夕日しんぶん': '夕日新聞',
};

/**
 * クエリに対する提案キーワードを取得する
 * @param query - 検索クエリ
 * @returns 提案キーワード（存在する場合）
 */
const getSpellingSuggestion = (query: string): string | undefined => {
  const normalizedQuery = query.toLowerCase().trim();

  // 完全一致チェック
  if (SPELLING_SUGGESTIONS[normalizedQuery]) {
    return SPELLING_SUGGESTIONS[normalizedQuery];
  }

  // 部分一致チェック（キーワードを含んでいるか）
  // 最長一致を優先する
  const sortedKeys = Object.keys(SPELLING_SUGGESTIONS).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (normalizedQuery.includes(key)) {
      const suggestion = SPELLING_SUGGESTIONS[key];
      // 提案キーワードが既に元のクエリに含まれている場合はスキップ
      if (normalizedQuery.includes(suggestion)) {
        continue;
      }
      // 該当部分だけを置換した文字列を返す
      return normalizedQuery.replace(key, suggestion);
    }
  }

  return;
};

/**
 * Firebaseのsearch_resultsコレクションからデータを取得する
 */
export const getSearchResults = ensureAuth(async (): Promise<UnifiedSearchResult[]> => {
	const db = getAdminFirestore();
	const searchResultsRef = db.collection('search_results');
	const querySnapshot = await searchResultsRef.get();
	const firebaseResults: UnifiedSearchResult[] = [];
	querySnapshot.forEach((doc) => {
		const data = doc.data() as UnifiedSearchResult;
		firebaseResults.push({
			...data,
			id: doc.id,
		});
	});
	return firebaseResults;
});

/**
 * キャッシュされたsearch_resultsに対して部分一致検索を実行する
 * 複数のキーワードをスペース、「AND」、「&」で区切って指定した場合、AND検索を実行する
 * @param cache - 検索対象のUnifiedSearchResultの配列
 * @param query - 検索クエリ（スペース、「OR」、「|」で区切って複数キーワード指定可能）
 * @returns Promise<SearchResultsWithSuggestion> - フィルタリングされた検索結果と提案
 */
export const filterSearchResults = async (
  cache: UnifiedSearchResult[],
  query: string
): Promise<SearchResultsWithSuggestion> => {
  // クエリ全体に対してスペルチェックを行い、提案を取得
  const suggestion = getSpellingSuggestion(query);

  // クエリを全角・半角スペース、「AND」、「&」で分割してキーワード配列を作成
  const keywords = query
    .split(/\s*(?:AND|&)\s*|[\s　]+/)  // AND、&（前後の空白含む）、またはスペースで分割
    .map(k => k.trim())
    .filter(k => k.length > 0);

  // 検索用に小文字化
  const keywordsLower = keywords.map(k => k.toLowerCase());

  // Playback Machine関連の検索キーワード
  const playbackKeywords = ['playback', 'archive', 'アーカイブ', 'wayback', '過去', 'キャッシュ', 'cache'];
  const isPlaybackSearch = keywordsLower.some(keyword =>
    playbackKeywords.some(playbackKeyword => keyword.includes(playbackKeyword))
  );

  // Goggles Mail関連の検索キーワード
  const gogglesMailKeywords = ['goggles', 'mail', 'メール', 'ログイン', 'login', 'gmail', 'email'];
  const isGogglesMailSearch = keywordsLower.some(keyword =>
    gogglesMailKeywords.some(gogglesMailKeyword => keyword.includes(gogglesMailKeyword))
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

  // Goggles Mailログインページを検索結果に追加
  if (isGogglesMailSearch) {
    staticResults.push({
      id: 'goggles-mail-login-static',
      title: 'Goggles Mail - ログイン',
      url: 'https://mail.goggles.com/login',
      description: 'Goggles Mailアカウントにログインして、メール、連絡先、カレンダーなどにアクセスできます。',
      type: 'directory' as const,
    });
  }

  // キャッシュから部分一致で検索（expired状態のドメインは除外）
  // すべてのキーワードにマッチする結果を返す（AND検索）
  const filteredItems = cache.filter(item => {
    // expired・hidden状態のドメインは検索結果から除外
    if (item.domainStatus === 'expired' || item.domainStatus === 'hidden') {
      return false;
    }

    // すべてのキーワードがマッチするかチェック（AND検索）
    const allKeywordsMatch = keywordsLower.every(keyword => {
      // キーワードフィールドでの部分一致
      const matchesKeywords = item.keywords?.some(k =>
        k.toLowerCase().includes(keyword)
      );

      // タイトルでの部分一致
      const matchesTitle = item.title.toLowerCase().includes(keyword);

      // 説明文での部分一致
      const matchesDescription = item.description.toLowerCase().includes(keyword);

      return matchesKeywords || matchesTitle || matchesDescription;
    });

    return allKeywordsMatch;
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
  if (suggestion) {
    console.log('提案キーワード:', suggestion);
  }

  return {
    results: shuffledResults,
    suggestion
  };
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