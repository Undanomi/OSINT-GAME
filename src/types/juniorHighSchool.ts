// 中学校ホームページのデータ型を定義する

export interface JuniorHighSchoolNews {
  date: string;
  category: string;
  title: string;
  content: string;
}

export interface JuniorHighSchoolClub {
  name: string;
  description: string;
  achievement?: string;
}

export interface JuniorHighSchoolContent {
  schoolName: string;
  principal: string;
  address: string;
  phone: string;
  fax: string;
  email: string;
  established: string;
  studentCount: number;
  schoolImage?: string; // 校舎画像（オプション）
  philosophy: string; // 教育理念
  greeting: string; // 校長挨拶
  news: JuniorHighSchoolNews[]; // お知らせ
  clubs: JuniorHighSchoolClub[]; // 部活動
}
