import React from 'react';
import { FacelookProfilePage } from '../FacelookProfilePage';
import { RankedOnProfilePage } from '../RankedOnProfilePage';
import { GogglesMail } from '../goggles-mail/GogglesMailPage';
import { UnifiedSearchResult } from '@/types/search';

/**
 * 静的ページのマッピング
 * NOTE: Firebase に保保存されないページの表示用
 */
export const staticPages: { [key: string]: React.ReactElement | ((currentUrl: string) => React.ReactElement) } = {
  // Goggles Mail - メインページとログインページのみ
  'https://mail.goggles.com': (currentUrl) => <GogglesMail initialUrl={currentUrl} />,
  'https://mail.goggles.com/login': (currentUrl) => <GogglesMail initialUrl={currentUrl} />,
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
