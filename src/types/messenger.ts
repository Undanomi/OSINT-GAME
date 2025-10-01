/**
 * メッセンジャーアプリの連絡先ドキュメント構造
 * path: users/{userId}/messengers/{contactId}
 */
export interface MessengerContact {
  id: string;
  name: string;
  type: ContactType;
}

/**
 * ユーザーごとのNPC応答レート制限管理
 */
export interface RateLimitInfo {
  count: number;
  resetTime: number;
}

/**
 * ローカルキャッシュデータの型定義
 */
export interface CachedMessages {
  messages: UIMessage[];
  hasMore: boolean;
  timestamp: number;
}

/**
 * チャットメッセージを表すインターフェース（Firestore用）
 * path: users/{userId}/messengers/{contactId}/history/{messageId}
 */
export interface ChatMessage {
  id: string;
  sender: 'user' | 'npc';
  text: string;
  timestamp: Date;
}

/**
 * チャットメッセージを表すインターフェース（UI用）
 */
export interface UIMessage {
  id: string;
  sender: 'me' | 'other';
  text: string;
  /** 表示用のフォーマット済み時間文字列 (例: "17:05") */
  time: string;
  /** 無限スクロールやソート処理に使うためのDateオブジェクト */
  timestamp: Date;
  /** 提出モード中のメッセージかどうか */
  isSubmissionMessage?: boolean;
}

/**
 * エラータイプの列挙
 */
export type ErrorType = 'rateLimit' | 'dbError' | 'networkError' | 'authError' | 'aiServiceError' | 'aiResponseError' | 'general';

/**
 * 連絡先タイプの列挙
 */
export type ContactType = 'darkOrganization' | 'default';

/**
 * 提出問題の構造
 */
export interface SubmissionQuestion {
  id: string;
  text: string;
  correctAnswer: string;
}

/**
 * 提出結果の構造
 */
export interface SubmissionResult {
  success: boolean;
  correctAnswers: number;
  totalQuestions: number;
  explanationText?: string;
}

/**
 * デフォルトのメッセンジャー連絡先データ
 */
export const defaultMessengerContacts: MessengerContact[] = [
  {
    id: 'dark_organization',
    name: '闇の組織',
    type: 'darkOrganization'
  }
];


/**
 * FirestoreのChatMessageをUI用のUIMessageに変換する
 */
export function convertFirestoreToUIMessage(message: ChatMessage): UIMessage {
  return {
    id: message.id,
    sender: message.sender === 'user' ? 'me' : 'other',
    text: message.text,
    time: message.timestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
    timestamp: message.timestamp
  };
}

/**
 * UIMessageをGoogleGenerativeAIのContent形式に変換する
 */
export function convertUIMessageToContent(message: UIMessage): { role: 'user' | 'model'; parts: { text: string }[] } {
  return {
    role: message.sender === 'me' ? 'user' : 'model',
    parts: [{ text: message.text }]
  };
}