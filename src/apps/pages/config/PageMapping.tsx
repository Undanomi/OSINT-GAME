import React from 'react';
import { FacelookProfilePage } from '../FacelookProfilePage';
import { RankedOnProfilePage } from '../RankedOnProfilePage';
import { YuhiShinbunPage } from '../YuhiShinbunPage';
import { ChiitaPage } from '../ChiitaPage';
import { NyahooNewsPage } from '../NyahooNewsPage';
import { NyahooQuestionPage } from '../NyahooQuestionPage';
import { UsopediaPage } from '../UsopediaPage';
import { NittaBlogPage } from '../NittaBlogPage';
import { KyetPage } from '../KyetPage';
import { GogglesMail } from '../goggles-mail/GogglesMailPage';
import { PlaybackMachinePage } from '../PlaybackMachinePage';
import { UnifiedSearchResult } from '@/types/search';

/**
 * 静的ページのマッピング
 * NOTE: Firebase に保存されないページの表示用
 */
export const staticPages: { [key: string]: React.ReactElement | ((currentUrl: string, onNavigate?: (url: string) => void) => React.ReactElement) } = {
  // Goggles Mail - メインページとログインページのみ
  'https://mail.goggles.com': (currentUrl, onNavigate) => <GogglesMail initialUrl={currentUrl} onNavigate={onNavigate} />,
  'https://mail.goggles.com/login': (currentUrl, onNavigate) => <GogglesMail initialUrl={currentUrl} onNavigate={onNavigate} />,

  // Playback Machine - アーカイブビューア
  'https://playback.archive': (currentUrl, onNavigate) => <PlaybackMachinePage url={currentUrl} onNavigate={onNavigate} />,
  'https://playback.archive/': (currentUrl, onNavigate) => <PlaybackMachinePage url={currentUrl} onNavigate={onNavigate} />,
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
  'YuhiShinbunPage': (documentId, initialData) =>
    <YuhiShinbunPage documentId={documentId} initialData={initialData} />,
  'ChiitaPage': (documentId, initialData) =>
    <ChiitaPage documentId={documentId} initialData={initialData} />,
  'NyahooNewsPage': (documentId, initialData) =>
    <NyahooNewsPage documentId={documentId} initialData={initialData} />,
  'NyahooQuestionPage': (documentId, initialData) =>
    <NyahooQuestionPage documentId={documentId} initialData={initialData} />,
  'UsopediaPage': (documentId, initialData) =>
    <UsopediaPage documentId={documentId} initialData={initialData} />,
  'NittaBlogPage': (documentId, initialData) =>
    <NittaBlogPage documentId={documentId} initialData={initialData} />,
  'KyetPage': (documentId, initialData) =>
    <KyetPage documentId={documentId} initialData={initialData} />,
};
