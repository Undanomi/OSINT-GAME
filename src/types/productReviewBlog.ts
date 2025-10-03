// 商品レビューブログのデータ型を定義する

export interface ReviewSection {
  title: string; // セクションタイトル
  content: string; // セクション内容
}

export interface ProductReviewBlogContent {
  bloggerName: string; // ブロガー名
  bloggerProfile: string; // ブロガープロフィール
  postDate: string; // 投稿日
  productName: string; // 商品名
  manufacturer: string; // メーカー
  category: string; // カテゴリー
  rating: number; // 評価 (1-5)
  purchaseDate: string; // 購入日
  purchaseLocation: string; // 購入場所
  price: number; // 価格
  pros: string[]; // メリット
  cons: string[]; // デメリット
  reviewSections: ReviewSection[]; // レビューセクション
  overallReview: string; // 総評
  recommendationScore: number; // おすすめ度 (1-5)
}
