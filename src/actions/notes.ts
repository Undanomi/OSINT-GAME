'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { NOTES_LIMITS, PATTERNS } from '@/lib/notes/constants';
import { getAuthenticatedUserId } from '@/lib/auth/server';
import { validateNoteId, validateTitle, validateContent } from '@/lib/notes/validation';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
}

/**
 * メモ一覧を取得する
 * 
 * @description
 * 認証済みユーザーのメモ一覧を最新順で取得します。
 * 最大件数はNOTES_LIMITS.MAX_NOTES_PER_USER（${NOTES_LIMITS.MAX_NOTES_PER_USER}件）に制限されています。
 * 
 * @returns {Promise<Note[]>} メモの配列（全文を含む）
 * @throws {Error} 認証エラーまたは取得エラー
 */
export async function getNotesList(): Promise<Note[]> {
  try {
    // 認証済みユーザーIDを取得
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      throw new Error('認証が必要です');
    }

    const notesRef = collection(db, 'users', userId, 'notes');
    // 最新のメモを取得（メモの上限まで）
    const q = query(
      notesRef, 
      orderBy('updatedAt', 'desc'),
      limit(NOTES_LIMITS.MAX_NOTES_PER_USER)
    );
    const snapshot = await getDocs(q);

    const notes: Note[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      notes.push({
        id: doc.id,
        title: data.title || '',
        content: data.content || '',
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        userId: data.userId
      });
    });

    return notes;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching notes:', error);
    }
    throw new Error('メモの取得に失敗しました');
  }
}

// メモ一覧を取得（全データ版）
export async function getAllNotes(): Promise<Note[]> {
  try {
    // 認証済みユーザーIDを取得
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      throw new Error('認証が必要です');
    }

    const notesRef = collection(db, 'users', userId, 'notes');
    const q = query(notesRef, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);

    const notes: Note[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      notes.push({
        id: doc.id,
        title: data.title || '',
        content: data.content || '',
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        userId: data.userId
      });
    });

    return notes;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching notes:', error);
    }
    throw new Error('メモの取得に失敗しました');
  }
}

/**
 * メモを作成または更新する（Upsert操作）
 * 
 * @description
 * 指定されたIDのメモが存在する場合は更新、存在しない場合は新規作成します。
 * タイトルと内容は文字数制限を超えた場合、自動的に切り詰められます。
 * 
 * @param {string} noteId - メモのID（タイムスタンプ_ランダム文字列形式）
 * @param {string} title - メモのタイトル（最大${NOTES_LIMITS.MAX_TITLE_LENGTH}文字、超過時は自動切り詰め）
 * @param {string} content - メモの内容（最大${NOTES_LIMITS.MAX_CONTENT_LENGTH}文字、超過時は自動切り詰め）
 * @returns {Promise<Note>} 保存されたメモオブジェクト
 * @throws {Error} 認証エラー、バリデーションエラー、または保存エラー
 */
export async function upsertNote(
  noteId: string,
  title: string,
  content: string
): Promise<Note> {
  try {
    // 認証済みユーザーIDを取得
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      throw new Error('認証が必要です');
    }
    
    // バリデーション
    const idValidation = validateNoteId(noteId);
    if (!idValidation.valid) throw new Error(idValidation.error);
    
    // タイトルとコンテンツは自動的に切り詰める
    const titleValidation = validateTitle(title);
    const finalTitle = titleValidation.truncated || title;
    
    const contentValidation = validateContent(content);
    const finalContent = contentValidation.truncated || content;

    const now = new Date();
    const noteRef = doc(db, 'users', userId, 'notes', noteId);
    
    // 1回のsetDocで全フィールドを設定（パフォーマンス改善）
    await setDoc(noteRef, {
      title: finalTitle,    // 切り詰めた値を使用
      content: finalContent, // 切り詰めた値を使用
      createdAt: Timestamp.fromDate(now),  // merge: trueなので既存の場合は無視される
      updatedAt: Timestamp.fromDate(now),
      userId
    }, { merge: true });

    return {
      id: noteId,
      title: finalTitle,    // 切り詰めた値を返す
      content: finalContent, // 切り詰めた値を返す
      createdAt: now,
      updatedAt: now,
      userId
    };
  } catch (error) {
    // 開発環境のみ詳細ログ
    if (process.env.NODE_ENV === 'development') {
      console.error('Error upserting note:', error);
    }
    throw new Error('メモの保存に失敗しました');
  }
}

// メモを更新
export async function updateNote(
  noteId: string,
  title: string,
  content: string
): Promise<void> {
  try {
    // 認証済みユーザーIDを取得
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      throw new Error('認証が必要です');
    }
    
    // サーバー側での文字数制限検証
    if (title.length > NOTES_LIMITS.MAX_TITLE_LENGTH) {
      throw new Error(`タイトルが長すぎます（最大${NOTES_LIMITS.MAX_TITLE_LENGTH}文字）`);
    }
    if (content.length > NOTES_LIMITS.MAX_CONTENT_LENGTH) {
      throw new Error(`内容が長すぎます（最大${NOTES_LIMITS.MAX_CONTENT_LENGTH}文字）`);
    }
    
    // noteIdの検証
    if (!noteId || !PATTERNS.NOTE_ID.test(noteId)) {
      throw new Error('不正なメモIDです');
    }
    if (noteId.length > NOTES_LIMITS.NOTE_ID_MAX_LENGTH) {
      throw new Error('メモIDが長すぎます');
    }

    const noteRef = doc(db, 'users', userId, 'notes', noteId);
    await setDoc(
      noteRef,
      {
        title,
        content,
        updatedAt: Timestamp.fromDate(new Date()),
        userId
      },
      { merge: true }
    );
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error updating note:', error);
    }
    throw new Error('メモの更新に失敗しました');
  }
}

/**
 * 単一メモの詳細を取得する
 * 
 * @description
 * 指定されたIDのメモの完全な内容を取得します。
 * メモが存在しない場合はnullを返します。
 * 
 * @param {string} noteId - 取得するメモのID
 * @returns {Promise<Note | null>} メモオブジェクトまたはnull
 * @throws {Error} 認証エラーまたは取得エラー
 */
export async function getNote(noteId: string): Promise<Note | null> {
  try {
    // 認証済みユーザーIDを取得
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      throw new Error('認証が必要です');
    }
    
    // noteIdの検証
    if (!noteId || !/^[a-zA-Z0-9_-]+$/.test(noteId)) {
      throw new Error('不正なメモIDです');
    }
    
    const noteRef = doc(db, 'users', userId, 'notes', noteId);
    const noteDoc = await getDoc(noteRef);
    
    if (!noteDoc.exists()) {
      return null;
    }
    
    const data = noteDoc.data();
    return {
      id: noteDoc.id,
      title: data.title || '',
      content: data.content || '',  // 完全なcontent
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      userId: data.userId
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching note detail:', error);
    }
    throw new Error('メモの詳細取得に失敗しました');
  }
}

/**
 * メモを削除する
 * 
 * @description
 * 指定されたIDのメモをFirestoreから完全に削除します。
 * 削除は元に戻せません。
 * 
 * @param {string} noteId - 削除するメモのID
 * @returns {Promise<void>} なし
 * @throws {Error} 認証エラー、バリデーションエラー、または削除エラー
 */
export async function deleteNote(
  noteId: string
): Promise<void> {
  try {
    // 認証済みユーザーIDを取得
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      throw new Error('認証が必要です');
    }
    
    // noteIdの検証
    if (!noteId || !PATTERNS.NOTE_ID.test(noteId)) {
      throw new Error('不正なメモIDです');
    }
    if (noteId.length > NOTES_LIMITS.NOTE_ID_MAX_LENGTH) {
      throw new Error('メモIDが長すぎます');
    }

    const noteRef = doc(db, 'users', userId, 'notes', noteId);
    await deleteDoc(noteRef);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error deleting note:', error);
    }
    throw new Error('メモの削除に失敗しました');
  }
}

// バッチ更新（デバウンス処理用）
export async function batchUpdateNotes(
  updates: Array<{ id: string; title: string; content: string }>
): Promise<void> {
  try {
    // 認証済みユーザーIDを取得
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      throw new Error('認証が必要です');
    }
    
    // バッチサイズの制限
    if (updates.length > NOTES_LIMITS.MAX_BATCH_ITEMS) {
      throw new Error(`一度に更新できるメモは${NOTES_LIMITS.MAX_BATCH_ITEMS}件までです`);
    }

    const updatePromises = updates.map(async (update) => {
      // 各更新の検証
      if (!update.id || !/^[a-zA-Z0-9_-]+$/.test(update.id)) {
        throw new Error('不正なメモIDが含まれています');
      }
      if (update.id.length > NOTES_LIMITS.NOTE_ID_MAX_LENGTH) {
        throw new Error('メモIDが長すぎます');
      }
      if (update.title.length > NOTES_LIMITS.MAX_TITLE_LENGTH) {
        throw new Error(`タイトルが長すぎます（最大${NOTES_LIMITS.MAX_TITLE_LENGTH}文字）`);
      }
      if (update.content.length > NOTES_LIMITS.MAX_CONTENT_LENGTH) {
        throw new Error(`内容が長すぎます（最大${NOTES_LIMITS.MAX_CONTENT_LENGTH}文字）`);
      }
      
      const noteRef = doc(db, 'users', userId, 'notes', update.id);
      return setDoc(
        noteRef,
        {
          title: update.title,
          content: update.content,
          updatedAt: Timestamp.fromDate(new Date()),
          userId
        },
        { merge: true }
      );
    });

    // Promise.allSettledで個別エラーを処理
    const results = await Promise.allSettled(updatePromises);
    
    // 失敗した更新を記録
    const failures = results
      .map((result, index) => ({ result, update: updates[index] }))
      .filter(({ result }) => result.status === 'rejected');
    
    if (failures.length > 0) {
      console.error('Some updates failed:', failures);
      // 部分的な失敗でも成功した分は保存されている
      if (failures.length === updates.length) {
        throw new Error('すべてのメモの更新に失敗しました');
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error batch updating notes:', error);
    }
    throw new Error('メモの一括更新に失敗しました');
  }
}