'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BaseApp } from '@/components/BaseApp';
import { AppProps } from '@/types/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PlusIcon, TrashIcon, SearchIcon, CloudIcon, CloudOffIcon } from 'lucide-react';
import { useAuthContext } from '@/providers/AuthProvider';
import {
  getNotesList,
  getNote,
  upsertNote,
  deleteNote,
  batchUpdateNotes
} from '@/actions/notes';
import { isEmptyNote } from '@/lib/notes/validation';
import { NOTES_LIMITS, NOTES_ERRORS } from '@/lib/notes/constants';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
}

/**
 * NotesApp - メモ管理アプリケーション
 * 
 * @description
 * 主な機能：
 * - メモの作成・編集・削除（最大${NOTES_LIMITS.MAX_NOTES_PER_USER}件）
 * - 自動保存（${NOTES_LIMITS.SAVE_DEBOUNCE_MS/1000}秒のデバウンス）
 * - キャッシュによる高速なメモ切り替え
 * - 空の新規メモの自動削除
 * - Firebaseによるクラウド同期
 */
export const NotesApp: React.FC<AppProps> = ({ isActive, windowId }) => {
  const { user } = useAuthContext();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  
  // デバウンス用のタイマー参照（自動保存の遅延実行 - ${NOTES_LIMITS.SAVE_DEBOUNCE_MS}ms）
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<Map<string, { title: string; content: string }>>(new Map());
  
  // メモの完全版をキャッシュ（サーバーアクセスを削減）
  const noteCacheRef = useRef<Map<string, Note>>(new Map());

  // 初回読み込み
  useEffect(() => {
    if (!user) {
      // ユーザーがログインしていない場合はローカルストレージから読み込み
      const savedNotes = localStorage.getItem('osint-game-notes');
      const savedStatus = localStorage.getItem('osint-game-notes-status');
      
      if (savedNotes) {
        const parsedNotes = JSON.parse(savedNotes);
        setNotes(parsedNotes.map((note: Note) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt)
        })));
      }
      
      // 同期状態を復元（オフライン時の参考情報）
      if (savedStatus) {
        const status = JSON.parse(savedStatus);
        if (status.pendingCount > 0) {
          setSyncError(`${status.pendingCount}件の未同期の変更があります`);
        }
      }
      return;
    }

    // Server Actionでメモを取得（非同期で実行）
    (async () => {
      try {
        const fetchedNotes = await getNotesList();
        setNotes(fetchedNotes);
        setSyncError(null);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching notes:', error);
        }
        setSyncError('メモの取得に失敗しました');
        // エラー時はローカルストレージから読み込み
        const savedNotes = localStorage.getItem('osint-game-notes');
        if (savedNotes) {
          const parsedNotes = JSON.parse(savedNotes);
          setNotes(parsedNotes.map((note: Note) => ({
            ...note,
            createdAt: new Date(note.createdAt),
            updatedAt: new Date(note.updatedAt)
          })));
        }
      }
    })();
  }, [user]);

  // ローカルストレージへの保存（バックアップとして）
  useEffect(() => {
    if (notes.length > 0) {
      // 同期状態も保存
      const syncStatus = {
        lastSynced: new Date().toISOString(),
        pendingCount: pendingUpdatesRef.current.size,
        isSyncing
      };
      localStorage.setItem('osint-game-notes', JSON.stringify(notes));
      localStorage.setItem('osint-game-notes-status', JSON.stringify(syncStatus));
    }
  }, [notes, isSyncing]);

  /**
   * デバウンスされた保存処理
   * 保留中の更新をFirestoreに一括保存する
   */
  const saveToServer = useCallback(async () => {
    if (!user || pendingUpdatesRef.current.size === 0) return;

    const updates = Array.from(pendingUpdatesRef.current.entries());

    // フォーカスを失わないように非同期で実行
    setIsSyncing(true);
    try {
      // 各メモを保存（空のメモはスキップ）
      for (const [id, data] of updates) {
        // 空メモはスキップ（共通関数を使用）
        if (isEmptyNote(data.title, data.content)) {
          continue;
        }
        
        // upsertNoteで新規作成と更新の両方に対応
        await upsertNote(id, data.title, data.content);
      }
      
      pendingUpdatesRef.current.clear();
      setSyncError(null);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error saving notes:', error);
      }
      setSyncError('メモの保存に失敗しました');
    } finally {
      setIsSyncing(false);
    }
  }, [user]);

  // コンポーネントのアンマウント時にタイマーをクリーンアップ
  useEffect(() => {
    // 現在のrefの値をキャプチャ
    const pendingUpdates = pendingUpdatesRef.current;
    const currentUser = user;
    
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        // アンマウント時に保留中の更新があれば保存
        if (pendingUpdates.size > 0 && currentUser) {
          const updates = Array.from(pendingUpdates.entries()).map(([id, data]) => ({
            id,
            title: data.title,
            content: data.content
          }));
          batchUpdateNotes(updates).catch(error => {
            if (process.env.NODE_ENV === 'development') {
              console.error('Batch update error:', error);
            }
          });
        }
      }
    };
  }, [user]);

  /**
   * 新規メモを作成する
   * - 最大1つの「新しいメモ」のみ存在可能
   * - 空のメモはFirestoreに保存せず、編集時に初めて保存
   */
  const handleCreateNote = () => {
    // メモ数の上限チェック
    if (notes.length >= NOTES_LIMITS.MAX_NOTES_PER_USER) {
      setSyncError(NOTES_ERRORS.MAX_NOTES_REACHED);
      return;
    }

    // 既に「新しいメモ」が存在する場合は、それを選択するだけ
    const existingNewNote = notes.find(n => n.title === '新しいメモ' && n.content === '');
    if (existingNewNote) {
      setSelectedNote(existingNewNote);
      return;
    }

    // ユニークなIDを生成（タイムスタンプ + ランダム文字列）
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 9);
    const uniqueId = `${timestamp}_${randomStr}`;

    const newNote: Note = {
      id: uniqueId,
      title: '新しいメモ',
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: undefined  // まだFirestoreに保存していないことを示すフラグ
    };

    // ローカル状態を即座に更新
    setNotes([newNote, ...notes]);
    setSelectedNote(newNote);
    setSyncError(null);
    
    // 空のメモはFirestoreに保存しない
    // 内容が入力されたら自動的にFirestoreに保存される
  };

  /**
   * メモを更新する
   * - 文字数制限を自動適用
   * - 新規メモの初回編集時にFirestore保存を開始
   * - デバウンス処理により${NOTES_LIMITS.SAVE_DEBOUNCE_MS/1000}秒後に自動保存
   */
  const handleUpdateNote = (id: string, title: string, content: string) => {

    // クライアント側でも文字数制限を適用（保険的な対策）
    const truncatedTitle = title.slice(0, NOTES_LIMITS.MAX_TITLE_LENGTH);
    const truncatedContent = content.slice(0, NOTES_LIMITS.MAX_CONTENT_LENGTH);
    
    // Reactは自動的にXSS対策をするため、ここでのサニタイゼーションは不要
    // ただし、Server Actions側で検証は必要
    const now = new Date();
    const currentNote = notes.find(n => n.id === id)!;
    
    // 新規メモが初めて編集された場合、userIdを設定（Firestore保存開始のトリガー）
    const isFirstEdit = !currentNote.userId && (truncatedTitle !== '新しいメモ' || truncatedContent !== '');
    
    const updatedNote = { 
      ...currentNote, 
      title: truncatedTitle, 
      content: truncatedContent, 
      updatedAt: now,
      userId: isFirstEdit ? user?.uid : currentNote.userId  // 初回編集時にuserIdを設定
    };
    
    // ローカル状態を即座に更新（UIの即座な反映）
    setNotes(notes.map(note => 
      note.id === id ? updatedNote : note
    ));
    
    if (selectedNote?.id === id) {
      setSelectedNote(updatedNote);
    }
    
    // キャッシュも更新
    noteCacheRef.current.set(id, updatedNote);

    // Server Actionへの保存をデバウンス処理
    if (user) {
      // 保留中の更新に追加 - 切り詰めた値を使用
      pendingUpdatesRef.current.set(id, { title: truncatedTitle, content: truncatedContent });

      // 既存のタイマーをクリア
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      // デバウンス時間後に保存（${NOTES_LIMITS.SAVE_DEBOUNCE_MS}ms後、EDoS対策）
      saveTimerRef.current = setTimeout(() => {
        saveToServer();
      }, NOTES_LIMITS.SAVE_DEBOUNCE_MS);
    }
  };

  /**
   * メモを削除する
   * - ローカル状態とキャッシュから即座に削除
   * - Firestoreからの削除は非同期で実行
   */
  const handleDeleteNote = (id: string) => {
    // ローカル状態を即座に更新
    setNotes(notes.filter(note => note.id !== id));
    if (selectedNote?.id === id) {
      setSelectedNote(null);
    }
    
    // キャッシュからも削除
    noteCacheRef.current.delete(id);

    // Server Actionで削除（非同期で実行）
    if (user) {
      (async () => {
        try {
          await deleteNote(id);
          setSyncError(null);
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Error deleting note:', error);
          }
          setSyncError('メモの削除に失敗しました');
        }
      })();
    }
  };

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const toolbar = (
    <div className="flex items-center gap-2 p-2">
      <Button
        onClick={handleCreateNote}
        size="sm"
        className="flex items-center gap-1"
      >
        <PlusIcon className="w-4 h-4" />
        新規メモ
      </Button>
      <div className="flex-1 flex items-center gap-2 max-w-sm">
        <SearchIcon className="w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder="メモを検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-8"
        />
      </div>
      <div className="flex items-center gap-1">
        {isSyncing ? (
          <CloudIcon className="w-4 h-4 text-blue-500 animate-pulse" />
        ) : user ? (
          <CloudIcon className="w-4 h-4 text-green-500" />
        ) : (
          <CloudOffIcon className="w-4 h-4 text-gray-400" />
        )}
        {syncError && (
          <span className="text-xs text-red-500">{syncError}</span>
        )}
      </div>
    </div>
  );

  const statusBar = (
    <div className="flex justify-between">
      <span>{notes.length} 件のメモ</span>
      {selectedNote && (
        <span>最終更新: {formatDate(selectedNote.updatedAt)}</span>
      )}
    </div>
  );

  return (
    <BaseApp 
      isActive={isActive} 
      windowId={windowId}
      toolbar={toolbar}
      statusBar={statusBar}
    >
      <div className="flex h-full">
        <div className="w-64 border-r border-gray-200 overflow-y-auto bg-gray-50">
          <div className="p-2">
            {filteredNotes.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                メモがありません
              </div>
            ) : (
              filteredNotes.map(note => (
                <div
                  key={note.id}
                  onClick={async () => {
                    // 現在選択中のメモが空の「新しいメモ」（まだ保存されていない）なら削除
                    if (selectedNote && !selectedNote.userId && selectedNote.title === '新しいメモ' && selectedNote.content === '') {
                      // ローカルから削除（Firestoreには保存されていないので削除不要）
                      setNotes(prev => prev.filter(n => n.id !== selectedNote.id));
                      noteCacheRef.current.delete(selectedNote.id);
                    }
                    
                    // キャッシュから取得を試みる
                    const cachedNote = noteCacheRef.current.get(note.id);
                    
                    // キャッシュにあり、更新日時が同じならキャッシュを使用
                    if (cachedNote && cachedNote.updatedAt.getTime() === note.updatedAt.getTime()) {
                      setSelectedNote(cachedNote);
                      return;
                    }
                    
                    // 新規作成したローカルメモ（userIdがない）はサーバーに存在しない
                    const isLocalOnlyNote = !note.userId;
                    if (isLocalOnlyNote) {
                      // ローカルのメモをそのまま使用（完全なデータがすでにある）
                      setSelectedNote(note);
                      noteCacheRef.current.set(note.id, note);
                      return;
                    }
                    
                    // サーバーに保存済みのメモのみサーバーから取得
                    try {
                      const fullNote = await getNote(note.id);
                      if (fullNote) {
                        setSelectedNote(fullNote);
                        // キャッシュに保存
                        noteCacheRef.current.set(note.id, fullNote);
                        // ローカルのnotesも更新
                        setNotes(prev => prev.map(n => n.id === fullNote.id ? fullNote : n));
                      }
                    } catch {
                      // エラー時はリスト版を使用
                      setSelectedNote(note);
                    }
                  }}
                  className={`p-3 mb-2 rounded cursor-pointer transition-colors ${
                    selectedNote?.id === note.id
                      ? 'bg-blue-100 border-blue-300 border'
                      : 'bg-white hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <div className="font-medium text-sm truncate">
                    {note.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 truncate">
                    {note.content || '内容なし'}
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    {formatDate(note.updatedAt)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {selectedNote ? (
            <>
              <div className="flex items-center justify-between p-3 border-b border-gray-200">
                <div className="flex-1 mr-2">
                  <Input
                    type="text"
                    value={selectedNote.title}
                    onChange={(e) => handleUpdateNote(selectedNote.id, e.target.value, selectedNote.content)}
                    className="text-lg font-semibold w-full"
                    maxLength={NOTES_LIMITS.MAX_TITLE_LENGTH}
                  />
                  <div className="text-xs text-gray-400 mt-1 text-right">
                    {selectedNote.title.length} / {NOTES_LIMITS.MAX_TITLE_LENGTH} 文字
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleDeleteNote(selectedNote.id)}
                    size="sm"
                    variant="destructive"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 p-3 overflow-auto flex flex-col">
                <Textarea
                  value={selectedNote.content}
                  onChange={(e) => handleUpdateNote(selectedNote.id, selectedNote.title, e.target.value)}
                  className="w-full flex-1 resize-none border-none focus:ring-0 whitespace-pre-wrap break-words"
                  placeholder="メモを入力..."
                  maxLength={NOTES_LIMITS.MAX_CONTENT_LENGTH}
                  style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                />
                <div className="text-xs text-gray-400 mt-2 text-right">
                  {selectedNote.content.length} / {NOTES_LIMITS.MAX_CONTENT_LENGTH} 文字
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-lg mb-2">メモを選択してください</div>
                <div className="text-sm">左のリストからメモを選択するか、新規メモを作成してください</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </BaseApp>
  );
};