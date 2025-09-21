import { create } from 'zustand';
import type { MessengerContact, UIMessage, CachedMessages } from '@/types/messenger';

interface MessengerCache {
  // 連絡先リスト
  contacts: MessengerContact[] | null;

  // メッセージキャッシュ (contactId -> CachedMessages)
  messageCache: Record<string, CachedMessages>;

  // 選択された連絡先
  selectedContactId: string | null;
}

interface MessengerStore {
  cache: MessengerCache;

  // 連絡先関連
  setContacts: (contacts: MessengerContact[]) => void;
  getContacts: () => MessengerContact[] | null;
  clearContacts: () => void;

  // メッセージ関連
  setMessages: (contactId: string, messages: UIMessage[], hasMore: boolean) => void;
  getMessages: (contactId: string) => CachedMessages | null;
  addMessageToCache: (contactId: string, message: UIMessage) => void;
  removeMessageFromCache: (contactId: string, messageId: string) => void;
  clearMessages: (contactId: string) => void;
  clearAllMessages: () => void;

  // 選択状態
  setSelectedContact: (contactId: string | null) => void;
  getSelectedContactId: () => string | null;

  // 全体クリア
  clearAllCache: () => void;
}

export const useMessengerStore = create<MessengerStore>((set, get) => ({
  cache: {
    contacts: null,
    messageCache: {},
    selectedContactId: null,
  },

  // 連絡先関連
  setContacts: (contacts) => set((state) => ({
    cache: {
      ...state.cache,
      contacts,
    }
  })),

  getContacts: () => {
    const { cache } = get();
    return cache.contacts;
  },

  clearContacts: () => set((state) => ({
    cache: {
      ...state.cache,
      contacts: null,
    }
  })),

  // メッセージ関連
  setMessages: (contactId, messages, hasMore) => set((state) => ({
    cache: {
      ...state.cache,
      messageCache: {
        ...state.cache.messageCache,
        [contactId]: {
          messages,
          hasMore,
          timestamp: Date.now(),
        }
      }
    }
  })),

  getMessages: (contactId) => {
    const { cache } = get();
    return cache.messageCache[contactId] || null;
  },

  addMessageToCache: (contactId, message) => set((state) => {
    const existingCache = state.cache.messageCache[contactId];

    if (!existingCache) {
      // キャッシュが存在しない場合は新規作成
      return {
        cache: {
          ...state.cache,
          messageCache: {
            ...state.cache.messageCache,
            [contactId]: {
              messages: [message],
              hasMore: false,
              timestamp: Date.now(),
            }
          }
        }
      };
    }

    // 既存のメッセージに追加（重複チェック）
    const existingMessageIds = new Set(existingCache.messages.map(m => m.id));
    if (existingMessageIds.has(message.id)) {
      return state; // 重複している場合は何もしない
    }

    return {
      cache: {
        ...state.cache,
        messageCache: {
          ...state.cache.messageCache,
          [contactId]: {
            ...existingCache,
            messages: [...existingCache.messages, message],
            timestamp: Date.now(),
          }
        }
      }
    };
  }),

  removeMessageFromCache: (contactId, messageId) => set((state) => {
    const existingCache = state.cache.messageCache[contactId];

    if (!existingCache) return state;

    return {
      cache: {
        ...state.cache,
        messageCache: {
          ...state.cache.messageCache,
          [contactId]: {
            ...existingCache,
            messages: existingCache.messages.filter(m => m.id !== messageId),
            timestamp: Date.now(),
          }
        }
      }
    };
  }),

  clearMessages: (contactId) => set((state) => {
    const newMessageCache = { ...state.cache.messageCache };
    delete newMessageCache[contactId];

    return {
      cache: {
        ...state.cache,
        messageCache: newMessageCache,
      }
    };
  }),

  clearAllMessages: () => set((state) => ({
    cache: {
      ...state.cache,
      messageCache: {},
    }
  })),

  // 選択状態
  setSelectedContact: (contactId) => set((state) => ({
    cache: {
      ...state.cache,
      selectedContactId: contactId,
    }
  })),

  getSelectedContactId: () => {
    const { cache } = get();
    return cache.selectedContactId;
  },

  // 全体クリア
  clearAllCache: () => set({
    cache: {
      contacts: null,
      messageCache: {},
      selectedContactId: null,
    }
  }),
}));