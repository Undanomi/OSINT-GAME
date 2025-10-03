// 掲示板サイトのデータ型を定義する

export interface BBSPost {
  number: number; // レス番号
  name: string; // 名前（匿名の場合は「名無しさん」など）
  date: string; // 投稿日時
  id: string; // ID
  content: string; // 投稿内容
}

export interface BBSThreadContent {
  boardName: string; // 板名
  threadTitle: string; // スレッドタイトル
  threadNumber: number; // スレ番号
  posts: BBSPost[]; // 投稿一覧
  totalPosts: number; // 総レス数
}
