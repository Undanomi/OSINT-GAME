// NotesApp用の定数定義

// セキュリティとコスト管理のための制限値
export const NOTES_LIMITS = {
  // メモの制限
  MAX_NOTES_PER_USER: 10,          // ユーザーあたりの最大メモ数（10件まで）
  MAX_TITLE_LENGTH: 100,           // タイトルの最大文字数
  MAX_CONTENT_LENGTH: 10000,       // 内容の最大文字数（約10KB）
  
  // デバウンス設定
  SAVE_DEBOUNCE_MS: 10000,          // 保存のデバウンス時間(10秒)
  
  // Firestore制限
  FIRESTORE_DOC_SIZE_LIMIT: 1048576, // 1MBドキュメントサイズ制限
  
  // リスト表示設定
  LIST_MAX_ITEMS: 30,              // リスト表示の最大件数
  LIST_PREVIEW_LENGTH: 100,        // プレビューの最大文字数
  
  // バッチ処理
  MAX_BATCH_ITEMS: 10,             // バッチ更新の最大アイテム数
  
  // noteID検証
  NOTE_ID_MAX_LENGTH: 100,         // noteIDの最大文字数
} as const;

// エラーメッセージ
export const NOTES_ERRORS = {
  MAX_NOTES_REACHED: 'メモの上限（10件）に達しました。不要なメモを削除してください。',
} as const;

// 正規表現パターン
export const PATTERNS = {
  NOTE_ID: /^[a-zA-Z0-9_-]+$/,     // noteIDの形式
} as const;