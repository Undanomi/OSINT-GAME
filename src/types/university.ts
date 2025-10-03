// 大学ホームページのデータ型を定義する

export interface UniversityNews {
  date: string;
  category: string;
  title: string;
  summary: string;
}

export interface UniversityFaculty {
  name: string;
  description: string;
  departments: string[];
}

export interface UniversityCampus {
  name: string;
  address: string;
  description: string;
}

export interface UniversityContent {
  universityName: string;
  englishName: string;
  president: string;
  address: string;
  phone: string;
  email: string;
  established: string;
  studentCount: number;
  campusImage?: string; // キャンパス画像（オプション）
  vision: string; // 建学の精神・ビジョン
  presidentMessage: string; // 学長メッセージ
  news: UniversityNews[]; // ニュース
  faculties: UniversityFaculty[]; // 学部紹介
  campuses: UniversityCampus[]; // キャンパス情報
}
