// 高等学校ホームページのデータ型を定義する

export interface HighSchoolNews {
  date: string;
  category: string;
  title: string;
  content: string;
}

export interface HighSchoolDepartment {
  name: string;
  description: string;
  features: string[];
}

export interface HighSchoolContent {
  schoolName: string;
  englishName: string;
  principal: string;
  address: string;
  phone: string;
  fax: string;
  email: string;
  established: string;
  studentCount: number;
  schoolImage?: string; // 校舎画像（オプション）
  motto: string; // 校訓
  message: string; // 校長メッセージ
  news: HighSchoolNews[]; // 新着情報
  departments: HighSchoolDepartment[]; // 学科紹介
  careerData: {
    universityRate: number; // 大学進学率
    employmentRate: number; // 就職率
  };
}
