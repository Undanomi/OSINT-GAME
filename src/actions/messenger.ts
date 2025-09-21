'use server';

import { db } from '@/lib/firebase';
import {
  doc,
  setDoc,
  getDocs,
  getDoc,
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  Timestamp,
} from 'firebase/firestore';
import { requireAuth } from '@/lib/auth/server';
import { GoogleGenerativeAI, Content } from '@google/generative-ai';
// prompts以下は廃止予定のため削除
import type { MessengerContact, ChatMessage, RateLimitInfo, SubmissionQuestion, SubmissionResult } from '@/types/messenger';
import {
  MESSAGES_PER_PAGE,
  RATE_LIMIT_PER_MINUTE,
  RATE_LIMIT_WINDOW_MS,
  MAX_CONVERSATION_HISTORY_LENGTH,
  MAX_CONVERSATION_HISTORY_SIZE,
  MAX_AI_RETRY_ATTEMPTS,
  IntroductionMessage,
  SystemPrompt,
} from '@/lib/messenger/constants';


const userRateLimit = new Map<string, RateLimitInfo>();

/**
 * ユーザーの全てのメッセンジャー連絡先を取得する
 */
export const getContacts = requireAuth(async (userId: string): Promise<MessengerContact[]> => {
  try {
    const contactsRef = collection(db, 'users', userId, 'messages');
    const snapshot = await getDocs(query(contactsRef, orderBy('name', 'asc')));

    if (snapshot.empty) return [];

    return snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name || '',
      type: doc.data().type || 'default',
    }));
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching contacts:', error);
    }
    throw new Error('連絡先の取得に失敗しました');
  }
});

/**
 * 新しいメッセンジャー連絡先を追加する
 */
export const addContact = requireAuth(async (userId: string, contact: Omit<MessengerContact, 'id'>, contactId: string): Promise<void> => {
  try {
    const contactRef = doc(db, 'users', userId, 'messages', contactId);
    await setDoc(contactRef, contact);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
        console.error('Error adding contact:', error);
    }
    throw new Error('連絡先の追加に失敗しました');
  }
});

/**
 * 特定の連絡先とのメッセージ履歴をページネーション付きで取得する（時間ベースID活用）
 */
export const getMessages = requireAuth(async (
  userId: string,
  contactId: string,
  cursorTimestamp?: string
): Promise<{ messages: ChatMessage[], hasMore: boolean }> => {
  try {
    if (!contactId) return { messages: [], hasMore: false };

    const historyRef = collection(db, 'users', userId, 'messages', contactId, 'history');

    // タイムスタンプフィールドでソート（インデックス自動作成）
    let q = query(
      historyRef,
      orderBy('timestamp', 'desc'),
      limit(MESSAGES_PER_PAGE + 1)
    );

    if (cursorTimestamp) {
      // カーソルタイムスタンプより古いメッセージを取得
      q = query(
        historyRef,
        orderBy('timestamp', 'desc'),
        startAfter(Timestamp.fromDate(new Date(cursorTimestamp))),
        limit(MESSAGES_PER_PAGE + 1)
      );
    }

    const snapshot = await getDocs(q);
    const messages: ChatMessage[] = snapshot.docs.map(doc => ({
      id: doc.id,
      sender: doc.data().sender,
      text: doc.data().text,
      timestamp: doc.data().timestamp.toDate(),
    }));

    const hasMore = messages.length > MESSAGES_PER_PAGE;
    if (hasMore) messages.pop();

    return { messages: messages.reverse(), hasMore };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
        console.error(`Error fetching messages for contact ${contactId}:`, error);
    }
    throw new Error('dbError');
  }
});

/**
 * メッセージをFirestoreに追加する
 */
export const addMessage = requireAuth(async (userId: string, contactId: string, message: ChatMessage): Promise<void> => {
  try {
    const messageRef = doc(db, 'users', userId, 'messages', contactId, 'history', message.id);
    await setDoc(messageRef, {
      sender: message.sender,
      text: message.text,
      timestamp: Timestamp.fromDate(message.timestamp),
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
        console.error('Error adding message:', error);
    }
    throw new Error('dbError');
  }
});

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
    const npcType = contactType || 'darkOrganization';

    // Firestoreからシステムプロンプトを取得
    const systemPromptData = await getSystemPromptFromFirestore(npcType);
    if (!systemPromptData) {
      throw new Error('aiServiceError');
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      systemInstruction: systemPromptData.prompt,
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

    // リトライロジック付きでAI応答を取得
    let responseObject;
    let retryCount = 0;

    while (retryCount < MAX_AI_RETRY_ATTEMPTS) {
      try {
        const result = await chat.sendMessage(promptForModel);
        const responseText = result.response.text();

        // JSON応答のパースと検証
        responseObject = JSON.parse(responseText);
        break; // 成功した場合はループを抜ける
      } catch (jsonError) {
        retryCount++;
        if (process.env.NODE_ENV === 'development') {
          console.error(`JSON parsing failed (attempt ${retryCount}/${MAX_AI_RETRY_ATTEMPTS}):`, jsonError);
        }

        if (retryCount >= MAX_AI_RETRY_ATTEMPTS) {
          throw new Error('AI応答の形式が無効です');
        }

        // リトライする前に少し待機
        await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
      }
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
 * 指定されたNPCのイントロダクションメッセージを取得
 */
export async function getIntroductionMessageFromFirestore(npcType: string): Promise<IntroductionMessage | null> {
  try {
    const docRef = doc(db, 'messenger', npcType, 'config', 'introductionMessage');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        text: data.text,
        fallbackText: data.fallbackText,
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting introduction message:', error);
    throw error;
  }
}

/**
 * 指定されたNPCのシステムプロンプトを取得
 */
export async function getSystemPromptFromFirestore(npcType: string): Promise<SystemPrompt | null> {
  try {
    const docRef = doc(db, 'messenger', npcType, 'config', 'systemPrompts');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        prompt: data.prompt,
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting system prompt:', error);
    throw error;
  }
}

/**
 * 提出問題を取得
 */
export async function getSubmissionQuestions(npcType: string): Promise<SubmissionQuestion[]> {
  try {
    const docRef = doc(db, 'messenger', npcType, 'config', 'submissionQuestions');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.questions || [];
    }

    return [];
  } catch (error) {
    console.error('Error getting submission questions:', error);
    throw error;
  }
}

/**
 * 提出された回答を検証
 */
export const validateSubmission = requireAuth(async (
  userId: string,
  answers: string[],
  npcType: string = 'darkOrganization'
): Promise<SubmissionResult> => {
  try {
    checkRateLimit(userId);

    const questions = await getSubmissionQuestions(npcType);
    if (questions.length === 0) {
      throw new Error('提出問題が見つかりません');
    }

    let correctAnswers = 0;
    for (let i = 0; i < Math.min(answers.length, questions.length); i++) {
      const userAnswer = answers[i].trim().toLowerCase();
      const correctAnswer = questions[i].correctAnswer.trim().toLowerCase();
      if (userAnswer === correctAnswer) {
        correctAnswers++;
      }
    }

    const success = correctAnswers === questions.length;

    const explanationDocRef = doc(db, 'messenger', npcType, 'config', 'submissionExplanation');
    const explanationSnap = await getDoc(explanationDocRef);
    const explanationText = explanationSnap.exists() ? explanationSnap.data().text : undefined;

    return {
      success,
      correctAnswers,
      totalQuestions: questions.length,
      explanationText,
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error validating submission:', error);
    }

    if (error instanceof Error) {
      if (['rateLimit', 'dbError', 'networkError', 'authError', 'general'].includes(error.message)) {
        throw error;
      }
    }

    throw new Error('general');
  }
});
