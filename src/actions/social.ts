'use server';

import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  SocialAccount,
  SocialPost,
  SocialNPC,
  SocialContact,
  SocialDMMessage,
  PaginatedResult,
  TimelineParams,
  DMHistoryParams
} from '@/types/social';
import { 
  MAX_SOCIAL_ACCOUNTS_PER_USER,
  SOCIAL_POSTS_PER_PAGE,
  SOCIAL_MESSAGES_PER_PAGE
} from '@/lib/social/constants';
import { GoogleGenerativeAI, Content } from '@google/generative-ai';


// =====================================
// デフォルト設定管理
// =====================================


/**
 * 全てのデフォルトソーシャルアカウント設定を取得
 */
export async function getAllDefaultSocialAccountSettings(): Promise<SocialAccount[]> {
  try {
    const settingsRef = collection(db, 'defaultSocialAccountSettings');
    const settingsSnapshot = await getDocs(settingsRef);

    const settings: SocialAccount[] = [];
    settingsSnapshot.forEach((doc) => {
      const data = doc.data();
      settings.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as SocialAccount);
    });

    return settings;
  } catch (error) {
    console.error('Failed to get all default social account settings:', error);
    throw new Error('dbError');
  }
}


// =====================================
// アカウント管理
// =====================================

/**
 * ユーザーのソーシャルアカウント一覧を取得
 */
export async function getSocialAccounts(userId: string): Promise<SocialAccount[]> {
  try {
    const accountsRef = collection(db, 'users', userId, 'socialAccounts');
    const accountsQuery = query(accountsRef, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(accountsQuery);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as SocialAccount[];
  } catch (error) {
    console.error('Failed to get social accounts:', error);
    throw new Error('dbError');
  }
}

/**
 * 新しいソーシャルアカウントを作成
 */
export async function createSocialAccount(
  userId: string,
  accountData: SocialAccount
): Promise<SocialAccount> {
  try {
    // アカウント数制限チェック
    const existingAccounts = await getSocialAccounts(userId);
    if (existingAccounts.length >= MAX_SOCIAL_ACCOUNTS_PER_USER) {
      throw new Error('accountLimit');
    }

    const accountsRef = collection(db, 'users', userId, 'socialAccounts');

    const docRef = doc(accountsRef, accountData.id);
    await setDoc(docRef, {
      ...accountData,
      createdAt: Timestamp.fromDate(accountData.createdAt),
    });

    // 連絡先の初期化は不要（NPCとのDM開始時に追加される）

    return accountData;
  } catch (error) {
    console.error('Failed to create social account:', error);
    if (error instanceof Error && error.message === 'accountLimit') {
      throw error;
    }
    throw new Error('dbError');
  }
}

/**
 * ソーシャルアカウントを更新
 */
export async function updateSocialAccount(
  userId: string, 
  accountId: string, 
  updates: Partial<SocialAccount>
): Promise<void> {
  try {
    const accountRef = doc(db, 'users', userId, 'socialAccounts', accountId);
    const updateData: Partial<SocialAccount> = { ...updates };

    await updateDoc(accountRef, updateData);
  } catch (error) {
    console.error('Failed to update social account:', error);
    throw new Error('dbError');
  }
}

/**
 * ソーシャルアカウントを削除
 */
export async function deleteSocialAccount(userId: string, accountId: string): Promise<void> {
  try {
    const accountRef = doc(db, 'users', userId, 'socialAccounts', accountId);
    await deleteDoc(accountRef);
  } catch (error) {
    console.error('Failed to delete social account:', error);
    throw new Error('dbError');
  }
}

/**
 * アクティブアカウントを切り替え
 */
export async function switchActiveAccount(userId: string, accountId: string): Promise<void> {
  try {
    const batch = writeBatch(db);
    const accountsRef = collection(db, 'users', userId, 'socialAccounts');
    const accountsSnapshot = await getDocs(accountsRef);
    
    accountsSnapshot.docs.forEach(docSnap => {
      const ref = doc(db, 'users', userId, 'socialAccounts', docSnap.id);
      batch.update(ref, {
        isActive: docSnap.id === accountId
      });
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Failed to switch active account:', error);
    throw new Error('dbError');
  }
}

// =====================================
// 投稿管理
// =====================================

/**
 * 新しい投稿を作成
 */
export async function createSocialPost(
  userId: string,
  accountId: string,
  content: string
): Promise<SocialPost> {
  try {
    const postsRef = collection(db, 'users', userId, 'socialPosts');
    const now = new Date();

    const newPost: Omit<SocialPost, 'id'> = {
      authorId: accountId,
      authorType: 'user',
      content,
      timestamp: now,
      likes: 0,
      comments: 0,
      shares: 0,
    };

    // 元コレクションに保存
    const docRef = await addDoc(postsRef, {
      ...newPost,
      timestamp: Timestamp.fromDate(now),
    });

    // 自分のタイムラインに追加
    await addToUserTimeline(userId, docRef.id, {
      ...newPost,
      id: docRef.id,
    });

    return {
      id: docRef.id,
      ...newPost,
    };
  } catch (error) {
    console.error('Failed to create social post:', error);
    throw new Error('dbError');
  }
}

/**
 * ユーザーのタイムラインに投稿を追加
 */
export async function addToUserTimeline(
  userId: string,
  postId: string,
  post: SocialPost
): Promise<void> {
  try {
    const timelineRef = collection(db, 'users', userId, 'socialTimeline');
    await setDoc(doc(timelineRef, postId), {
      authorId: post.authorId,
      authorType: post.authorType,
      content: post.content,
      timestamp: Timestamp.fromDate(post.timestamp),
      likes: post.likes,
      comments: post.comments,
      shares: post.shares,
    });
  } catch (error) {
    console.error('Failed to add to user timeline:', error);
    throw new Error('dbError');
  }
}

/**
 * 全ユーザーのタイムラインに投稿を配信
 */
export async function distributeToAllTimelines(
  postId: string,
  post: SocialPost
): Promise<void> {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const batch = writeBatch(db);

    usersSnapshot.docs.forEach(userDoc => {
      const timelineRef = doc(db, 'users', userDoc.id, 'socialTimeline', postId);
      batch.set(timelineRef, {
        authorId: post.authorId,
        authorType: post.authorType,
        content: post.content,
        timestamp: Timestamp.fromDate(post.timestamp),
        likes: post.likes,
        comments: post.comments,
        shares: post.shares,
      });
    });

    await batch.commit();
  } catch (error) {
    console.error('Failed to distribute to all timelines:', error);
    throw new Error('dbError');
  }
}

/**
 * 全ユーザーのタイムラインから投稿を削除
 */
export async function removeFromAllTimelines(postId: string): Promise<void> {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const batch = writeBatch(db);

    usersSnapshot.docs.forEach(userDoc => {
      const timelineRef = doc(db, 'users', userDoc.id, 'socialTimeline', postId);
      batch.delete(timelineRef);
    });

    await batch.commit();
  } catch (error) {
    console.error('Failed to remove from all timelines:', error);
    throw new Error('dbError');
  }
}

/**
 * ユーザーのタイムラインを初期化（NPC投稿をコピー）
 */
export async function initializeUserTimeline(userId: string): Promise<void> {
  try {
    // 既存のタイムラインをクリア
    const timelineRef = collection(db, 'users', userId, 'socialTimeline');
    const existingSnapshot = await getDocs(timelineRef);
    const clearBatch = writeBatch(db);

    existingSnapshot.docs.forEach(doc => {
      clearBatch.delete(doc.ref);
    });

    if (existingSnapshot.docs.length > 0) {
      await clearBatch.commit();
    }

    // NPCの投稿をコピー
    const npcsSnapshot = await getDocs(
      query(collection(db, 'socialNPCs'), where('isActive', '==', true))
    );

    const batch = writeBatch(db);

    for (const npcDoc of npcsSnapshot.docs) {
      const npcPostsSnapshot = await getDocs(
        query(
          collection(db, 'socialNPCs', npcDoc.id, 'posts'),
          orderBy('timestamp', 'desc')
        )
      );

      npcPostsSnapshot.docs.forEach(postDoc => {
        const timelinePostRef = doc(timelineRef, postDoc.id);
        batch.set(timelinePostRef, postDoc.data());
      });
    }

    // ユーザーの既存投稿もコピー
    const userPostsSnapshot = await getDocs(
      query(
        collection(db, 'users', userId, 'socialPosts'),
        orderBy('timestamp', 'desc')
      )
    );

    userPostsSnapshot.docs.forEach(postDoc => {
      const timelinePostRef = doc(timelineRef, postDoc.id);
      batch.set(timelinePostRef, postDoc.data());
    });

    await batch.commit();
  } catch (error) {
    console.error('Failed to initialize user timeline:', error);
    throw new Error('dbError');
  }
}

/**
 * 統合タイムライン取得（socialTimelineコレクションから）
 */
export async function getTimeline(params: TimelineParams): Promise<PaginatedResult<SocialPost>> {
  try {
    const { userId, limit: pageLimit = SOCIAL_POSTS_PER_PAGE, cursor } = params;

    const timelineRef = collection(db, 'users', userId, 'socialTimeline');
    let timelineQuery = query(
      timelineRef,
      orderBy('timestamp', 'desc'),
      limit(pageLimit)
    );

    if (cursor) {
      const cursorDoc = await getDoc(doc(timelineRef, cursor));
      if (cursorDoc.exists()) {
        timelineQuery = query(
          timelineRef,
          orderBy('timestamp', 'desc'),
          startAfter(cursorDoc),
          limit(pageLimit)
        );
      }
    }

    const snapshot = await getDocs(timelineQuery);
    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    })) as SocialPost[];

    return {
      items: posts,
      hasMore: posts.length === pageLimit,
      lastCursor: posts.length > 0 ? posts[posts.length - 1].id : undefined,
    };
  } catch (error) {
    console.error('Failed to get unified timeline:', error);
    throw new Error('dbError');
  }
}

// =====================================
// NPC管理
// =====================================

/**
 * NPCリストを取得
 */
export async function getSocialNPCs(): Promise<SocialNPC[]> {
  try {
    const npcsRef = collection(db, 'socialNPCs');
    const npcsQuery = query(npcsRef, where('isActive', '==', true));
    const snapshot = await getDocs(npcsQuery);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as SocialNPC[];
  } catch (error) {
    console.error('Failed to get social NPCs:', error);
    throw new Error('dbError');
  }
}

/**
 * 特定のNPCを取得
 */
export async function getSocialNPC(npcId: string): Promise<SocialNPC | null> {
  try {
    const npcRef = doc(db, 'socialNPCs', npcId);
    const npcSnapshot = await getDoc(npcRef);
    
    if (!npcSnapshot.exists()) {
      return null;
    }
    
    return {
      id: npcSnapshot.id,
      ...npcSnapshot.data(),
    } as SocialNPC;
  } catch (error) {
    console.error('Failed to get social NPC:', error);
    throw new Error('dbError');
  }
}

// =====================================
// DM機能
// =====================================


/**
 * DM連絡先一覧を取得
 */
export async function getSocialContacts(userId: string): Promise<SocialContact[]> {
  try {
    const contactsRef = collection(db, 'users', userId, 'socialContacts');
    const snapshot = await getDocs(contactsRef);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as SocialContact[];
  } catch (error) {
    console.error('Failed to get social contacts:', error);
    throw new Error('dbError');
  }
}

/**
 * 新しいDM連絡先を追加
 */
export async function addSocialContact(
  userId: string,
  contact: SocialContact
): Promise<void> {
  try {
    const contactsRef = collection(db, 'users', userId, 'socialContacts');
    const contactRef = doc(contactsRef, contact.id);

    // setDocを使用してドキュメントIDを指定して作成または更新
    await setDoc(contactRef, {
      id: contact.id,
      name: contact.name,
      type: contact.type
    }, { merge: true });
  } catch (error) {
    console.error('Failed to add social contact:', error);
    throw new Error('dbError');
  }
}

/**
 * DMメッセージ履歴を取得
 */
export async function getSocialMessages(params: DMHistoryParams): Promise<PaginatedResult<SocialDMMessage>> {
  try {
    const { userId, contactId, limit: pageLimit = SOCIAL_MESSAGES_PER_PAGE, cursor } = params;
    
    const messagesRef = collection(db, 'users', userId, 'socialContacts', contactId, 'history');
    let messagesQuery = query(
      messagesRef,
      orderBy('timestamp', 'desc'),
      limit(pageLimit)
    );
    
    if (cursor) {
      const cursorDoc = await getDoc(doc(messagesRef, cursor));
      if (cursorDoc.exists()) {
        messagesQuery = query(
          messagesRef,
          orderBy('timestamp', 'desc'),
          startAfter(cursorDoc),
          limit(pageLimit)
        );
      }
    }
    
    const snapshot = await getDocs(messagesQuery);
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
}

/**
 * DMメッセージを追加
 */
export async function addSocialMessage(
  userId: string,
  contactId: string,
  message: Omit<SocialDMMessage, 'id'>
): Promise<SocialDMMessage> {
  try {
    const messagesRef = collection(db, 'users', userId, 'socialContacts', contactId, 'history');
    const docRef = await addDoc(messagesRef, {
      ...message,
      timestamp: Timestamp.fromDate(message.timestamp),
    });

    return {
      id: docRef.id,
      ...message,
    };
  } catch (error) {
    console.error('Failed to add social message:', error);
    throw new Error('dbError');
  }
}

/**
 * SocialApp用のAI応答を生成（NPCのFirestoreシステムプロンプトを使用）
 */
export async function generateSocialAIResponse(
  message: string,
  chatHistory: Content[],
  npcId: string
): Promise<string> {
  try {
    // レート制限とAPIキーチェック（簡易版）
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

    // AI モデルの設定（NPCのシステムプロンプトを使用）
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      systemInstruction: npc.systemPrompt,
    });

    // 会話履歴の最適化（最新10件まで）
    const optimizedHistory = chatHistory.slice(-10);

    // プロンプトの構築
    const promptForModel = `ユーザーからの入力: ${sanitizedInput}`;

    // AI応答の生成
    const chat = model.startChat({
      history: optimizedHistory,
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });

    // リトライロジック付きでAI応答を取得
    let aiText;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        const result = await chat.sendMessage(promptForModel);
        aiText = result.response.text();

        // レスポンスの基本検証
        if (typeof aiText === 'string' && aiText.trim().length > 0) {
          break;
        } else {
          throw new Error('Empty response');
        }
      } catch (apiError) {
        console.error(`AI API call attempt ${retryCount + 1} failed:`, apiError);
        retryCount++;
        if (retryCount >= maxRetries) {
          throw new Error('AI応答の形式が無効です');
        }
        // リトライする前に少し待機
        await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
      }
    }

    // レスポンスの型チェックとサニタイズ
    if (typeof aiText !== 'string' || aiText.trim().length === 0) {
      throw new Error('AI応答の形式が無効です');
    }

    // AI応答のサニタイズ（最大1000文字制限）
    return aiText.trim().substring(0, 1000);

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
}