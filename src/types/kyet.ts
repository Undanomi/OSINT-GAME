/**
 * KYETのホームページのデータ型を定義
 */

/**
 * アウトドアツアーの詳細情報
 */
export interface KyetTour {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  location: string;
  images: string[];
  startDate?: string;
  endDate?: string;
  maxParticipants?: number;
  currentParticipants?: number;
}

/**
 * イベントの詳細情報
 */
export interface KyetEvent {
  id: string;
  title: string;
  description: string;
  eventType: 'workshop' | 'seminar' | 'outdoor_activity' | 'team_building';
  date: string;
  time: string;
  location: string;
  price: number;
  images: string[];
  maxParticipants?: number;
  currentParticipants?: number;
}

/**
 * スタッフ情報
 */
export interface KyetStaff {
  name: string;
  role: string;
  bio: string;
  image: string;
  specialties: string[];
}

/**
 * 顧客レビュー
 */
export interface KyetReview {
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  tourOrEventTitle: string;
}

/**
 * 企業情報
 */
export interface KyetCompanyInfo {
  name: string;
  mission: string;
  vision: string;
  foundedYear: number;
  location: string;
  contactInfo: {
    phone: string;
    email: string;
    address: string;
  };
}

/**
 * KYET用のコンテンツ型（search_resultに含まれる）
 */
export interface KyetContent {
  companyInfo: KyetCompanyInfo;
  featuredTours: KyetTour[];
  upcomingEvents: KyetEvent[];
  staff: KyetStaff[];
  reviews: KyetReview[];
  heroImage: string;
  aboutText: string;
  rollingImages: string[];
  achievements: Array<{
    title: string;
    description: string;
    icon?: string;
  }>;
  socialLinks: {
    link?: string;
  };
}

