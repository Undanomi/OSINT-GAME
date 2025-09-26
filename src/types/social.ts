/**
 * SNS関連の型定義
 * ユーザー3アカウント + NPC + 統一タイムライン + ページネーション対応
 */

/**
 * ソーシャルアカウント情報（Firestore用）
 * path: users/{userId}/socialAccounts/{stable_id}
 */
export interface SocialAccount {
  id: string; // stable_id: バックエンドでの一意識別子（不変）
  account_id: string; // account_id: フロントエンド表示用ID（変更可能）
  name: string;
  avatar: string;
  bio: string;
  location: string;
  company?: string;
  position?: string;
  education?: string;
  birthday?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  followersCount: number;
  followingCount: number;
  canDM: boolean;
}

/**
 * NPC定義情報（Firestore用）
 * path: socialNPCs/{stable_id}
 */
export interface SocialNPC {
  id: string; // stable_id: バックエンドでの一意識別子（不変）
  account_id: string; // account_id: フロントエンド表示用ID（従来のnpc_idに相当）
  name: string;
  avatar: string;
  bio: string;
  location: string;
  company?: string;
  position?: string;
  education?: string;
  birthday?: string;
  followersCount: number;
  followingCount: number;
  canDM: boolean;
  systemPrompt: string; // DM用のシステムプロンプト
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * SNS投稿情報（Firestore用）
 * ユーザー投稿: users/{userId}/socialAccounts/{accountId}/posts/{postId}
 * NPC投稿: socialNPCs/{npcId}/posts/{postId}
 * 統合タイムライン: users/{userId}/socialTimeline/{postId}
 * NPC統合投稿: socialNPCPosts/{postId}
 */
export interface SocialPost {
  id: string;
  authorId: string; // SocialAccount.id（stable_id）または SocialNPC.id（stable_id）
  authorType: 'user' | 'npc';
  content: string;
  timestamp: Date;
  likes: number;
  comments: number;
  shares: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * UI用の投稿データ（表示用に時間文字列と作者情報を含む）
 */
export interface UISocialPost extends Omit<SocialPost, 'timestamp'> {
  timestamp: Date;
  /** 表示用のフォーマット済み時間文字列 (例: "8時間前") */
  timeString: string;
  /** 投稿者の情報 */
  author: {
    id: string; // stable_id (内部識別用)
    account_id: string; // 表示用ID
    name: string;
    avatar: string;
  };
}

/**
 * DM連絡先情報（Firestore用）
 * path: users/{userId}/socialContacts/{contactId}
 */
export interface SocialContact {
  id: string;
  name: string;
  type: ContactType;
}

/**
 * DM連絡先情報（UI用）
 */
export interface UISocialContact {
  id: string;
  name: string;
  status: 'online' | 'offline';
  lastMessage: string;
  lastTime: string;
  type: ContactType;
}

/**
 * DMメッセージ情報（Firestore用）
 * path: users/{userId}/socialContacts/{contactId}/history/{messageId}
 */
export interface SocialDMMessage {
  id: string;
  sender: 'user' | 'npc';
  text: string;
  timestamp: Date;
}

/**
 * DMメッセージ情報（UI用）
 */
export interface UISocialDMMessage {
  id: string;
  sender: 'me' | 'other';
  text: string;
  time: string;
  timestamp: Date;
}

/**
 * フォロー関係情報（Firestore用）
 * path: users/{userId}/socialAccounts/{accountId}/following/{followingId}
 * path: users/{userId}/socialAccounts/{accountId}/followers/{followerId}
 */
export interface FollowRelation {
  id: string;
  targetType: 'user' | 'npc';
  timestamp: Date;
}

/**
 * ローカルキャッシュデータの型定義
 */
export interface CachedSocialPosts {
  posts: UISocialPost[];
  timestamp: number;
  hasMore: boolean;
}

export interface CachedSocialAccounts {
  accounts: SocialAccount[];
  timestamp: number;
}

export interface CachedSocialMessages {
  messages: UISocialDMMessage[];
  hasMore: boolean;
  timestamp: number;
}

export interface CachedSocialNPCs {
  npcs: SocialNPC[];
  timestamp: number;
}

/**
 * キャッシュされた連絡先リストデータ
 */
export interface CachedSocialContacts {
  contacts: SocialContact[];
  timestamp: number;
}

/**
 * キャッシュされたソーシャルアカウントリストデータ
 */
export interface CachedSocialAccounts {
  accounts: SocialAccount[];
  timestamp: number;
}

/**
 * キャッシュされた個別NPCプロフィールデータ
 */
export interface CachedSocialNPCProfile {
  npc: SocialNPC;
  timestamp: number;
}

/**
 * ページング対応の投稿リクエストパラメータ
 */
export interface PostsRequestParams {
  userId?: string;
  accountId?: string;
  npcId?: string;
  limit?: number;
  cursor?: string;
}

/**
 * キャッシュされたアカウント投稿データ
 */
export interface CachedAccountPosts {
  userId: string;
  accountId: string;
  posts: UISocialPost[];
  hasMore: boolean;
  timestamp: number;
}

/**
 * キャッシュされたNPC投稿データ
 */
export interface CachedNPCPosts {
  npcId: string;
  posts: UISocialPost[];
  hasMore: boolean;
  timestamp: number;
}

/**
 * ソーシャルストア（ローカルキャッシュ）の型定義
 */
export interface SocialStore {
  timeline: {
    [userId: string]: {
      posts: UISocialPost[];
      hasMore: boolean;
      timestamp: number;
    };
  };
  accountPosts: {
    [userId: string]: {
      [accountId: string]: CachedAccountPosts;
    };
  };
  npcPosts: {
    [npcId: string]: CachedNPCPosts;
  };
  accounts: {
    [userId: string]: CachedSocialAccounts;
  };
  npcs: CachedSocialNPCs | null;
  socialNPCPosts: {
    posts: UISocialPost[];
    hasMore: boolean;
    timestamp: number;
  } | null;
  contacts: {
    [key: string]: CachedSocialContacts; // key format: `${userId}_${accountId}`
  };
  messages: {
    [key: string]: CachedSocialMessages; // key format: `${userId}_${accountId}_${contactId}`
  };
}


/**
 * アカウント管理用のコンテキスト型
 */
export interface SocialAccountContextType {
  accounts: SocialAccount[];
  activeAccount: SocialAccount | null;
  loading: boolean;
  isCreatingDefaults: boolean;
  error: string | null;
  switchAccount: (accountId: string) => Promise<void>;
  createAccount: (accountData: SocialAccount) => Promise<SocialAccount>;
  updateAccount: (accountId: string, updates: Partial<SocialAccount>) => Promise<void>;
  deleteAccount: (accountId: string) => Promise<void>;
  refreshAccounts: () => Promise<void>;
}

/**
 * ページネーション用の結果型
 */
export interface PaginatedResult<T> {
  items: T[];
  hasMore: boolean;
  lastCursor?: string;
}

/**
 * タイムライン取得用のパラメータ
 */
export interface TimelineParams {
  userId: string;
  limit?: number;
  cursor?: string;
}

/**
 * DM履歴取得用のパラメータ
 */
export interface DMHistoryParams {
  userId: string;
  accountId: string;
  contactId: string;
  limit?: number;
  cursor?: string;
}

/**
 * SNSアプリで表示可能なビューの種類
 */
export type SocialView = 'home' | 'search' | 'new-post' | 'dm' | 'dm-chat' | 'profile' | 'my-profile' | 'npc-profile' | 'inactive-user-profile' | 'more' | 'edit-profile' | 'account-switcher' | 'create-account';

/**
 * 連絡先タイプの列挙
 */
export type ContactType = 'npc' | 'default';

/**
 * NPCとユーザーアカウント間の関係性情報（Firestore用）
 * path: users/{userId}/socialAccounts/{accountId}/Relationships/{contactId}
 */
export interface SocialRelationship {
  trust: number; // 信頼度 (0-100)
  caution: number; // 警戒度 (0-100)
  lastInteractionAt: Date;
  updatedAt: Date;
}

/**
 * AI応答の構造化されたレスポンス
 */
export interface SocialAIResponse {
  responseText: string;
  newTrust: number;
  newCaution: number;
}


/**
 * エラータイプの列挙
 */
export type SocialErrorType = 'rateLimit' | 'dbError' | 'networkError' | 'authError' | 'aiServiceError' | 'aiResponseError' | 'accountDuplicate' | 'general';

/**
 * デフォルトのソーシャルアカウントデータ（初回登録時用）
 * Firestoreのデフォルト設定から作成
 */
export const createDefaultSocialAccount = (
  defaultSettings: SocialAccount
): SocialAccount => defaultSettings;


/**
 * エラーメッセージの定数（固定）
 */
export const SOCIAL_ERROR_MESSAGES = {
  rateLimit: "しばらく待ってから再度お試しください。",
  dbError: "データの保存に失敗しました。しばらく待ってから再試行してください。",
  networkError: "ネットワーク接続に問題があります。接続を確認してください。",
  authError: "認証に失敗しました。再ログインしてください。",
  aiServiceError: "AIサービスが一時的に利用できません。しばらく待ってから再試行してください。",
  aiResponseError: "AI応答の処理中にエラーが発生しました。再試行してください。",
  accountDuplicate: "このユーザーIDは既に使用されています。別のIDを選択してください。",
  general: "申し訳ありません。エラーが発生しました。"
};

/**
 * エラータイプに基づいてエラーメッセージを取得する
 */
export function getSocialErrorMessage(errorType: SocialErrorType): string {
  return SOCIAL_ERROR_MESSAGES[errorType];
}

/**
 * FirestoreのSocialPostをUI用のUISocialPostに変換する
 */
export function convertToUISocialPost(
  post: SocialPost,
  author: { id: string; account_id: string; name: string; avatar: string }
): UISocialPost {
  const now = new Date();
  const diffMs = now.getTime() - post.timestamp.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  let timeString: string;
  if (diffDays > 0) {
    timeString = `${diffDays}日前`;
  } else if (diffHours > 0) {
    timeString = `${diffHours}時間前`;
  } else {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes > 0) {
      timeString = `${diffMinutes}分前`;
    } else {
      timeString = 'たった今';
    }
  }

  return {
    ...post,
    timeString,
    author,
  };
}

/**
 * FirestoreのSocialDMMessageをUI用のUISocialDMMessageに変換する
 */
export function convertToUISocialDMMessage(message: SocialDMMessage): UISocialDMMessage {
  return {
    id: message.id,
    sender: message.sender === 'user' ? 'me' : 'other',
    text: message.text,
    time: message.timestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
    timestamp: message.timestamp
  };
}



/**
 * 表示用のユーザーIDを取得（@マーク付き）
 * @param accountId フロントエンド表示用のaccount_id
 */
export function getDisplayUserId(accountId: string | undefined): string {
  if (!accountId) return '@unknown';
  return accountId.startsWith('@') ? accountId : `@${accountId}`;
}