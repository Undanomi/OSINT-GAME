// 夕日新聞のデータ型定義

export interface YuhiShinbunContent {
  title: string;
  date: string;
  author: string;
  image: string;
  caption: string;
  content: string;
  tags: string[];
  readTime: number; // 読了時間（分）

  // 関連記事
  relatedArticles: RelatedArticle[];
}

export interface RelatedArticle {
  title: string;
  image: string;
  abstract: string;
  tags: string[];
}