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
 * 連絡先ごとのゲームテーマに沿ったエラーメッセージ
 */
export const ERROR_MESSAGES = {
  darkOrganization: {
    rateLimit: [
      "通信が混雑している...少し時間を置いてから再度連絡してくれ。",
      "セキュリティシステムが過負荷状態だ。しばらく待機してほしい。",
      "暗号化回線が不安定になっている。1分後に再試行してくれ。",
      "組織の通信プロトコルにより、頻繁な接続は制限されている。",
      "監視を避けるため、通信頻度を下げる必要がある。少し間を空けてくれ。"
    ],
    dbError: [
      "セキュリティプロトコルによりデータの保存に失敗した。",
      "暗号化システムにエラーが発生している。メッセージが記録できない。",
      "組織のデータベースに一時的な障害が発生している。",
      "セキュリティ監査により、通信ログの記録が中断された。"
    ],
    networkError: [
      "通信エラーが発生した。セキュリティプロトコルを確認中...",
      "暗号化システムに問題が生じている。復旧作業を行っている。",
      "組織のネットワークが不安定だ。しばらく待ってくれ。",
      "セキュリティ上の問題で一時的に通信が中断された。",
      "システムの異常を検知した。安全な接続を再確立している。"
    ],
    authError: [
      "認証システムに異常が発生している。セキュリティチェックが必要だ。",
      "アクセス権限の検証に失敗した。身元の再確認が必要かもしれない。",
      "組織のセキュリティプロトコルにより、認証が無効化された。",
      "暗号化キーに問題がある。システム管理者に連絡する必要がある。"
    ],
    aiServiceError: [
      "組織の知識処理システムが一時的に利用できない。しばらく待ってくれ。",
      "エージェント応答システムにメンテナンスが必要になった。",
      "セキュリティ上の理由により知能処理機能が無効化されている。",
      "組織内部の処理サーバーとの通信が確立できない状況だ。"
    ],
    aiResponseError: [
      "エージェント応答の解析に失敗した。システムエラーの可能性がある。",
      "暗号化された応答の復号化に問題が生じている。",
      "エージェント応答フォーマットが組織の基準に適合していない。",
      "応答データの整合性チェックでエラーが検出された。"
    ],
    general: [
      "通信エラーが発生した。セキュリティプロトコルを確認中...",
      "暗号化システムに問題が生じている。復旧作業を行っている。",
      "組織のネットワークが不安定だ。しばらく待ってくれ。",
      "セキュリティ上の問題で一時的に通信が中断された。",
      "システムの異常を検知した。安全な接続を再確立している。"
    ]
  },
  default: {
    rateLimit: [
      "少し時間を空けてからもう一度試してください。",
      "しばらく待ってから再度お試しください。",
      "通信が混雑しています。1分後に再試行してください。"
    ],
    dbError: [
      "メッセージの保存に失敗しました。しばらく待ってから再試行してください。",
      "データベース接続エラーが発生しました。",
      "一時的な保存エラーです。再度お試しください。"
    ],
    networkError: [
      "ネットワーク接続に問題があります。接続を確認してください。",
      "通信エラーが発生しました。しばらく待ってから再試行してください。",
      "接続がタイムアウトしました。ネットワーク状態を確認してください。"
    ],
    authError: [
      "認証に失敗しました。再ログインしてください。",
      "セッションが期限切れです。ログインし直してください。",
      "認証エラーが発生しました。アカウントを確認してください。"
    ],
    aiServiceError: [
      "AIサービスが一時的に利用できません。しばらく待ってから再試行してください。",
      "AIシステムにメンテナンスが必要です。後ほどお試しください。",
      "AI処理サーバーに接続できません。ネットワーク状態を確認してください。",
      "AIサービスが過負荷状態です。時間をおいて再度お試しください。"
    ],
    aiResponseError: [
      "AI応答の処理中にエラーが発生しました。再試行してください。",
      "AI応答の形式に問題があります。システム管理者に連絡してください。",
      "AI応答の解析に失敗しました。しばらく待ってから再試行してください。",
      "AI応答データに不整合が検出されました。"
    ],
    general: [
      "申し訳ありません。エラーが発生しました。",
      "通信エラーが発生しました。しばらく待ってから再試行してください。",
      "システムエラーが発生しました。"
    ]
  }
};

/**
 * 連絡先タイプからエラーメッセージ用のタイプを取得する
 */
export function getErrorMessageType(contactType?: ContactType): keyof typeof ERROR_MESSAGES {
  return contactType === 'darkOrganization' ? 'darkOrganization' : 'default';
}

/**
 * エラータイプと連絡先タイプに基づいてランダムなエラーメッセージを選択する
 */
export function selectErrorMessage(
  errorType: ErrorType,
  contactType?: ContactType
): string {
  const messageType = getErrorMessageType(contactType);
  const messages = ERROR_MESSAGES[messageType][errorType];
  return messages[Math.floor(Math.random() * messages.length)];
}

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