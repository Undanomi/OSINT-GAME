// 学校口コミサイトのデータ型を定義する

export interface SchoolReviewItem {
  reviewer: string; // レビュアー名
  date: string; // 投稿日
  rating: number; // 評価 (1-5)
  category: string; // カテゴリー（施設、教育、環境など）
  title: string; // レビュータイトル
  content: string; // レビュー内容
  helpful: number; // 参考になった数
}

export interface SchoolReviewContent {
  schoolName: string; // 学校名
  schoolType: string; // 学校種別（小学校、中学校など）
  location: string; // 所在地
  averageRating: number; // 平均評価 (1-5)
  totalReviews: number; // 総口コミ数
  reviews: SchoolReviewItem[]; // 口コミ一覧
}
