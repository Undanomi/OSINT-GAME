'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuthContext } from '@/providers/AuthProvider';
import { getContacts, getMessages, addMessage, addContact, getIntroductionMessageFromFirestore } from '@/actions/messenger';
import { MessengerContact, UIMessage, convertFirestoreToUIMessage, defaultMessengerContacts, ChatMessage } from '@/types/messenger';
import { useMessengerStore } from '@/store/messengerStore';
import { appNotifications } from '@/utils/notifications';




export const useMessenger = () => {
  const { user } = useAuthContext();
  const {
    getContacts: getCachedContacts,
    setContacts: setCachedContacts,
    getMessages: getCachedMessages,
    setMessages: setCachedMessages,
  } = useMessengerStore();

  const [contacts, setContacts] = useState<MessengerContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);

  const [selectedContact, setSelectedContact] = useState<MessengerContact | null>(null);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [needsCacheUpdate, setNeedsCacheUpdate] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const initializationExecuted = useRef(false);

  const loadContacts = useCallback(async () => {
    if (!user) return;

    // 1. キャッシュから連絡先を取得
    const cachedContacts = getCachedContacts();
    if (cachedContacts) {
      setContacts(cachedContacts);
      if (!selectedContact && cachedContacts.length > 0) {
        setSelectedContact(cachedContacts[0]);
      }
      setContactsLoading(false);
      return;
    }

    // 2. キャッシュがない場合はサーバーから取得
    try {
      setContactsLoading(true);
      const fetchedContacts = await getContacts();
      setContacts(fetchedContacts);
      setCachedContacts(fetchedContacts);
      if (!selectedContact && fetchedContacts.length > 0) {
        setSelectedContact(fetchedContacts[0]);
      }
    } catch (error) {
      console.error('Failed to load contacts', error);
    } finally {
      setContactsLoading(false);
    }
  }, [user, selectedContact, getCachedContacts, setCachedContacts]);

  const loadInitialMessages = useCallback(async (contactId: string) => {
    if (!user || !contactId) return;

    setMessagesLoading(true);

    // 1. キャッシュからメッセージを取得
    const cached = getCachedMessages(contactId);
    if (cached) {
      setMessages(cached.messages);
      setHasMore(cached.hasMore);
      setMessagesLoading(false);
      return;
    }

    // 2. キャッシュがない場合はサーバーから取得
    try {
      const { messages: newMessages, hasMore: newHasMore } = await getMessages(contactId);
      const uiMessages = newMessages.map(convertFirestoreToUIMessage);

      setMessages(uiMessages);
      setHasMore(newHasMore);
      setCachedMessages(contactId, uiMessages, newHasMore);
    } catch (error) {
      console.error('Failed to load messages', error);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, [user, getCachedMessages, setCachedMessages]);

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
        setMessages(prev => [...uiMessages, ...prev]);
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

    setMessages(prev => [...prev, message]);
    setNeedsCacheUpdate(true);
  }, [user, selectedContact]);

  const removeMessageFromState = useCallback((messageId: string) => {
    if(!user || !selectedContact) return;

    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    setNeedsCacheUpdate(true);
  }, [user, selectedContact]);

  const addTemporaryMessage = useCallback((message: UIMessage) => {
    if(!user || !selectedContact) return;

    setMessages(prev => [...prev, message]);
  }, [user, selectedContact]);

  // 初期化関数群
  const initializeUserContacts = useCallback(async (): Promise<void> => {
    try {
      for (const contact of defaultMessengerContacts) {
        const { id, ...contactData } = contact;
        await addContact(contactData, id);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error initializing user contacts:', error);
      }
      throw error;
    }
  }, []);

  const sendIntroductionMessage = useCallback(async (): Promise<void> => {
    try {
      const introData = await getIntroductionMessageFromFirestore('darkOrganization');
      const introText = introData?.text || 'ようこそ。あなたが我々に興味を持ってくれたことを知っています。まずは簡単な質問から始めましょうか。何か知りたいことはありますか？';
      const contactId = 'dark_organization';

      const introMessage: ChatMessage = {
        id: `intro-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        sender: 'npc',
        text: introText,
        timestamp: new Date(),
      };

      await addMessage(contactId, introMessage);

      const previewText = introText.length > 50 ? `${introText.substring(0, 50)}...` : introText;
      appNotifications.fromApp(
        'messenger',
        '闇の組織からの新着メッセージ',
        previewText,
        'info',
        5000
      );
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error in sendIntroductionMessage:', error);
      }
      throw error;
    }
  }, []);

  const initializeMessenger = useCallback(async () => {
    // 既に実行済み、または実行中、または初期化完了の場合は何もしない
    if (initializationExecuted.current || isInitializing || isInitialized) return;

    // 実行フラグを立てて重複実行を防止
    initializationExecuted.current = true;
    setIsInitializing(true);

    try {
      const contacts = await getContacts();
      if (contacts.length > 0) {
        setIsInitialized(true);
        return;
      }

      console.log('Starting messenger initialization...');

      // 1. デフォルト連絡先をDBに追加
      await initializeUserContacts();

      // 2. イントロメッセージを送信
      await sendIntroductionMessage();

      setIsInitialized(true);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Messenger initialization failed:', error);
      }
      const isAuthError =
        error instanceof Error && error.message.includes('認証が必要');

      if (isAuthError) {
        appNotifications.fromApp(
          'messenger',
          '認証エラー',
          'ログイン状態を確認できませんでした。再ログインしてください。',
          'error',
          5000
        );
        // 認証エラー時は再試行ループに入らないようフラグを維持する
        initializationExecuted.current = true;
      } else {
        // その他のエラーは再試行できるようにフラグをリセット
        initializationExecuted.current = false;
      }
    } finally {
      setIsInitializing(false);
    }
  }, [isInitializing, isInitialized, initializeUserContacts, sendIntroductionMessage]);

  useEffect(() => {
    if (user && !isInitializing && !isInitialized) {
      initializeMessenger();
    } else if (user && isInitialized) {
      loadContacts();
    }
  }, [user, isInitializing, isInitialized, initializeMessenger, loadContacts]);

  useEffect(() => {
    if (selectedContact) {
      loadInitialMessages(selectedContact.id);
    } else {
      setMessages([]);
    }
  }, [selectedContact, loadInitialMessages]);

  // addMessageToState と removeMessageFromState 用のキャッシュ更新
  useEffect(() => {
    if (needsCacheUpdate && selectedContact && messages.length > 0) {
      setCachedMessages(selectedContact.id, messages, hasMore);
      setNeedsCacheUpdate(false);
    }
  }, [needsCacheUpdate, selectedContact, messages, hasMore, setCachedMessages]);

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
    addTemporaryMessage,
  };
};