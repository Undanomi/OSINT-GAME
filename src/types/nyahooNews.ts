// Nyahoo!ニュースの記事データの型定義

export interface NyahooNewsContent {
  title: string;
  date: string;
  publisher: string;
  image: string; // サムネイル画像URL
  caption: string;
  category: string;
  content: string;
  likes: number;
  bads: number;
  bookmarks: number;
  comments: NyahooNewsComment[];

  // 関連記事
  relatedArticles: RelatedArticle[];
}

// 1 記事につけられたコメント
export interface NyahooNewsComment {
  user: string;
  date: string;
  content: string;
  likes: number;
}

export interface RelatedArticle {
  title: string;
  date: string;
  author: string;
  likes: number;
  bads: number;
  replys: number;
}