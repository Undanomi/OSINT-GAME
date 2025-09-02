'use server';

import { db } from '@/lib/firebase';
import {
  doc,
  setDoc,
  getDocs,
  collection,
  query,
  orderBy,
  limit,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { requireAuth } from '@/lib/auth/server';
import { GoogleGenerativeAI, Content } from '@google/generative-ai';
import { getMessengerAIPrompt } from '@/prompts/messengerAIPrompts';

/**
 * ユーザーごとのレート制限管理
 */
interface RateLimitInfo {
  count: number;
  resetTime: number;
}

const userRateLimit = new Map<string, RateLimitInfo>();
const RATE_LIMIT_PER_MINUTE = 10; // 1分間に10回まで
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1分間

/**
 * AI会話履歴の制限設定
 */
const MAX_CONVERSATION_HISTORY_LENGTH = 20; // 最大20件の会話履歴
const MAX_CONVERSATION_HISTORY_SIZE = 50000; // 最大50KB（文字数換算）


/**
 * レート制限チェック関数
 */
function checkRateLimit(userId: string): { allowed: boolean } {
  const now = Date.now();
  const userLimit = userRateLimit.get(userId);

  // 定期的に古いエントリをクリーンアップ（メモリリーク防止）
  cleanupExpiredRateLimits(now);

  if (!userLimit || now > userLimit.resetTime) {
    // 新規または制限時間リセット
    userRateLimit.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS
    });
    return { allowed: true };
  }

  if (userLimit.count >= RATE_LIMIT_PER_MINUTE) {
    // レート制限に達している - ErrorTypeに従ったエラーを投げる
    throw new Error('rateLimit');
  }

  // カウントアップして許可
  userLimit.count++;
  return { allowed: true };
}

/**
 * 期限切れのレート制限エントリをクリーンアップ
 * メモリリーク防止のため定期実行
 */
function cleanupExpiredRateLimits(currentTime: number): void {
  for (const [userId, limitInfo] of userRateLimit.entries()) {
    if (currentTime > limitInfo.resetTime) {
      userRateLimit.delete(userId);
    }
  }
}

/**
 * 会話履歴を最適化してメモリ使用量を制御
 * パフォーマンス向上のため長さとサイズ両方で制限
 */
function optimizeConversationHistory(history: Content[]): Content[] {
  if (!history || history.length === 0) {
    return [];
  }

  let optimizedHistory = [...history];

  // 1. 長さ制限: 最新のMAX_CONVERSATION_HISTORY_LENGTH件のみ保持
  if (optimizedHistory.length > MAX_CONVERSATION_HISTORY_LENGTH) {
    optimizedHistory = optimizedHistory.slice(-MAX_CONVERSATION_HISTORY_LENGTH);
  }

  // 2. サイズ制限: 累計文字数がMAX_CONVERSATION_HISTORY_SIZEを超えたら古いものから削除
  let totalSize = 0;
  let validHistoryLength = optimizedHistory.length;

  // 後ろから計算して制限サイズに収まる範囲を特定
  for (let i = optimizedHistory.length - 1; i >= 0; i--) {
    const entry = optimizedHistory[i];
    const entrySize = JSON.stringify(entry).length;

    if (totalSize + entrySize > MAX_CONVERSATION_HISTORY_SIZE) {
      validHistoryLength = i + 1;
      break;
    }

    totalSize += entrySize;
  }

  optimizedHistory = optimizedHistory.slice(-validHistoryLength);

  return optimizedHistory;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'npc';
  npcId?: string;
  text: string;
  timestamp: Date;
}

export interface ChatHistory {
  messages: ChatMessage[];
  lastUpdated: Date;
  gameStarted: boolean;
}

export interface MessageDocument {
  id: string;
  sender: 'user' | 'npc';
  npcId?: string;
  text: string;
  timestamp: Date;
  userId: string;
}

/**
 * 内部用: userIdを直接受け取ってチャット履歴を取得
 */
async function _getChatHistory(userId: string): Promise<ChatHistory | null> {
  try {
    // 新しい設計: users/{userId}/messages コレクションからメッセージを取得
    const messagesRef = collection(db, 'users', userId, 'messages');
    const q = query(
      messagesRef,
      orderBy('timestamp', 'asc'), // 時系列順
      limit(1000) // 最新1000件まで（パフォーマンス考慮）
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null; // メッセージが存在しない
    }

    const messages: ChatMessage[] = [];
    let lastUpdated = new Date(0); // 最古の日時で初期化

    snapshot.forEach((doc) => {
      const data = doc.data();

      // データ構造の検証
      if (!data || typeof data !== 'object') {
        return; // このメッセージをスキップ
      }

      const message: ChatMessage = {
        id: doc.id,
        sender: data.sender || 'npc',
        text: data.text || '',
        timestamp: data.timestamp?.toDate() || new Date()
      };

      messages.push(message);

      // 最新の更新日時を追跡
      if (message.timestamp > lastUpdated) {
        lastUpdated = message.timestamp;
      }
    });

    return {
      messages,
      lastUpdated,
      gameStarted: messages.length > 0 // メッセージがあればゲーム開始済み
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching chat history:', error);
    }

    if (error instanceof Error) {
      // ErrorTypeのエラーメッセージはそのまま返す
      if (['rateLimit', 'dbError', 'networkError', 'authError', 'aiServiceError', 'aiResponseError', 'general'].includes(error.message)) {
        throw error;
      }

      // server.tsからの認証エラーをErrorTypeに変換
      if (error.message.includes('認証が必要です') || error.message.includes('認証エラー') || error.message.includes('セッションが期限切れ')) {
        throw new Error('authError');
      }
    }

    throw new Error('dbError');
  }
}

/**
 * 外部用: 認証付きでチャット履歴を取得
 */
export const getChatHistory = requireAuth(async (userId: string): Promise<ChatHistory | null> => {
  return _getChatHistory(userId);
});


export const addMessage = requireAuth(async (userId: string, message: ChatMessage): Promise<void> => {
  try {
    // メッセージデータの検証
    if (!message || typeof message !== 'object') {
      if (process.env.NODE_ENV === 'development') {
        console.error('Invalid message object provided to addMessage');
      }
      throw new Error('general');
    }

    // 新設計: 各メッセージを個別ドキュメントとして保存
    const messageRef = doc(db, 'users', userId, 'messages', message.id);

    await setDoc(messageRef, {
      sender: message.sender || 'npc',
      npcId: message.npcId || null,
      text: typeof message.text === 'string' ? message.text.substring(0, 1000) : '',
      timestamp: message.timestamp ? Timestamp.fromDate(message.timestamp) : Timestamp.fromDate(new Date()),
      userId
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error adding message:', error);
    }

    if (error instanceof Error) {
      // ErrorTypeのエラーメッセージはそのまま返す
      if (['rateLimit', 'dbError', 'networkError', 'authError', 'aiServiceError', 'aiResponseError', 'general'].includes(error.message)) {
        throw error;
      }

      // server.tsからの認証エラーをErrorTypeに変換
      if (error.message.includes('認証が必要です') || error.message.includes('認証エラー') || error.message.includes('セッションが期限切れ')) {
        throw new Error('authError');
      }
    }

    throw new Error('dbError');
  }
});

export const isGameStarted = requireAuth(async (userId: string): Promise<boolean> => {
  try {
    const history = await _getChatHistory(userId);
    return history ? history.gameStarted : false;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error checking game state:', error);
    }

    if (error instanceof Error) {
      // ErrorTypeのエラーメッセージはそのまま返す
      if (['rateLimit', 'dbError', 'networkError', 'authError', 'aiServiceError', 'aiResponseError', 'general'].includes(error.message)) {
        throw error;
      }
    }

    // 一般的なエラーはfalseを返す（ゲーム状態確認の場合）
    return false;
  }
});

/**
 * サーバーサイドでAI応答を生成する
 * APIキーをクライアントに露出せず、セキュアにAI応答を取得
 *
 * @param userInput ユーザーからの入力メッセージ
 * @param conversationHistory 会話履歴（オプション）
 * @returns Promise<string> AI応答テキスト
 */
export const generateAIResponse = requireAuth(async (
  userId: string,
  userInput: string,
  conversationHistory?: Content[],
  contactType?: string
): Promise<string> => {
  try {
    if (userInput == "jsonErrorTest" && process.env.NODE_ENV === 'development') {
      throw new Error('AI応答の形式が無効です');
    }
    // レート制限チェック
    checkRateLimit(userId);

    // 入力の検証とサニタイズ
    if (!userInput || typeof userInput !== 'string') {
      throw new Error('無効な入力です');
    }

    const sanitizedInput = userInput
      .replace(/[<>]/g, '') // HTMLタグ除去
      .replace(/"/g, '\\"')   // ダブルクォートをエスケープ
      .replace(/\\/g, '\\\\') // バックスラッシュをエスケープ
      .replace(/\n/g, ' ')    // 改行を空白に変換
      .replace(/\r/g, '')     // キャリッジリターンを除去
      .trim()
      .substring(0, 500);     // 最大500文字に制限

    // APIキーの確認（サーバーサイドでのみアクセス）
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('AI サービスが利用できません');
    }

    // Google Generative AI インスタンス（サーバーサイドでのみ）
    const genAI = new GoogleGenerativeAI(apiKey);

    // AI モデルの設定
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      systemInstruction: getMessengerAIPrompt('darkOrganization'),
    });

    // 会話履歴の最適化（メモリ使用量制御）
    const optimizedHistory = optimizeConversationHistory(conversationHistory || []);

    // プロンプトの構築
    const promptForModel = `プレイヤーからの入力: ${sanitizedInput}`;

    // AI応答の生成
    const chat = model.startChat({
      history: optimizedHistory,
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 1000, // 応答の長さ制限
        temperature: 0.7, // 創造性のバランス調整
      },
    });

    const result = await chat.sendMessage(promptForModel);
    const responseText = result.response.text();

    // JSON応答のパースと検証
    let responseObject;
    try {
      responseObject = JSON.parse(responseText);
    } catch (jsonError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('JSON parsing failed:', jsonError);
      }
      throw new Error('AI応答の形式が無効です');
    }

    const { responseText: aiText } = responseObject;

    // レスポンスの型チェックとサニタイズ
    if (typeof aiText !== 'string') {
      throw new Error('AI応答の形式が無効です');
    }

    // AI応答のサニタイズ（最大1000文字制限）
    const sanitizedResponse = aiText.substring(0, 1000);

    return sanitizedResponse;

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error generating AI response:', error);
    }

    if (error instanceof Error) {
      if (error.message.includes('無効な入力です')) {
        throw new Error('general');
      }
      if (error.message.includes('AI サービスが利用できません')) {
        throw new Error('aiServiceError');
      }
      if (error.message.includes('AI応答の形式が無効です')) {
        throw new Error('aiResponseError');
      }

      // ErrorTypeのエラーメッセージはそのまま返す
      if (['rateLimit', 'dbError', 'networkError', 'authError', 'aiServiceError', 'aiResponseError', 'general'].includes(error.message)) {
        throw error;
      }

      // server.tsからの認証エラーをErrorTypeに変換
      if (error.message.includes('認証が必要です') || error.message.includes('認証エラー') || error.message.includes('セッションが期限切れ')) {
        throw new Error('authError');
      }
    }

    // 一般的なエラーはgeneralタイプとして返す
    throw new Error('general');
  }
});

/**
 * 複数のメッセージを効率的にバッチ処理で追加する
 * 大量のメッセージを一度に処理する場合にパフォーマンスが向上する
 *
 * @param messages 追加するメッセージの配列
 * @returns Promise<void>
 */
export const addMessagesBatch = requireAuth(async (userId: string, messages: ChatMessage[]): Promise<void> => {
  try {

    // 入力データの検証
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('無効なメッセージデータです');
    }

    // バッチサイズの制限（Firestoreの制限に基づく）
    const BATCH_SIZE = 500;
    const batches = [];

    for (let i = 0; i < messages.length; i += BATCH_SIZE) {
      const batchMessages = messages.slice(i, i + BATCH_SIZE);
      batches.push(batchMessages);
    }

    // 各バッチを順次処理（新設計: 各メッセージは個別ドキュメント）
    for (const batchMessages of batches) {
      const batch = writeBatch(db);

      // 各メッセージを個別ドキュメントとして追加
      for (const message of batchMessages) {
        if (!message || typeof message !== 'object') {
          continue;
        }

        const messageRef = doc(db, 'users', userId, 'messages', message.id);

        // 個別ドキュメントなので競合状態なし
        batch.set(messageRef, {
          sender: message.sender || 'npc',
          npcId: message.npcId || null,
          text: typeof message.text === 'string' ? message.text.substring(0, 1000) : '',
          timestamp: message.timestamp ? Timestamp.fromDate(message.timestamp) : Timestamp.fromDate(new Date()),
          userId
        });
      }

      // バッチを実行
      await batch.commit();
    }

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in batch adding messages:', error);
    }

    if (error instanceof Error) {
      if (error.message.includes('無効なメッセージデータです')) {
        throw new Error('general');
      }

      // ErrorTypeのエラーメッセージはそのまま返す
      if (['rateLimit', 'dbError', 'networkError', 'authError', 'aiServiceError', 'aiResponseError', 'general'].includes(error.message)) {
        throw error;
      }

      // server.tsからの認証エラーをErrorTypeに変換
      if (error.message.includes('認証が必要です') || error.message.includes('認証エラー') || error.message.includes('セッションが期限切れ')) {
        throw new Error('authError');
      }
    }

    throw new Error('dbError');
  }
});