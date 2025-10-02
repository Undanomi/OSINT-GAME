// 名字占いサイトのデータ型を定義する

export interface FortuneCategory {
  category: string;
  score: number; // 1-100
  description: string;
}

export interface SurnameFortuneContent {
  surname: string; // 名字
  reading: string; // 読み方
  origin: string; // 名字の由来
  meaning: string; // 名字の意味
  totalScore: number; // 総合運勢スコア (1-100)
  luckyColor: string; // ラッキーカラー
  luckyNumber: number; // ラッキーナンバー
  luckyItem: string; // ラッキーアイテム
  fortuneCategories: FortuneCategory[]; // 運勢カテゴリー別の詳細
  compatibility: {
    good: string[]; // 相性の良い名字
    bad: string[]; // 相性の悪い名字
  };
  advice: string; // 今日のアドバイス
}
