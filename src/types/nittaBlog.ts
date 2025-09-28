// 個人ブログのデータ型を定義する

export interface NittaBlogAuthor {
  name: string;
  englishName: string;
  title: string;
  bio: string;
  experience: string;
  techStack: string;
  email: string;
}

export interface NittaBlogContent {
  title: string;
  publicDate: string;
  content: NittaBlogMainContent;
  tags: string[];
  author: NittaBlogAuthor; // 著者情報（メールアドレスを含む）
}

export interface NittaBlogMainContent {
    chapters: NittaBlogChapter[];
}

export interface NittaBlogChapter {
    title: string;
    content: string; // マークダウン形式に対応している
}
