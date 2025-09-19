// Usopedia ページのデータ型定義

export interface UsopediaContent {
  title: string;
  publicDate: string;
  updateDateHistory: string[]; // 更新履歴
  author: string;
  content: UsopediaMainContent;
  references: UsopediaReference[];
  relatedContents: UsopediaRelatedContent[]; // 関連項目
}

export interface UsopediaMainContent {
    chapters: UsopediaChapter[];
}

export interface UsopediaChapter {
    title: string;
    content: string; // マークダウン形式に対応している
    image?: string; // 各章で使用したい画像があれば利用する
    table?: string; // 各章で使用したいテーブルがあれば利用する
}

// 参考文献
export interface UsopediaReference {
    title: string;
    date: string;
    publisher: string;
}

// 関連項目
export interface UsopediaRelatedContent {
    title: string;
}