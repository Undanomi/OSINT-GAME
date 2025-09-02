'use client';

import { useState, useEffect, useCallback } from 'react';
import { getMessengerContacts } from '@/actions/messengerContacts';
import { MessengerContactDocument } from '@/types/messenger';
import { useAuthContext } from '@/providers/AuthProvider';

interface MessengerContactCache {
  contacts: MessengerContactDocument[];
  lastFetched: number;
  version: string;
}

const MESSENGER_CACHE_KEY = 'messenger_contacts_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30分

/**
 * メッセンジャーアプリの連絡先をキャッシュ機能付きで管理するカスタムフック
 */
export const useMessengerContacts = () => {
  const { user } = useAuthContext();
  const [contacts, setContacts] = useState<MessengerContactDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * ローカルストレージからメッセンジャー連絡先キャッシュを取得
   */
  const getCachedMessengerContacts = useCallback((): MessengerContactCache | null => {
    try {
      const cached = localStorage.getItem(MESSENGER_CACHE_KEY);
      if (!cached) return null;

      const cacheData: MessengerContactCache = JSON.parse(cached);
      const now = Date.now();

      // キャッシュが期限切れかチェック
      if (now > cacheData.lastFetched + CACHE_DURATION) {
        localStorage.removeItem(MESSENGER_CACHE_KEY);
        return null;
      }

      return cacheData;
    } catch (error) {
      console.warn('Failed to parse cached messenger contacts:', error);
      localStorage.removeItem(MESSENGER_CACHE_KEY);
      return null;
    }
  }, []);

  /**
   * メッセンジャー連絡先をローカルストレージにキャッシュ
   */
  const cacheMessengerContacts = useCallback((contacts: MessengerContactDocument[]) => {
    try {
      const cacheData: MessengerContactCache = {
        contacts,
        lastFetched: Date.now(),
        version: '1.0' // 将来的なデータ構造変更に対応
      };

      localStorage.setItem(MESSENGER_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache messenger contacts:', error);
    }
  }, []);

  /**
   * Firestoreからメッセンジャー連絡先を取得
   */
  const fetchMessengerContacts = useCallback(async () => {
    if (!user) {
      setContacts([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const fetchedContacts = await getMessengerContacts();

      setContacts(fetchedContacts);
      cacheMessengerContacts(fetchedContacts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'メッセンジャー連絡先の取得に失敗しました';
      setError(errorMessage);
      console.error('Failed to fetch messenger contacts:', err);
    } finally {
      setLoading(false);
    }
  }, [user, cacheMessengerContacts]);

  /**
   * メッセンジャー連絡先キャッシュを強制的に更新
   */
  const refreshMessengerContacts = useCallback(async () => {
    localStorage.removeItem(MESSENGER_CACHE_KEY);
    setLoading(true);
    await fetchMessengerContacts();
  }, [fetchMessengerContacts]);

  /**
   * 初期化処理
   */
  useEffect(() => {
    if (!user) {
      setContacts([]);
      setLoading(false);
      return;
    }

    // まずキャッシュをチェック
    const cached = getCachedMessengerContacts();

    if (cached) {
      // キャッシュがある場合は即座に表示
      setContacts(cached.contacts);
      setLoading(false);

      // バックグラウンドで最新データを取得（サイレント更新）
      fetchMessengerContacts();
    } else {
      // キャッシュがない場合は Firestore から取得
      fetchMessengerContacts();
    }
  }, [user, getCachedMessengerContacts, fetchMessengerContacts]);

  return {
    contacts,
    loading,
    error,
    refreshMessengerContacts
  };
};