// Chiitaのデータ型定義

export interface ChiitaContent {
  title: string;
  publicDate: string;
  updateDate: string;
  author: string;
  content: ChiitaMainContent;
  tags: string[];
  readTime: number; // 読了時間（分）

  // コメント
  comments: ChiitaComment[];
}

export interface ChiitaMainContent {
    chapters: ChiitaChapter[];
}

export interface ChiitaChapter {
    title: string;
    content: string; // マークダウン形式に対応している
    image?: string; // 各章で使用したい画像があれば利用する
}

// 1 記事につけられたコメント
export interface ChiitaComment {
    user: string;
    date: string;
    content: string;
}