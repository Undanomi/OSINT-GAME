'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuthContext } from '@/providers/AuthProvider';
import { getContacts, getMessages } from '@/actions/messenger';
import { MessengerContact, UIMessage, convertFirestoreToUIMessage } from '@/types/messenger';

const CACHE_PREFIX = 'messenger_cache_';
const CACHE_EXPIRATION = 60 * 60 * 1000 * 24; // キャッシュの有効期限: 1時間
const CACHE_FRESHNESS_THRESHOLD = 5 * 60 * 1000; // キャッシュの鮮度閾値: 5分


// キャッシュデータの型定義
interface CachedMessages {
  messages: UIMessage[];
  hasMore: boolean;
  timestamp: number;
}

/**
 * localStorageからキャッシュされたメッセージを取得するヘルパー関数
 */
const getCachedData = (userId: string, contactId: string): CachedMessages | null => {
  try {
    const key = `${CACHE_PREFIX}${userId}_${contactId}`;
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const data: CachedMessages = JSON.parse(cached);
    // 有効期限切れをチェック
    if (Date.now() > data.timestamp + CACHE_EXPIRATION) {
      localStorage.removeItem(key);
      return null;
    }
    // timestampを文字列からDateオブジェクトに復元
    data.messages = data.messages.map(msg => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }));
    return data;
  } catch {
    return null;
  }
};

/**
 * localStorageにメッセージをキャッシュするヘルパー関数
 */
const setCachedData = (userId: string, contactId: string, messages: UIMessage[], hasMore: boolean) => {
  try {
    const key = `${CACHE_PREFIX}${userId}_${contactId}`;
    const data: CachedMessages = { messages, hasMore, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to cache messages:', error);
  }
};


export const useMessenger = () => {
  const { user } = useAuthContext();

  const [contacts, setContacts] = useState<MessengerContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);

  const [selectedContact, setSelectedContact] = useState<MessengerContact | null>(null);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadContacts = useCallback(async () => {
    if (!user) return;
    try {
      setContactsLoading(true);
      const fetchedContacts = await getContacts();
      setContacts(fetchedContacts);
      if (!selectedContact && fetchedContacts.length > 0) {
        setSelectedContact(fetchedContacts[0]);
      }
    } catch (error) {
      console.error('Failed to load contacts', error);
    } finally {
      setContactsLoading(false);
    }
  }, [user, selectedContact]);

  const loadInitialMessages = useCallback(async (contactId: string) => {
    if (!user || !contactId) return;

    setMessagesLoading(true);

    // 1. localStorageからキャッシュを読み込む
    const cached = getCachedData(user.uid, contactId);

    // 2. キャッシュが「新鮮」であれば、それを表示して処理を終了
    if (cached && Date.now() < cached.timestamp + CACHE_FRESHNESS_THRESHOLD) {
      setMessages(cached.messages);
      setHasMore(cached.hasMore);
      setMessagesLoading(false);
      return; // サーバーにアクセスせずここで終了！
    }

    // 3. キャッシュが古いか存在しない場合のみ、サーバーにアクセス
    if (cached) {
      setMessages(cached.messages); // 古いキャッシュを一旦表示
      setHasMore(cached.hasMore);
    } else {
      setMessages([]);
      setHasMore(true);
    }

    try {
      const { messages: newMessages, hasMore: newHasMore } = await getMessages(contactId);
      const uiMessages = newMessages.map(convertFirestoreToUIMessage);

      setMessages(uiMessages);
      setHasMore(newHasMore);
      setCachedData(user.uid, contactId, uiMessages, newHasMore);
    } catch (error) {
      console.error('Failed to load messages', error);
      if (!cached) setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, [user]);

  const loadMoreMessages = useCallback(async () => {
    if (!user || !selectedContact || messages.length === 0 || !hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    const oldestMessage = messages[0];

    try {
      const timestampISO = oldestMessage.timestamp instanceof Date 
        ? oldestMessage.timestamp.toISOString()
        : new Date(oldestMessage.timestamp).toISOString();
        
      const { messages: newMessages, hasMore: newHasMore } = await getMessages(
        selectedContact.id,
        timestampISO
      );
      if (newMessages.length > 0) {
        const uiMessages = newMessages.map(convertFirestoreToUIMessage);
        setMessages(prev => {
          const updatedMessages = [...uiMessages, ...prev];
          // キャッシュも更新
          setCachedData(user.uid, selectedContact.id, updatedMessages, newHasMore);
          return updatedMessages;
        });
      }
      setHasMore(newHasMore);
    } catch (error) {
      console.error('Failed to load more messages', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [user, selectedContact, messages, hasMore, isLoadingMore]);

  const addMessageToState = useCallback((message: UIMessage) => {
    if(!user || !selectedContact) return;

    setMessages(prev => {
        const newMessages = [...prev, message];
        // localStorageも更新
        setCachedData(user.uid, selectedContact.id, newMessages, hasMore);
        return newMessages;
    });
  }, [user, selectedContact, hasMore]);

  const removeMessageFromState = useCallback((messageId: string) => {
    if(!user || !selectedContact) return;

    setMessages(prev => {
        const newMessages = prev.filter(msg => msg.id !== messageId);
        // localStorageも更新
        setCachedData(user.uid, selectedContact.id, newMessages, hasMore);
        return newMessages;
    });
  }, [user, selectedContact, hasMore]);

  useEffect(() => {
    if (user) {
      loadContacts();
    }
  }, [user, loadContacts]);

  useEffect(() => {
    if (selectedContact) {
      loadInitialMessages(selectedContact.id);
    } else {
      setMessages([]);
    }
  }, [selectedContact, loadInitialMessages]);

  return {
    contacts,
    contactsLoading,
    selectedContact,
    setSelectedContact,
    messages,
    messagesLoading,
    isLoadingMore,
    hasMore,
    loadMoreMessages,
    addMessageToState,
    removeMessageFromState,
  };
};