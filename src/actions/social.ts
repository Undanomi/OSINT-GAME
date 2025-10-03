'use server';

import { getAdminFirestore } from '@/lib/auth/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import {
  SocialAccount,
  SocialPost,
  SocialNPC,
  SocialContact,
  SocialDMMessage,
  PaginatedResult,
  TimelineParams,
  DMHistoryParams,
  SocialRelationship,
  SocialAIResponse,
  UISocialPost,
  convertToUISocialPost
} from '@/types/social';
import {
  SOCIAL_POSTS_PER_PAGE,
  SOCIAL_MESSAGES_PER_PAGE,
  MAX_SOCIAL_CONVERSATION_HISTORY_LENGTH,
  MAX_SOCIAL_CONVERSATION_HISTORY_SIZE,
  MAX_SOCIAL_AI_RETRY_ATTEMPTS
} from '@/lib/social/constants';
import { GoogleGenerativeAI, Content } from '@google/generative-ai';
import { requireAuth, ensureAuth } from '@/lib/auth/server';
import type { RateLimitInfo } from '@/types/messenger';

// =====================================
// レート制限設定
// =====================================
const RATE_LIMIT_PER_MINUTE = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const userRateLimit = new Map<string, RateLimitInfo>();

/**
 * AI応答生成用のパラメータ
 */
interface SocialAIRequestParams {
  message: string;
  chatHistory: Content[];
  npcId: string;
  userProfile: SocialAccount; // フロントエンドから送信（編集可能なため）
  accountId: string; // バックエンドで関係性を取得・更新するために使用
}

// =====================================
// レート制限ユーティリティ
// =====================================

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
    // レート制限に達している
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
 * 1. 直近の設定件数に制限
 * 2. サイズ制限チェック
 */
function optimizeConversationHistory(history: Content[]): Content[] {
  if (!history || history.length === 0) {
    return [];
  }

  // 1. 直近の設定件数を取得
  let optimizedHistory = [...history];
  if (optimizedHistory.length > MAX_SOCIAL_CONVERSATION_HISTORY_LENGTH) {
    optimizedHistory = optimizedHistory.slice(-MAX_SOCIAL_CONVERSATION_HISTORY_LENGTH);
  }

  // 2. サイズ制限チェック
  let totalSize = 0;
  let validHistoryLength = optimizedHistory.length;

  for (let i = optimizedHistory.length - 1; i >= 0; i--) {
    const entry = optimizedHistory[i];
    const entrySize = JSON.stringify(entry).length;

    if (totalSize + entrySize > MAX_SOCIAL_CONVERSATION_HISTORY_SIZE) {
      validHistoryLength = i + 1;
      break;
    }

    totalSize += entrySize;
  }

  optimizedHistory = optimizedHistory.slice(-validHistoryLength);

  return optimizedHistory;
}


// =====================================
// デフォルト設定管理
// =====================================


/**
 * 全てのデフォルトソーシャルアカウント設定を取得
 */
export const getAllDefaultSocialAccountSettings = ensureAuth(async (): Promise<SocialAccount[]> => {
  const db = getAdminFirestore();
  try {
    const settingsRef = db.collection('defaultSocialAccountSettings');
    const settingsSnapshot = await settingsRef.get();

    const settings: SocialAccount[] = [];
    settingsSnapshot.forEach((doc) => {
      const data = doc.data();
      settings.push({
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as SocialAccount);
    });

    return settings;
  } catch (error) {
    console.error('Failed to get all default social account settings:', error);
    throw new Error('dbError');
  }
});


// =====================================
// アカウント管理
// =====================================

/**
 * ユーザーのソーシャルアカウント一覧を取得（認証必須）
 */
export const getSocialAccounts = requireAuth(async (userId: string): Promise<SocialAccount[]> => {
  const db = getAdminFirestore();

  try {
    const accountsRef = db.collection('users').doc(userId).collection('socialAccounts');
    const snapshot = await accountsRef.orderBy('createdAt', 'asc').get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as SocialAccount;
    });
  } catch (error) {
    console.error('Failed to get social accounts:', error);
    throw new Error('dbError');
  }
});

/**
 * 新しいソーシャルアカウントを作成
 */
export const createSocialAccount = requireAuth(async (
  userId: string,
  accountData: SocialAccount
): Promise<SocialAccount> => {
  const db = getAdminFirestore();

  try {
    // アカウントIDの検証
    if (!accountData.id || accountData.id.trim() === '') {
      throw new Error('アカウントIDが無効です');
    }

    const docRef = db.collection('users').doc(userId).collection('socialAccounts').doc(accountData.id);
    await docRef.set({
      ...accountData,
      createdAt: Timestamp.fromDate(accountData.createdAt),
    });

    // 連絡先の初期化は不要（NPCとのDM開始時に追加される）

    return accountData;
  } catch (error) {
    console.error('Failed to create social account:', error);
    throw new Error('dbError');
  }
});

/**
 * ソーシャルアカウントを更新
 */
/**
 * account_idの重複チェック（認証済みユーザーのアカウントとNPCを対象）
 */
async function checkAccountIdDuplicate(
  userId: string,
  accountId: string,
  excludeStableId: string
): Promise<boolean> {
  const db = getAdminFirestore();
  try {
    // 1. NPCのaccount_idをチェック
    const npcsRef = db.collection('socialNPCs');
    const npcSnapshot = await npcsRef.where('account_id', '==', accountId).get();

    if (!npcSnapshot.empty) {
      return true; // NPC側で重複
    }

    // 2. 認証済みユーザーのアカウントをチェック
    const socialAccountsRef = db.collection('users').doc(userId).collection('socialAccounts');
    const accountSnapshot = await socialAccountsRef.where('account_id', '==', accountId).get();

    if (!accountSnapshot.empty) {
      // excludeStableIdが指定されている場合、それを除外
      const matchingDocs = accountSnapshot.docs.filter(doc => doc.id !== excludeStableId);
      if (matchingDocs.length > 0) {
        return true; // 重複あり
      }
    }

    return false; // 重複なし
  } catch (error) {
    console.error('Error checking account ID duplicate:', error);
    throw new Error('dbError');
  }
}

export const updateSocialAccount = requireAuth(async (
  userId: string,
  accountId: string,
  updates: Partial<SocialAccount>
): Promise<void> => {
  const db = getAdminFirestore();

  try {
    // account_idが変更される場合は重複チェック
    if (updates.account_id) {
      const isDuplicate = await checkAccountIdDuplicate(userId, updates.account_id, accountId);
      if (isDuplicate) {
        throw new Error('accountDuplicate');
      }
    }

    const accountRef = db.collection('users').doc(userId).collection('socialAccounts').doc(accountId);
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };

    await accountRef.update(updateData);
  } catch (error) {
    if (error instanceof Error && error.message === 'accountDuplicate') {
      throw error;
    }
    console.error('Failed to update social account:', error);
    throw new Error('dbError');
  }
});

/**
 * ソーシャルアカウントを削除
 */
export const deleteSocialAccount = requireAuth(async (userId: string, accountId: string): Promise<void> => {
  const db = getAdminFirestore();

  try {
    const accountRef = db.collection('users').doc(userId).collection('socialAccounts').doc(accountId);
    await accountRef.delete();
  } catch (error) {
    console.error('Failed to delete social account:', error);
    throw new Error('dbError');
  }
});

/**
 * アクティブアカウントを切り替え
 */
export const switchActiveAccount = requireAuth(async (userId: string, accountId: string): Promise<void> => {
  const db = getAdminFirestore();

  try {
    const batch = db.batch();
    const accountsRef = db.collection('users').doc(userId).collection('socialAccounts');
    const accountsSnapshot = await accountsRef.get();

    accountsSnapshot.docs.forEach(docSnap => {
      const ref = db.collection('users').doc(userId).collection('socialAccounts').doc(docSnap.id);
      batch.update(ref, {
        isActive: docSnap.id === accountId
      });
    });

    await batch.commit();
  } catch (error) {
    console.error('Failed to switch active account:', error);
    throw new Error('dbError');
  }
});

// =====================================
// 投稿管理
// =====================================




/**
 * NPC投稿をsocialNPCPostsコレクションに保存
 */
export async function saveNPCPostToCentralCollection(
  postId: string,
  post: SocialPost
): Promise<void> {
  const db = getAdminFirestore();
  try {
    if (post.authorType !== 'npc') {
      return; // NPCの投稿でない場合は何もしない
    }

    const centralPostRef = db.collection('socialNPCPosts').doc(postId);
    await centralPostRef.set({
      authorId: post.authorId,
      authorType: post.authorType,
      content: post.content,
      timestamp: Timestamp.fromDate(post.timestamp),
      likes: post.likes,
      comments: post.comments,
      shares: post.shares,
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    });
  } catch (error) {
    console.error('Failed to save NPC post to central collection:', error);
    throw new Error('dbError');
  }
}




/**
 * タイムライン取得（socialNPCPostsのみから取得）
 */
export const getTimeline = ensureAuth(async (params: Omit<TimelineParams, 'userId'>): Promise<PaginatedResult<SocialPost>> => {
  const db = getAdminFirestore();
  try {
    const { limit: pageLimit = SOCIAL_POSTS_PER_PAGE, cursor } = params;

    // socialNPCPostsから直接取得
    const npcPostsRef = db.collection('socialNPCPosts');
    let npcQuery = npcPostsRef.orderBy('timestamp', 'desc').limit(pageLimit);

    if (cursor) {
      const cursorDoc = await npcPostsRef.doc(cursor).get();
      if (cursorDoc.exists) {
        npcQuery = npcPostsRef.orderBy('timestamp', 'desc').startAfter(cursorDoc).limit(pageLimit);
      }
    }

    const snapshot = await npcQuery.get();
    const posts = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      };
    }) as SocialPost[];

    return {
      items: posts,
      hasMore: posts.length === pageLimit,
      lastCursor: posts.length > 0 ? posts[posts.length - 1].id : undefined,
    };
  } catch (error) {
    console.error('Failed to get timeline:', error);
    throw new Error('dbError');
  }
});

// =====================================
// NPC管理
// =====================================

/**
 * NPCリストを取得
 */
export const getSocialNPCs = ensureAuth(async (): Promise<SocialNPC[]> => {
  const db = getAdminFirestore();
  try {
    const npcsRef = db.collection('socialNPCs');
    const snapshot = await npcsRef.where('isActive', '==', true).get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // TimestampオブジェクトをDateに変換
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      };
    }) as SocialNPC[];
  } catch (error) {
    console.error('Failed to get social NPCs:', error);
    throw new Error('dbError');
  }
});

/**
 * 特定のNPCを取得
 */
export const getSocialNPC = requireAuth(async (_userId: string, npcId: string): Promise<SocialNPC | null> => {
  const db = getAdminFirestore();
  try {
    const npcRef = db.collection('socialNPCs').doc(npcId);
    const npcSnapshot = await npcRef.get();

    if (!npcSnapshot.exists) {
      return null;
    }

    const data = npcSnapshot.data();
    if (!data) {
      return null;
    }

    return {
      id: npcSnapshot.id,
      ...data,
      // TimestampオブジェクトをDateに変換
      createdAt: data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || new Date(),
    } as SocialNPC;
  } catch (error) {
    console.error('Failed to get social NPC:', error);
    throw new Error('dbError');
  }
});

/**
 * 指定されたNPCの全エラーメッセージを取得
 */
export const getErrorMessage = requireAuth(async (_userId: string, npcId: string): Promise<Record<string, string> | null> => {
  const db = getAdminFirestore();
  try {
    const docRef = db.collection('socialNPCs').doc(npcId).collection('config').doc('errorMessages');
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const data = docSnap.data();
      return data || null;
    }

    return null;
  } catch (error) {
    console.error('Error getting error messages:', error);
    return null;
  }
});

/**
 * NPCプロフィールの投稿一覧を取得（ページング対応）
 */
export const getNPCPosts = requireAuth(async (
  _userId: string,
  npcId: string,
  pageLimit: number = SOCIAL_POSTS_PER_PAGE,
  cursor?: string
): Promise<PaginatedResult<UISocialPost>> => {
  const db = getAdminFirestore();
  try {
    // NPC情報を取得
    const npcDoc = await db.collection('socialNPCs').doc(npcId).get();
    if (!npcDoc.exists) {
      throw new Error('NPCが見つかりません');
    }
    const npc = npcDoc.data() as SocialNPC;

    const postsRef = db.collection('socialNPCs').doc(npcId).collection('posts');
    let postsQuery = postsRef.orderBy('timestamp', 'desc').limit(pageLimit);

    if (cursor) {
      const cursorDoc = await postsRef.doc(cursor).get();
      if (cursorDoc.exists) {
        postsQuery = postsRef.orderBy('timestamp', 'desc').startAfter(cursorDoc).limit(pageLimit);
      }
    }

    const snapshot = await postsQuery.get();
    const posts = snapshot.docs.map(doc => {
      const data = doc.data();
      const post: SocialPost = {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      } as SocialPost;

      const author = {
        id: npc.id,
        account_id: npc.account_id,
        name: npc.name,
        avatar: npc.avatar,
      };

      return convertToUISocialPost(post, author);
    });

    return {
      items: posts,
      hasMore: posts.length === pageLimit,
      lastCursor: posts.length > 0 ? posts[posts.length - 1].id : undefined,
    };
  } catch (error) {
    console.error('Failed to get NPC posts:', error);
    throw new Error('dbError');
  }
});

// =====================================
// DM機能
// =====================================


/**
 * DM連絡先一覧を取得（アカウントごと）
 */
export const getSocialContacts = requireAuth(async (userId: string, accountId: string): Promise<SocialContact[]> => {
  const db = getAdminFirestore();

  try {
    const contactsRef = db.collection('users').doc(userId).collection('socialAccounts').doc(accountId).collection('Contacts');
    const snapshot = await contactsRef.get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        type: data.type,
        // 関係性情報は除外（trust, caution, lastInteractionAt）
      };
    }) as SocialContact[];
  } catch (error) {
    console.error('Failed to get social contacts:', error);
    throw new Error('dbError');
  }
});

/**
 * 新しいDM連絡先を追加
 */
export const addSocialContact = requireAuth(async (
  userId: string,
  accountId: string,
  contact: SocialContact
): Promise<void> => {
  const db = getAdminFirestore();

  try {
    const contactRef = db.collection('users').doc(userId).collection('socialAccounts').doc(accountId).collection('Contacts').doc(contact.id);

    // setを使用してドキュメントIDを指定して作成または更新
    await contactRef.set({
      id: contact.id,
      name: contact.name,
      type: contact.type
    }, { merge: true });
  } catch (error) {
    console.error('Failed to add social contact:', error);
    throw new Error('dbError');
  }
});

/**
 * DMメッセージ履歴を取得（時間ベースID活用）
 */
export const getSocialMessages = requireAuth(async (userId: string, params: Omit<DMHistoryParams, 'userId'>): Promise<PaginatedResult<SocialDMMessage>> => {
  const db = getAdminFirestore();

  try {
    const { accountId, contactId, limit: pageLimit = SOCIAL_MESSAGES_PER_PAGE, cursor } = params;

    const messagesRef = db.collection('users').doc(userId).collection('socialAccounts').doc(accountId).collection('Contacts').doc(contactId).collection('history');

    // タイムスタンプフィールドでソート（インデックス自動作成）
    let messagesQuery = messagesRef.orderBy('timestamp', 'desc').limit(pageLimit);

    if (cursor) {
      // カーソルドキュメントより古いメッセージを取得
      const cursorDoc = await messagesRef.doc(cursor).get();

      if (cursorDoc.exists) {
        messagesQuery = messagesRef.orderBy('timestamp', 'desc').startAfter(cursorDoc).limit(pageLimit);
      }
    }

    const snapshot = await messagesQuery.get();
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    })) as SocialDMMessage[];

    return {
      items: messages.reverse(), // 古い順に並び替え
      hasMore: messages.length === pageLimit,
      lastCursor: messages.length > 0 ? messages[0].id : undefined,
    };
  } catch (error) {
    console.error('Failed to get social messages:', error);
    throw new Error('dbError');
  }
});

/**
 * DMメッセージを追加
 */
export const addSocialMessage = requireAuth(async (
  userId: string,
  accountId: string,
  contactId: string,
  message: SocialDMMessage
): Promise<SocialDMMessage> => {
  const db = getAdminFirestore();

  try {
    const messageRef = db.collection('users').doc(userId).collection('socialAccounts').doc(accountId).collection('Contacts').doc(contactId).collection('history').doc(message.id);
    await messageRef.set({
      sender: message.sender,
      text: message.text,
      timestamp: Timestamp.fromDate(message.timestamp),
    });

    return message;
  } catch (error) {
    console.error('Failed to add social message:', error);
    throw new Error('dbError');
  }
});


/**
 * 関係性情報を取得
 */
export const getSocialRelationship = requireAuth(async (
  userId: string,
  accountId: string,
  contactId: string
): Promise<SocialRelationship | null> => {
  const db = getAdminFirestore();

  try {
    const relationshipRef = db.collection('users').doc(userId).collection('socialAccounts').doc(accountId).collection('Relationships').doc(contactId);
    const relationshipDoc = await relationshipRef.get();

    if (!relationshipDoc.exists) {
      return null;
    }

    const data = relationshipDoc.data();
    if (!data) {
      return null;
    }

    return {
      trust: data.trust || 30,
      caution: data.caution || 70,
      lastInteractionAt: data.lastInteractionAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error('Failed to get social relationship:', error);
    return null;
  }
});

/**
 * 関係性情報を更新または作成
 */
export const updateSocialRelationship = requireAuth(async (
  userId: string,
  accountId: string,
  contactId: string,
  trust: number,
  caution: number
): Promise<void> => {
  const db = getAdminFirestore();

  try {
    const relationshipRef = db.collection('users').doc(userId).collection('socialAccounts').doc(accountId).collection('Relationships').doc(contactId);

    await relationshipRef.set({
      trust: Math.max(0, Math.min(100, trust)), // 0-100の範囲に制限
      caution: Math.max(0, Math.min(100, caution)), // 0-100の範囲に制限
      lastInteractionAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    }, { merge: true });
  } catch (error) {
    console.error('Failed to update social relationship:', error);
    throw new Error('dbError');
  }
});

/**
 * SocialApp用のAI応答を生成（プロフィール情報と信頼度・警戒度を含む）
 */
export const generateSocialAIResponse = requireAuth(async (
  userId: string,
  params: SocialAIRequestParams
): Promise<SocialAIResponse> => {
  const { message, chatHistory, npcId, userProfile, accountId } = params;

  // レート制限チェック
  checkRateLimit(userId);

  // バックエンドで現在の関係性を取得
  const relationship = await getSocialRelationship(accountId, npcId);
  const currentTrust = relationship?.trust || 30;
  const currentCaution = relationship?.caution || 70;
  try {
    // APIキーチェック
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('AI サービスが利用できません');
    }

    // NPCのシステムプロンプトを取得
    const npc = await getSocialNPC(npcId);
    if (!npc || !npc.systemPrompt) {
      throw new Error('NPC not found');
    }

    // 入力の検証とサニタイズ
    if (!message || typeof message !== 'string') {
      throw new Error('無効な入力です');
    }

    const sanitizedInput = message.trim().substring(0, 500);

    // Google Generative AI インスタンス
    const genAI = new GoogleGenerativeAI(apiKey);

    // AI モデルの設定（拡張されたシステムプロンプトを使用）
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: npc.systemPrompt,
    });

    // 会話履歴の最適化（サイズベース制限含む）
    const optimizedHistory = optimizeConversationHistory(chatHistory);

    // プロンプトの構築（信頼度・警戒度の現在値を含む）
    const promptForModel = `
    # 現在の対話相手情報
    * **ユーザー名:** ${userProfile.name}
    * **プロフィール:** ${userProfile.bio || '未設定'}
    * **職業:** ${userProfile.position || '不明'}
    * **会社:** ${userProfile.company || '不明'}
    * **学歴:** ${userProfile.education || '不明'}
    * **誕生日:** ${userProfile.birthday || '不明'}
    * **居住地:** ${userProfile.location || '不明'}

    # 現在の関係性状態
    * **現在の信頼度:** ${currentTrust}
    * **現在の警戒度:** ${currentCaution}
    # プレイヤーの入力
    ${sanitizedInput}
    `;

    // AI応答の生成
    const chat = model.startChat({
      history: optimizedHistory,
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });

    // リトライロジック付きでAI応答を取得
    let aiResponse: SocialAIResponse;
    let retryCount = 0;

    while (retryCount < MAX_SOCIAL_AI_RETRY_ATTEMPTS) {
      try {
        const result = await chat.sendMessage(promptForModel);
        const responseText = result.response.text();
        if (process.env.NODE_ENV === 'development') {
          console.log('Raw Prompt:', promptForModel);
          console.log('AI Raw Response:', responseText);
        }
        let parsedResponse = null;
        // JSON応答のパースと検証
        if (responseText.startsWith("```json") && responseText.endsWith("```")) {
          // コードブロックを除去
          const jsonString = responseText.slice(7, -3).trim();
          parsedResponse = JSON.parse(jsonString);
        } else {
          const pattern: RegExp = /\{.*?\}/gs;
        // match()メソッドで、パターンに一致するすべての部分を配列として取得
          const jsonString: string[] | null = responseText.match(pattern);
          if (jsonString == null) {
            throw new Error('No JSON found in AI response');
          }
          // 最初に見つかったJSONオブジェクトを使用
          parsedResponse = JSON.parse(jsonString[0]);
        }
        // 応答の検証
        if (!parsedResponse.responseText ||
            typeof parsedResponse.newTrust !== 'number' ||
            typeof parsedResponse.newCaution !== 'number') {
          throw new Error('Invalid response format');
        }

        aiResponse = {
          responseText: parsedResponse.responseText.trim().substring(0, 1000),
          newTrust: Math.max(0, Math.min(100, parsedResponse.newTrust)),
          newCaution: Math.max(0, Math.min(100, parsedResponse.newCaution))
        };

        break;
      } catch (apiError) {
        console.error(`AI API call attempt ${retryCount + 1} failed:`, apiError);
        retryCount++;
        if (retryCount >= MAX_SOCIAL_AI_RETRY_ATTEMPTS) {
          throw new Error('AI応答の形式が無効です');
        }
        // リトライする前に少し待機
        await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
      }
    }

    if (!aiResponse!) {
      throw new Error('AI応答の取得に失敗しました');
    }

    // AI応答で返された新しい関係性をバックエンドで自動更新
    await updateSocialRelationship(accountId, npcId, aiResponse.newTrust, aiResponse.newCaution);

    return aiResponse;

  } catch (error) {
    console.error('Failed to generate social AI response:', error);

    if (error instanceof Error) {
      if (error.message.includes('NPC not found')) {
        throw new Error('general');
      }
      if (error.message.includes('AI サービスが利用できません')) {
        throw new Error('aiServiceError');
      }
      if (error.message.includes('AI応答の形式が無効です')) {
        throw new Error('aiResponseError');
      }
      if (error.message.includes('無効な入力です')) {
        throw new Error('general');
      }
    }

    throw new Error('aiServiceError');
  }
});