// 小学校ホームページのデータ型を定義する

export interface ElementarySchoolNews {
  date: string;
  title: string;
  content: string;
}

export interface ElementarySchoolEvent {
  date: string;
  title: string;
  description: string;
}

export interface ElementarySchoolContent {
  schoolName: string;
  principal: string;
  address: string;
  phone: string;
  email: string;
  established: string;
  studentCount: number;
  schoolImage?: string; // 校舎画像（オプション）
  motto: string; // 校訓・教育目標
  greeting: string; // 校長挨拶
  news: ElementarySchoolNews[]; // お知らせ
  events: ElementarySchoolEvent[]; // 年間行事
}
