// Nyahoo!無知袋の投稿データの型定義

export interface NyahooQuestionContent {
  user_id: string;
  date: string;
  content: string;
  supplement: string; // 追記
  createdAt: Date;
  updatedAt: Date;
  tag: string;
  likes: number;
  reply_count: number; // (リプライ数) ー (ネストされたリプライ数)
  replies: NyahooQuestionReply[];
  ads: NyahooQuestionAd[]; // 広告
  trending_questions: NyahooQuestionTrending[]; // サイドバーに表示するトレンドの質問
}

export interface NyahooQuestionReply {
  user_id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  likes: number;
  bads: number;
  thanks: number;
  replies: NyahooQuestionReply[]; // ネストされた返信
}

export interface NyahooQuestionAd {
  text: string;
  button: string;
}

export interface NyahooQuestionTrending {
  title: string;
  replies: number;
  category: string;
}