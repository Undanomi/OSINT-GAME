// 辞書サイト（日本語辞書Un）のデータ型を定義する

export interface UsageExample {
  example: string; // 使用例文
  meaning: string; // 例文の意味・解説
}

export interface RelatedTerm {
  term: string; // 関連用語
  relation: string; // 関連性（類義語、対義語など）
}

export interface DictionaryContent {
  term: string; // 用語
  reading: string; // 読み方
  partOfSpeech: string; // 品詞
  definitions: string[]; // 定義・意味（複数の意味を持つ場合）
  etymology: string; // 語源
  usageExamples: UsageExample[]; // 使用例
  relatedTerms: RelatedTerm[]; // 関連用語
  notes: string; // 補足・注意事項
}
