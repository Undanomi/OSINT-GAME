// RankedOnのデータ型定義

export interface RankedOnUser {
  userId: string;
  name: string;
  profileImage: string;
  backgroundImage?: string;
  headline: string; // 肩書き・キャッチフレーズ
  currentPosition?: string; // 現在の役職
  currentCompany?: string; // 現在の会社
  location: string;
  industry?: string; // 業界
  summary?: string; // 概要
  connectionsCount: number; // つながり数
  profileViews?: number; // プロフィール閲覧数
  searchAppearances?: number; // 検索表示回数
  
  // 職歴
  experience: Experience[];
  
  // 学歴
  education: Education[];
  
  // スキル
  skills: Skill[];
  
  // 資格・認定
  certifications?: Certification[];
  
  // 投稿・アクティビティ
  posts: RankedOnPost[];
  
  // おすすめ・推薦
  recommendations?: Recommendation[];
  
  // 言語
  languages?: Language[];
  
  // 連絡先情報
  email?: string;
  phone?: string;
  website?: string;
  rankedonUrl?: string;
}

export interface Experience {
  id?: string;
  title: string; // 役職
  company: string;
  companyLogo?: string;
  employmentType?: string; // フルタイム、パートタイム等
  location?: string;
  startDate: string;
  endDate?: string; // 現在の場合は空
  current?: boolean;
  description?: string;
  skills?: string[]; // この職務で使用したスキル
}

export interface Education {
  id?: string;
  school: string;
  schoolLogo?: string;
  degree?: string; // 学位
  fieldOfStudy?: string; // 専攻
  startYear: string;
  endYear?: string;
  grade?: string; // 成績
  activities?: string; // 課外活動
  description?: string;
}

export interface Skill {
  name: string;
  endorsements?: number; // 推薦数
  endorsed?: boolean; // 推薦済みかどうか
}

export interface Certification {
  id?: string;
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expirationDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface RankedOnPost {
  id?: string;
  content: string;
  image?: string;
  timestamp: string;
  likes: number;
  comments: number;
  reposts: number; // シェア/リポスト
  impressions?: number; // インプレッション数
  authorName?: string;
  authorTitle?: string;
  authorImage?: string;
}

export interface Recommendation {
  id?: string;
  recommenderName: string;
  recommenderTitle: string;
  recommenderImage?: string;
  relationship: string; // 関係性（上司、同僚など）
  text: string;
  date: string;
}

export interface Language {
  name: string;
  proficiency: string; // ネイティブ、ビジネス、日常会話レベル等
}

// 検索結果用の型定義
export interface RankedOnContent {
  name: string;
  profileImage: string;
  backgroundImage?: string;
  headline: string;
  currentPosition?: string;
  currentCompany?: string;
  location: string;
  industry?: string;
  summary?: string;
  connectionsCount: number;
  profileViews?: number;
  searchAppearances?: number;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  certifications?: Certification[];
  posts: RankedOnPost[];
  recommendations?: Recommendation[];
  languages?: Language[];
  email?: string;
  phone?: string;
  website?: string;
  rankedonUrl?: string;
}