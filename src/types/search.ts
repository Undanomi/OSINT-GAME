// 統一的な検索結果の型定義
export interface UnifiedSearchResult {
  id: string;
  title: string;
  url: string;
  description: string;
  template: string; // 使用するページコンポーネント名（アイコン判定にも使用）
  content: Record<string, unknown>; // ページ固有のコンテンツ
  keywords: string[]; // 検索用キーワード
  domainStatus: 'active' | 'expired' | 'hidden'; // ドメインの状態
  archivedDate: string; // Playback Machineで表示するアーカイブ日付
}

