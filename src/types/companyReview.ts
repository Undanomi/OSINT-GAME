// 企業口コミサイトのデータ型を定義する

export interface CompanyReviewItem {
  reviewer: string; // レビュアーの立場（現社員、元社員など）
  date: string; // 投稿日
  rating: number; // 評価 (1-5)
  category: string; // カテゴリー（給与、働きがい、社風など）
  title: string; // レビュータイトル
  content: string; // レビュー内容
  helpful: number; // 参考になった数
}

export interface CompanyReviewContent {
  companyName: string; // 企業名
  industry: string; // 業界・業種
  location: string; // 所在地
  employeeCount: string; // 従業員数
  averageRating: number; // 平均評価 (1-5)
  totalReviews: number; // 総口コミ数
  reviews: CompanyReviewItem[]; // 口コミ一覧
}
