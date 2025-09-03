import React from 'react';
import { AbcCorpPage } from '../AbcCorpPage';
import { FacelookProfilePage } from '../FacelookProfilePage';
import { RankedOnProfilePage } from '../RankedOnProfilePage';
import { UnifiedSearchResult } from '@/types/search';

/**
 * 静的ページのマッピング
 * NOTE: Firebase に保保存されないページの表示用
 */
export const staticPages: { [key: string]: React.ReactElement } = {
  'https://abc-corp.co.jp': <AbcCorpPage />,
};

/**
 * 動的ページコンポーネントのマッピングオブジェクト
 * NOTE: Firebase に保存されているページの表示用
 */
export const dynamicPageComponentMap: Record<string, (documentId: string, initialData: UnifiedSearchResult) => React.ReactElement> = {
  'FacelookProfilePage': (documentId, initialData) => 
    <FacelookProfilePage documentId={documentId} initialData={initialData} />,
  'RankedOnProfilePage': (documentId, initialData) => 
    <RankedOnProfilePage documentId={documentId} initialData={initialData} />,
};
