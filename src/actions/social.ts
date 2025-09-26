'use server';

import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  startAfter,
  writeBatch,
  Timestamp,
  documentId
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAuthenticatedUserId } from '@/lib/auth/server';
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
  SocialAIResponse
} from '@/types/social';
import {
  SOCIAL_POSTS_PER_PAGE,
  SOCIAL_MESSAGES_PER_PAGE
} from '@/lib/social/constants';
import { GoogleGenerativeAI, Content } from '@google/generative-ai';

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
// ユーティリティ関数
// =====================================

/**
 * タイムスタンプベースのドキュメントIDを生成
 */
function generateTimestampId(timestamp: Date): string {
  const timeString = timestamp.toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${timeString}_${randomSuffix}`;
}

/**
 * タイムスタンプからドキュメントID範囲を生成
 */
function getDocumentIdRange(startTimestamp: Date, endTimestamp: Date) {
  const startId = startTimestamp.toISOString().replace(/[-:T]/g, '').slice(0, 14) + '_';
  const endId = endTimestamp.toISOString().replace(/[-:T]/g, '').slice(0, 14) + '_\uf8ff';
  return { startId, endId };
}

/**
 * タイムラインメタデータを取得
 */
async function getTimelineMetadata(userId: string) {
  try {
    const metadataRef = doc(db, 'users', userId, 'socialTimelineMetadata', 'sync');
    const metadataDoc = await getDoc(metadataRef);

    if (!metadataDoc.exists()) {
      return null;
    }

    const data = metadataDoc.data();
    return {
      lastSyncedNPCTimestamp: data.lastSyncedNPCTimestamp?.toDate() || null,
      lastSyncedAt: data.lastSyncedAt?.toDate() || null,
      totalNPCPostsSynced: data.totalNPCPostsSynced || 0
    };
  } catch (error) {
    console.error('Failed to get timeline metadata:', error);
    return null;
  }
}

/**
 * タイムラインメタデータを更新
 */
async function updateTimelineMetadata(
  userId: string,
  lastSyncedNPCTimestamp: Date,
  additionalPostsCount: number
) {
  try {
    const metadataRef = doc(db, 'users', userId, 'socialTimelineMetadata', 'sync');
    await setDoc(metadataRef, {
      lastSyncedNPCTimestamp: Timestamp.fromDate(lastSyncedNPCTimestamp),
      lastSyncedAt: Timestamp.fromDate(new Date()),
      totalNPCPostsSynced: additionalPostsCount
    }, { merge: true });
  } catch (error) {
    console.error('Failed to update timeline metadata:', error);
  }
}

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
}


// =====================================
// アカウント管理
// =====================================

/**
 * ユーザーのソーシャルアカウント一覧を取得（認証必須）
 */
export async function getSocialAccounts(): Promise<SocialAccount[]> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    throw new Error('認証が必要です');
  }

  try {
    const accountsRef = collection(db, 'users', userId, 'socialAccounts');
    const accountsQuery = query(accountsRef, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(accountsQuery);

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
}

/**
 * 新しいソーシャルアカウントを作成
 */
export async function createSocialAccount(
  accountData: SocialAccount
): Promise<SocialAccount> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    throw new Error('認証が必要です');
  }

  try {
    // アカウントIDの検証
    if (!accountData.id || accountData.id.trim() === '') {
      throw new Error('アカウントIDが無効です');
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
    throw new Error('dbError');
  }
}

/**
 * ソーシャルアカウントを更新
 */
/**
 * account_idの重複チェック（認証済みユーザーのアカウントとNPCを対象）
 */
async function checkAccountIdDuplicate(
  accountId: string,
  excludeStableId: string
): Promise<boolean> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      throw new Error('authError');
    }

    // 1. NPCのaccount_idをチェック
    const npcsRef = collection(db, 'socialNPCs');
    const npcQuery = query(npcsRef, where('account_id', '==', accountId));
    const npcSnapshot = await getDocs(npcQuery);

    if (!npcSnapshot.empty) {
      return true; // NPC側で重複
    }

    // 2. 認証済みユーザーのアカウントをチェック
    const socialAccountsRef = collection(db, 'users', userId, 'socialAccounts');
    const accountQuery = query(socialAccountsRef, where('account_id', '==', accountId));
    const accountSnapshot = await getDocs(accountQuery);

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

export async function updateSocialAccount(
  accountId: string,
  updates: Partial<SocialAccount>
): Promise<void> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    throw new Error('認証が必要です');
  }

  try {
    // account_idが変更される場合は重複チェック
    if (updates.account_id) {
      const isDuplicate = await checkAccountIdDuplicate(updates.account_id, accountId);
      if (isDuplicate) {
        throw new Error('accountDuplicate');
      }
    }

    const accountRef = doc(db, 'users', userId, 'socialAccounts', accountId);
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };

    await updateDoc(accountRef, updateData);
  } catch (error) {
    if (error instanceof Error && error.message === 'accountDuplicate') {
      throw error;
    }
    console.error('Failed to update social account:', error);
    throw new Error('dbError');
  }
}

/**
 * ソーシャルアカウントを削除
 */
export async function deleteSocialAccount(accountId: string): Promise<void> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    throw new Error('認証が必要です');
  }

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
export async function switchActiveAccount(accountId: string): Promise<void> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    throw new Error('認証が必要です');
  }

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
 * 新しい投稿を作成（認証必須）
 */
export async function createSocialPost(
  stableId: string,
  content: string
): Promise<SocialPost> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    throw new Error('認証が必要です');
  }

  // 入力値の検証
  if (!content || content.trim().length === 0) {
    throw new Error('投稿内容を入力してください');
  }
  if (content.length > 500) {
    throw new Error('投稿は500文字以内で入力してください');
  }
  try {
    const postsRef = collection(db, 'users', userId, 'socialAccounts', stableId, 'posts');
    const now = new Date();
    const timestampId = generateTimestampId(now);

    const newPost: Omit<SocialPost, 'id'> = {
      authorId: stableId, // stable_idを使用
      authorType: 'user',
      content: content.trim(), // XSS対策：トリム処理
      timestamp: now,
      likes: 0,
      comments: 0,
      shares: 0,
      createdAt: now,
      updatedAt: now,
    };

    // アカウント別投稿コレクションに保存（タイムスタンプベースID使用）
    const docRef = doc(postsRef, timestampId);
    await setDoc(docRef, {
      ...newPost,
      timestamp: Timestamp.fromDate(now),
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    });

    // 自分のタイムラインに追加
    await addToUserTimeline(userId, timestampId, {
      ...newPost,
      id: timestampId,
    });

    return {
      id: timestampId,
      ...newPost,
    };
  } catch (error) {
    console.error('Failed to create social post:', error);
    throw new Error('dbError');
  }
}

/**
 * ユーザーアカウントの投稿一覧を取得（ページング対応）
 */
export async function getUserAccountPosts(
  accountId: string,
  pageLimit: number = SOCIAL_POSTS_PER_PAGE,
  cursor?: string
): Promise<PaginatedResult<SocialPost>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    throw new Error('認証が必要です');
  }

  try {
    const postsRef = collection(db, 'users', userId, 'socialAccounts', accountId, 'posts');
    let postsQuery = query(
      postsRef,
      orderBy('timestamp', 'desc'),
      firestoreLimit(pageLimit)
    );

    if (cursor) {
      const cursorDoc = await getDoc(doc(postsRef, cursor));
      if (cursorDoc.exists()) {
        postsQuery = query(
          postsRef,
          orderBy('timestamp', 'desc'),
          startAfter(cursorDoc),
          firestoreLimit(pageLimit)
        );
      }
    }

    const snapshot = await getDocs(postsQuery);
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
      hasMore: posts.length === pageLimit && posts.length > 0,
      lastCursor: posts.length > 0 ? posts[posts.length - 1].id : undefined,
    };
  } catch (error) {
    console.error('Failed to get user account posts:', error);
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
      createdAt: Timestamp.fromDate(post.createdAt),
      updatedAt: Timestamp.fromDate(post.updatedAt),
    });
  } catch (error) {
    console.error('Failed to add to user timeline:', error);
    throw new Error('dbError');
  }
}

/**
 * NPC投稿をsocialNPCPostsコレクションに保存
 */
export async function saveNPCPostToCentralCollection(
  postId: string,
  post: SocialPost
): Promise<void> {
  try {
    if (post.authorType !== 'npc') {
      return; // NPCの投稿でない場合は何もしない
    }

    const centralPostRef = doc(db, 'socialNPCPosts', postId);
    await setDoc(centralPostRef, {
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

    // NPC投稿の場合は中央コレクションにも保存
    await saveNPCPostToCentralCollection(postId, post);
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
 * 効率的なNPC投稿検索（タイムスタンプベースID使用）
 */
async function searchNPCPostsEfficiently(
  beforeTimestamp: Date,
  afterTimestamp: Date | null,
  limit: number
): Promise<SocialPost[]> {
  try {
    const npcPostsRef = collection(db, 'socialNPCPosts');

    if (afterTimestamp) {
      // 範囲指定での効率的な検索
      const { startId, endId } = getDocumentIdRange(afterTimestamp, beforeTimestamp);

      const efficientQuery = query(
        npcPostsRef,
        where(documentId(), '>=', startId),
        where(documentId(), '<', endId),
        orderBy(documentId(), 'desc'),
        firestoreLimit(limit)
      );

      const snapshot = await getDocs(efficientQuery);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
        };
      }) as SocialPost[];
    } else {
      // 単一タイムスタンプ以前の検索
      const beforeId = beforeTimestamp.toISOString().replace(/[-:T]/g, '').slice(0, 14) + '_\uf8ff';

      const fallbackQuery = query(
        npcPostsRef,
        where(documentId(), '<', beforeId),
        orderBy(documentId(), 'desc'),
        firestoreLimit(limit)
      );

      const snapshot = await getDocs(fallbackQuery);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
        };
      }) as SocialPost[];
    }
  } catch (error) {
    console.error('Failed to search NPC posts efficiently:', error);
    return [];
  }
}

/**
 * 統合タイムライン取得（3層構造: socialStore → users/{user_id}/socialTimeline → socialNPCPosts）
 */
export async function getTimeline(params: TimelineParams): Promise<PaginatedResult<SocialPost>> {
  try {
    const { userId, limit: pageLimit = SOCIAL_POSTS_PER_PAGE, cursor } = params;

    // 1. まずユーザーのsocialTimelineから取得
    const timelineRef = collection(db, 'users', userId, 'socialTimeline');
    let timelineQuery = query(
      timelineRef,
      orderBy('timestamp', 'desc'),
      firestoreLimit(pageLimit)
    );

    if (cursor) {
      const cursorDoc = await getDoc(doc(timelineRef, cursor));
      if (cursorDoc.exists()) {
        timelineQuery = query(
          timelineRef,
          orderBy('timestamp', 'desc'),
          startAfter(cursorDoc),
          firestoreLimit(pageLimit)
        );
      }
    }

    const timelineSnapshot = await getDocs(timelineQuery);
    const timelinePosts = timelineSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      };
    }) as SocialPost[];

    // 2. 不足分をsocialNPCPostsから効率的に補完
    let allPosts = timelinePosts;
    if (timelinePosts.length < pageLimit) {
      const remainingLimit = pageLimit - timelinePosts.length;
      const lastTimestamp = timelinePosts.length > 0
        ? timelinePosts[timelinePosts.length - 1].timestamp
        : new Date();

      // メタデータを取得して効率的な検索範囲を決定
      const metadata = await getTimelineMetadata(userId);
      const afterTimestamp = metadata?.lastSyncedNPCTimestamp || null;

      // 効率的なNPC投稿検索
      const npcPosts = await searchNPCPostsEfficiently(
        lastTimestamp,
        afterTimestamp,
        remainingLimit
      );

      if (npcPosts.length > 0) {
        // 新しいNPC投稿をユーザーのタイムラインに追加
        const batch = writeBatch(db);
        const timelineRef = collection(db, 'users', userId, 'socialTimeline');

        for (const post of npcPosts) {
          const postRef = doc(timelineRef, post.id);
          batch.set(postRef, {
            ...post,
            timestamp: Timestamp.fromDate(post.timestamp),
            createdAt: Timestamp.fromDate(post.createdAt),
            updatedAt: Timestamp.fromDate(post.updatedAt),
          });
        }

        await batch.commit();

        // メタデータを更新
        const newLastSyncedTimestamp = npcPosts[npcPosts.length - 1].timestamp;
        await updateTimelineMetadata(
          userId,
          newLastSyncedTimestamp,
          (metadata?.totalNPCPostsSynced || 0) + npcPosts.length
        );
      }

      // 重複を除去してからタイムスタンプでソート
      const combinedPosts = [...timelinePosts, ...npcPosts];
      const uniquePosts = combinedPosts.filter((post, index, self) =>
        index === self.findIndex(p => p.id === post.id)
      );
      allPosts = uniquePosts.sort((a, b) =>
        b.timestamp.getTime() - a.timestamp.getTime()
      );
    }

    return {
      items: allPosts.slice(0, pageLimit),
      hasMore: allPosts.length === pageLimit,
      lastCursor: allPosts.length > 0 ? allPosts[allPosts.length - 1].id : undefined,
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

    const data = npcSnapshot.data();
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
}

/**
 * NPCプロフィールの投稿一覧を取得（ページング対応）
 */
export async function getNPCPosts(
  npcId: string,
  pageLimit: number = SOCIAL_POSTS_PER_PAGE,
  cursor?: string
): Promise<PaginatedResult<SocialPost>> {
  try {
    const postsRef = collection(db, 'socialNPCs', npcId, 'posts');
    let postsQuery = query(
      postsRef,
      orderBy('timestamp', 'desc'),
      firestoreLimit(pageLimit)
    );

    if (cursor) {
      const cursorDoc = await getDoc(doc(postsRef, cursor));
      if (cursorDoc.exists()) {
        postsQuery = query(
          postsRef,
          orderBy('timestamp', 'desc'),
          startAfter(cursorDoc),
          firestoreLimit(pageLimit)
        );
      }
    }

    const snapshot = await getDocs(postsQuery);
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
    console.error('Failed to get NPC posts:', error);
    throw new Error('dbError');
  }
}

// =====================================
// DM機能
// =====================================


/**
 * DM連絡先一覧を取得（アカウントごと）
 */
export async function getSocialContacts(accountId: string): Promise<SocialContact[]> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    throw new Error('認証が必要です');
  }

  try {
    const contactsRef = collection(db, 'users', userId, 'socialAccounts', accountId, 'Contacts');
    const snapshot = await getDocs(contactsRef);

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
}

/**
 * 新しいDM連絡先を追加
 */
export async function addSocialContact(
  accountId: string,
  contact: SocialContact
): Promise<void> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    throw new Error('認証が必要です');
  }

  try {
    const contactsRef = collection(db, 'users', userId, 'socialAccounts', accountId, 'Contacts');
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
 * DMメッセージ履歴を取得（時間ベースID活用）
 */
export async function getSocialMessages(params: Omit<DMHistoryParams, 'userId'>): Promise<PaginatedResult<SocialDMMessage>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    throw new Error('認証が必要です');
  }

  try {
    const { accountId, contactId, limit: pageLimit = SOCIAL_MESSAGES_PER_PAGE, cursor } = params;

    const messagesRef = collection(db, 'users', userId, 'socialAccounts', accountId, 'Contacts', contactId, 'history');

    // タイムスタンプフィールドでソート（インデックス自動作成）
    let messagesQuery = query(
      messagesRef,
      orderBy('timestamp', 'desc'),
      firestoreLimit(pageLimit)
    );

    if (cursor) {
      // カーソルドキュメントより古いメッセージを取得
      const cursorDocRef = doc(messagesRef, cursor);
      const cursorDoc = await getDoc(cursorDocRef);

      if (cursorDoc.exists()) {
        messagesQuery = query(
          messagesRef,
          orderBy('timestamp', 'desc'),
          startAfter(cursorDoc),
          firestoreLimit(pageLimit)
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
  accountId: string,
  contactId: string,
  message: SocialDMMessage
): Promise<SocialDMMessage> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    throw new Error('認証が必要です');
  }

  try {
    const messagesRef = collection(db, 'users', userId, 'socialAccounts', accountId, 'Contacts', contactId, 'history');
    const messageRef = doc(messagesRef, message.id);
    await setDoc(messageRef, {
      sender: message.sender,
      text: message.text,
      timestamp: Timestamp.fromDate(message.timestamp),
    });

    return message;
  } catch (error) {
    console.error('Failed to add social message:', error);
    throw new Error('dbError');
  }
}


/**
 * 関係性情報を取得
 */
export async function getSocialRelationship(
  accountId: string,
  contactId: string
): Promise<SocialRelationship | null> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    throw new Error('認証が必要です');
  }

  try {
    const relationshipRef = doc(db, 'users', userId, 'socialAccounts', accountId, 'Relationships', contactId);
    const relationshipDoc = await getDoc(relationshipRef);

    if (!relationshipDoc.exists()) {
      return null;
    }

    const data = relationshipDoc.data();
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
}

/**
 * 関係性情報を更新または作成
 */
export async function updateSocialRelationship(
  accountId: string,
  contactId: string,
  trust: number,
  caution: number
): Promise<void> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    throw new Error('認証が必要です');
  }

  try {
    const relationshipRef = doc(db, 'users', userId, 'socialAccounts', accountId, 'Relationships', contactId);

    await setDoc(relationshipRef, {
      trust: Math.max(0, Math.min(100, trust)), // 0-100の範囲に制限
      caution: Math.max(0, Math.min(100, caution)), // 0-100の範囲に制限
      lastInteractionAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    }, { merge: true });
  } catch (error) {
    console.error('Failed to update social relationship:', error);
    throw new Error('dbError');
  }
}

/**
 * SocialApp用のAI応答を生成（プロフィール情報と信頼度・警戒度を含む）
 */
export async function generateSocialAIResponse(
  params: SocialAIRequestParams
): Promise<SocialAIResponse> {
  const { message, chatHistory, npcId, userProfile, accountId } = params;

  // バックエンドで現在の関係性を取得
  const relationship = await getSocialRelationship(accountId, npcId);
  const currentTrust = relationship?.trust || 30;
  const currentCaution = relationship?.caution || 70;
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

    // 動的プロンプトの構築
    const dynamicPrompt = `

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
`;

    // Google Generative AI インスタンス
    const genAI = new GoogleGenerativeAI(apiKey);

    // AI モデルの設定（拡張されたシステムプロンプトを使用）
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      systemInstruction: npc.systemPrompt + dynamicPrompt,
    });

    // 会話履歴の最適化（最新10件まで）
    const optimizedHistory = chatHistory.slice(-10);

    // プロンプトの構築（信頼度・警戒度の現在値を含む）
    const promptForModel = `[現在の状態] 信頼度: ${currentTrust}, 警戒度: ${currentCaution}\n[プレイヤーの入力] ${sanitizedInput}`;

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
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        const result = await chat.sendMessage(promptForModel);
        const responseText = result.response.text();

        const parsedResponse = JSON.parse(responseText.trim());

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
        if (retryCount >= maxRetries) {
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
}

/**
 * 旧バージョンとの互換性のためのラッパー関数
 */
export async function generateSocialAIResponseLegacy(
  message: string,
  chatHistory: Content[],
  npcId: string
): Promise<string> {
  // デフォルトのプロフィールと関係性を使用
  const defaultProfile: SocialAccount = {
    id: 'unknown',
    account_id: 'unknown_user',
    name: '不明なユーザー',
    avatar: '🤔',
    bio: '',
    location: '',
    isActive: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    followersCount: 0,
    followingCount: 0,
    canDM: true
  };

  const params: SocialAIRequestParams = {
    message,
    chatHistory,
    npcId,
    userProfile: defaultProfile,
    accountId: 'unknown'
  };

  const response = await generateSocialAIResponse(params);
  return response.responseText;
}