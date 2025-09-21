'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuthContext } from '@/providers/AuthProvider';
import { getContacts, getMessages } from '@/actions/messenger';
import { MessengerContact, UIMessage, convertFirestoreToUIMessage } from '@/types/messenger';
import { useMessengerStore } from '@/store/messengerStore';




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
        setMessages(prev => {
          const updatedMessages = [...uiMessages, ...prev];
          // キャッシュも更新
          setCachedMessages(selectedContact.id, updatedMessages, newHasMore);
          return updatedMessages;
        });
      }
      setHasMore(newHasMore);
    } catch (error) {
      console.error('Failed to load more messages', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [user, selectedContact, messages, hasMore, isLoadingMore, setCachedMessages]);

  const addMessageToState = useCallback((message: UIMessage) => {
    if(!user || !selectedContact) return;

    setMessages(prev => {
        const newMessages = [...prev, message];
        // キャッシュも更新
        setCachedMessages(selectedContact.id, newMessages, hasMore);
        return newMessages;
    });
  }, [user, selectedContact, hasMore, setCachedMessages]);

  const removeMessageFromState = useCallback((messageId: string) => {
    if(!user || !selectedContact) return;

    setMessages(prev => {
        const newMessages = prev.filter(msg => msg.id !== messageId);
        // キャッシュも更新
        setCachedMessages(selectedContact.id, newMessages, hasMore);
        return newMessages;
    });
  }, [user, selectedContact, hasMore, setCachedMessages]);

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