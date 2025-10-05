// OSINTricks ページのデータ型定義

// ホームページ用
export interface OSINTricksHomeContent {
  title: string;
  description: string;
  subtitle: string;
  tips: OSINTricksTipFull[];
}

// Tipsページ用
export interface OSINTricksTipFull {
  id: string;
  tipNumber: number;
  title: string;
  description: string;
  sections?: OSINTricksSection[];
}

export interface OSINTricksSection {
  title: string;
  content: string;
  examples?: string[];
}
