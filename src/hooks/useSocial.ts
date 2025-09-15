'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuthContext } from '@/providers/AuthProvider';
import {
  getTimeline,
  createSocialPost,
  initializeUserTimeline,
  getSocialContacts,
  addSocialContact,
  getSocialMessages,
  addSocialMessage,
  generateSocialAIResponse,
  getSocialNPCs,
  getSocialNPC,
  getSocialAccounts,
  updateSocialAccount
} from '@/actions/social';
import {
  UISocialPost,
  SocialPost,
  SocialContact,
  UISocialDMMessage,
  SocialNPC,
  SocialAccount,
  SocialErrorType,
  CachedSocialPosts,
  CachedSocialMessages,
  CachedSocialNPCs,
  CachedSocialContacts,
  CachedSocialAccounts,
  CachedSocialNPCProfile,
  convertToUISocialPost,
  convertToUISocialDMMessage,
  getSocialErrorMessage
} from '@/types/social';
import {
  SOCIAL_CACHE_PREFIX,
  SOCIAL_CACHE_EXPIRATION,
  SOCIAL_CACHE_FRESHNESS_THRESHOLD,
  SOCIAL_POSTS_PER_PAGE,
  SOCIAL_MESSAGES_PER_PAGE,
} from '@/lib/social/constants';

/**
 * localStorageからキャッシュされた投稿データを取得
 */
const getCachedPosts = (userId: string): CachedSocialPosts | null => {
  try {
    const key = `${SOCIAL_CACHE_PREFIX}posts_${userId}`;
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const data: CachedSocialPosts = JSON.parse(cached);
    // 有効期限切れをチェック
    if (Date.now() > data.timestamp + SOCIAL_CACHE_EXPIRATION) {
      localStorage.removeItem(key);
      return null;
    }
    // timestampを文字列からDateオブジェクトに復元
    data.posts = data.posts.map(post => ({
      ...post,
      timestamp: new Date(post.timestamp)
    }));
    return data;
  } catch {
    return null;
  }
};

/**
 * localStorageに投稿データをキャッシュ
 */
const setCachedPosts = (userId: string, posts: UISocialPost[], hasMore: boolean) => {
  try {
    const key = `${SOCIAL_CACHE_PREFIX}posts_${userId}`;
    const data: CachedSocialPosts = { posts, hasMore, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to cache social posts:', error);
  }
};

/**
 * localStorageからキャッシュされたメッセージを取得
 */
const getCachedMessages = (userId: string, accountId: string, contactId: string): CachedSocialMessages | null => {
  try {
    const key = `${SOCIAL_CACHE_PREFIX}messages_${userId}_${accountId}_${contactId}`;
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const data: CachedSocialMessages = JSON.parse(cached);
    // 有効期限切れをチェック
    if (Date.now() > data.timestamp + SOCIAL_CACHE_EXPIRATION) {
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
 * localStorageにメッセージをキャッシュ
 */
const setCachedMessages = (userId: string, accountId: string, contactId: string, messages: UISocialDMMessage[], hasMore: boolean) => {
  try {
    const key = `${SOCIAL_CACHE_PREFIX}messages_${userId}_${accountId}_${contactId}`;
    const data: CachedSocialMessages = { messages, hasMore, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to cache social messages:', error);
  }
};

/**
 * localStorageからキャッシュされたNPCデータを取得
 */
const getCachedNPCs = (): CachedSocialNPCs | null => {
  try {
    const key = `${SOCIAL_CACHE_PREFIX}npcs`;
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const data: CachedSocialNPCs = JSON.parse(cached);
    // 有効期限切れをチェック
    if (Date.now() > data.timestamp + SOCIAL_CACHE_EXPIRATION) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

/**
 * localStorageにNPCデータをキャッシュ
 */
const setCachedNPCs = (npcs: SocialNPC[]) => {
  try {
    const key = `${SOCIAL_CACHE_PREFIX}npcs`;
    const data: CachedSocialNPCs = { npcs, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to cache social NPCs:', error);
  }
};

/**
 * localStorageからキャッシュされた連絡先リストを取得
 */
const getCachedContacts = (userId: string, accountId: string): CachedSocialContacts | null => {
  try {
    const key = `${SOCIAL_CACHE_PREFIX}contacts_${userId}_${accountId}`;
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const data: CachedSocialContacts = JSON.parse(cached);
    // 有効期限切れをチェック
    if (Date.now() > data.timestamp + SOCIAL_CACHE_EXPIRATION) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

/**
 * localStorageに連絡先リストをキャッシュ
 */
const setCachedContacts = (userId: string, accountId: string, contacts: SocialContact[]) => {
  try {
    const key = `${SOCIAL_CACHE_PREFIX}contacts_${userId}_${accountId}`;
    const data: CachedSocialContacts = { contacts, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to cache social contacts:', error);
  }
};

/**
 * localStorageからキャッシュされたアカウントリストを取得
 */
const getCachedAccounts = (userId: string): CachedSocialAccounts | null => {
  try {
    const key = `${SOCIAL_CACHE_PREFIX}accounts_${userId}`;
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const data: CachedSocialAccounts = JSON.parse(cached);
    // 有効期限切れをチェック
    if (Date.now() > data.timestamp + SOCIAL_CACHE_EXPIRATION) {
      localStorage.removeItem(key);
      return null;
    }
    // timestampを文字列からDateオブジェクトに復元
    data.accounts = data.accounts.map(account => ({
      ...account,
      createdAt: new Date(account.createdAt)
    }));
    return data;
  } catch {
    return null;
  }
};

/**
 * localStorageにアカウントリストをキャッシュ
 */
const setCachedAccounts = (userId: string, accounts: SocialAccount[]) => {
  try {
    const key = `${SOCIAL_CACHE_PREFIX}accounts_${userId}`;
    const data: CachedSocialAccounts = { accounts, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to cache social accounts:', error);
  }
};

/**
 * localStorageからキャッシュされた個別NPCプロフィールを取得
 */
const getCachedNPCProfile = (npcId: string): CachedSocialNPCProfile | null => {
  try {
    const key = `${SOCIAL_CACHE_PREFIX}npc_profile_${npcId}`;
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const data: CachedSocialNPCProfile = JSON.parse(cached);
    // 有効期限切れをチェック
    if (Date.now() > data.timestamp + SOCIAL_CACHE_EXPIRATION) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

/**
 * localStorageに個別NPCプロフィールをキャッシュ
 */
const setCachedNPCProfile = (npc: SocialNPC) => {
  try {
    const key = `${SOCIAL_CACHE_PREFIX}npc_profile_${npc.id}`;
    const data: CachedSocialNPCProfile = { npc, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to cache NPC profile:', error);
  }
};

/**
 * セキュアなID生成
 */
function generateSecureId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * キャッシュ機能をエクスポートして他のコンポーネントで使用可能にする
 */
export {
  getCachedAccounts,
  setCachedAccounts,
  getCachedContacts,
  setCachedContacts,
  getCachedNPCProfile,
  setCachedNPCProfile
};

/**
 * SNSアプリのデータ管理とキャッシュ機能を提供するカスタムフック
 */
export const useSocial = (
  activeAccount: SocialAccount | null = null,
  allAccounts: SocialAccount[] = []
) => {
  const { user } = useAuthContext();

  // タイムライン関連
  const [posts, setPosts] = useState<UISocialPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [isLoadingMorePosts, setIsLoadingMorePosts] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);

  // DM関連
  const [contacts, setContacts] = useState<SocialContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<SocialContact | null>(null);
  const [messages, setMessages] = useState<UISocialDMMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  // NPC関連
  const [npcs, setNpcs] = useState<SocialNPC[]>([]);
  const [npcsLoading, setNpcsLoading] = useState(true);


  // エラー状態
  const [error, setError] = useState<string | null>(null);

  /**
   * 投稿の作成者情報を取得
   */
  const getAuthorInfo = useCallback((post: SocialPost) => {
    if (post.authorType === 'npc') {
      const npc = npcs.find(n => n.id === post.authorId);
      if (npc) {
        return { id: npc.id, name: npc.name, avatar: npc.avatar };
      } else {
        console.warn(`NPC not found for post ${post.id}, authorId: ${post.authorId}`);
        return { id: 'unknown', name: 'Unknown', avatar: 'U' };
      }
    } else {
      // ユーザー投稿の場合は allAccounts から情報を取得
      const userAccount = allAccounts.find(acc => acc.id === post.authorId);
      if (userAccount) {
        return {
          id: userAccount.id,
          name: userAccount.name,
          avatar: userAccount.avatar
        };
      } else {
        console.warn(`User account not found for post ${post.id}, authorId: ${post.authorId}`);
        return { id: 'unknown', name: 'Unknown', avatar: 'U' };
      }
    }
  }, [npcs, allAccounts]);

  /**
   * NPCデータを読み込み
   */
  const loadNPCs = useCallback(async () => {
    try {
      setNpcsLoading(true);
      setError(null);

      // キャッシュから読み込み
      const cached = getCachedNPCs();
      if (cached && Date.now() < cached.timestamp + SOCIAL_CACHE_FRESHNESS_THRESHOLD) {
        setNpcs(cached.npcs);
        setNpcsLoading(false);
        return;
      }

      // サーバーから取得
      const fetchedNPCs = await getSocialNPCs();
      setNpcs(fetchedNPCs);
      setCachedNPCs(fetchedNPCs);
    } catch (error) {
      console.error('Failed to load NPCs:', error);
      const errorType = error instanceof Error ? error.message : 'general';
      setError(getSocialErrorMessage(errorType as SocialErrorType));
    } finally {
      setNpcsLoading(false);
    }
  }, []);

  /**
   * タイムライン初期読み込み
   */
  const loadInitialTimeline = useCallback(async () => {
    if (!user) return;

    setPostsLoading(true);
    setError(null);

    try {
      // キャッシュから読み込み
      const cached = getCachedPosts(user.uid);
      if (cached && Date.now() < cached.timestamp + SOCIAL_CACHE_FRESHNESS_THRESHOLD) {
        setPosts(cached.posts);
        setHasMorePosts(cached.hasMore);
        setPostsLoading(false);
        return;
      }

      // 古いキャッシュを一旦表示
      if (cached) {
        setPosts(cached.posts);
        setHasMorePosts(cached.hasMore);
      }

      // サーバーから取得
      const { items: newPosts, hasMore } = await getTimeline({ 
        userId: user.uid, 
        limit: SOCIAL_POSTS_PER_PAGE 
      });

      // NPCデータと結合してUI用に変換
      const uiPosts = newPosts.map(post => {
        const author = getAuthorInfo(post);
        return convertToUISocialPost(post, author);
      });

      setPosts(uiPosts);
      setHasMorePosts(hasMore);
      setCachedPosts(user.uid, uiPosts, hasMore);
    } catch (error) {
      console.error('Failed to load timeline:', error);
      const errorType = error instanceof Error ? error.message : 'general';
      setError(getSocialErrorMessage(errorType as SocialErrorType));
    } finally {
      setPostsLoading(false);
    }
  }, [user, getAuthorInfo]);

  /**
   * タイムラインの追加読み込み（無限スクロール）
   */
  const loadMorePosts = useCallback(async () => {
    if (!user || !hasMorePosts || isLoadingMorePosts || posts.length === 0) return;

    setIsLoadingMorePosts(true);
    const lastPost = posts[posts.length - 1];

    try {
      const { items: newPosts, hasMore } = await getTimeline({
        userId: user.uid,
        limit: SOCIAL_POSTS_PER_PAGE,
        cursor: lastPost.id
      });

      if (newPosts.length > 0) {
        const uiPosts = newPosts.map(post => {
          const author = getAuthorInfo(post);
          return convertToUISocialPost(post, author);
        });

        setPosts(prev => {
          const updatedPosts = [...prev, ...uiPosts];
          setCachedPosts(user.uid, updatedPosts, hasMore);
          return updatedPosts;
        });
      }
      
      setHasMorePosts(hasMore);
    } catch (error) {
      console.error('Failed to load more posts:', error);
      const errorType = error instanceof Error ? error.message : 'general';
      setError(getSocialErrorMessage(errorType as SocialErrorType));
    } finally {
      setIsLoadingMorePosts(false);
    }
  }, [user, hasMorePosts, isLoadingMorePosts, posts, getAuthorInfo]);

  /**
   * 新しい投稿を作成
   */
  const createPost = useCallback(async (content: string) => {
    if (!user || !activeAccount) throw new Error('authError');

    try {
      setError(null);
      const newPost = await createSocialPost(user.uid, activeAccount.id, content);
      
      const author = {
        id: activeAccount.id,
        name: activeAccount.name,
        avatar: activeAccount.avatar
      };
      
      const uiPost = convertToUISocialPost(newPost, author);
      
      setPosts(prev => {
        const updatedPosts = [uiPost, ...prev];
        setCachedPosts(user.uid, updatedPosts, hasMorePosts);
        return updatedPosts;
      });
      
      return uiPost;
    } catch (error) {
      console.error('Failed to create post:', error);
      const errorType = error instanceof Error ? error.message : 'general';
      setError(getSocialErrorMessage(errorType as SocialErrorType));
      throw error;
    }
  }, [user, activeAccount, hasMorePosts]);

  /**
   * DM連絡先を読み込み
   */
  const loadContacts = useCallback(async () => {
    if (!user || !activeAccount) return;

    setContactsLoading(true);
    setError(null);

    try {
      // キャッシュから読み込み
      const cached = getCachedContacts(user.uid, activeAccount.id);
      if (cached && Date.now() < cached.timestamp + SOCIAL_CACHE_FRESHNESS_THRESHOLD) {
        setContacts(cached.contacts);
        setContactsLoading(false);
        return;
      }

      // 古いキャッシュを一旦表示
      if (cached) {
        setContacts(cached.contacts);
      }

      // サーバーから取得
      const fetchedContacts = await getSocialContacts(user.uid, activeAccount.id);
      setContacts(fetchedContacts);
      setCachedContacts(user.uid, activeAccount.id, fetchedContacts);
    } catch (error) {
      console.error('Failed to load contacts:', error);
      const errorType = error instanceof Error ? error.message : 'general';
      setError(getSocialErrorMessage(errorType as SocialErrorType));
    } finally {
      setContactsLoading(false);
    }
  }, [user, activeAccount]);

  /**
   * DMメッセージ初期読み込み
   */
  const loadInitialMessages = useCallback(async (contactId: string) => {
    if (!user || !activeAccount || !contactId) return;

    setMessagesLoading(true);
    setError(null);

    try {
      // キャッシュから読み込み
      const cached = getCachedMessages(user.uid, activeAccount.id, contactId);
      if (cached && Date.now() < cached.timestamp + SOCIAL_CACHE_FRESHNESS_THRESHOLD) {
        setMessages(cached.messages);
        setHasMoreMessages(cached.hasMore);
        setMessagesLoading(false);
        return;
      }

      // 古いキャッシュを一旦表示
      if (cached) {
        setMessages(cached.messages);
        setHasMoreMessages(cached.hasMore);
      } else {
        setMessages([]);
        setHasMoreMessages(true);
      }

      // サーバーから取得
      const { items: newMessages, hasMore } = await getSocialMessages({
        userId: user.uid,
        accountId: activeAccount.id,
        contactId,
        limit: SOCIAL_MESSAGES_PER_PAGE
      });

      const uiMessages = newMessages.map(convertToUISocialDMMessage);
      setMessages(uiMessages);
      setHasMoreMessages(hasMore);
      setCachedMessages(user.uid, activeAccount.id, contactId, uiMessages, hasMore);
    } catch (error) {
      console.error('Failed to load messages:', error);
      const errorType = error instanceof Error ? error.message : 'general';
      setError(getSocialErrorMessage(errorType as SocialErrorType));
    } finally {
      setMessagesLoading(false);
    }
  }, [user, activeAccount]);

  /**
   * DMメッセージの追加読み込み（無限スクロール）
   */
  const loadMoreMessages = useCallback(async () => {
    if (!user || !activeAccount || !selectedContact || !hasMoreMessages || isLoadingMoreMessages || messages.length === 0) return;

    setIsLoadingMoreMessages(true);
    const oldestMessage = messages[0];

    try {
      const { items: newMessages, hasMore } = await getSocialMessages({
        userId: user.uid,
        accountId: activeAccount.id,
        contactId: selectedContact.id,
        limit: SOCIAL_MESSAGES_PER_PAGE,
        cursor: oldestMessage.id
      });

      if (newMessages.length > 0) {
        const uiMessages = newMessages.map(convertToUISocialDMMessage);
        setMessages(prev => {
          const updatedMessages = [...uiMessages, ...prev];
          setCachedMessages(user.uid, activeAccount.id, selectedContact.id, updatedMessages, hasMore);
          return updatedMessages;
        });
      }
      
      setHasMoreMessages(hasMore);
    } catch (error) {
      console.error('Failed to load more messages:', error);
      const errorType = error instanceof Error ? error.message : 'general';
      setError(getSocialErrorMessage(errorType as SocialErrorType));
    } finally {
      setIsLoadingMoreMessages(false);
    }
  }, [user, activeAccount, selectedContact, hasMoreMessages, isLoadingMoreMessages, messages]);

  /**
   * 新しい連絡先を追加
   */
  const addNewContact = useCallback(async (npcId: string, npcName: string) => {
    if (!user || !activeAccount) throw new Error('authError');

    try {
      setError(null);

      // 既存の連絡先をチェック
      const existingContact = contacts.find(c => c.id === npcId);
      if (existingContact) {
        return existingContact;
      }

      // 新しい連絡先を作成
      const newContact: SocialContact = {
        id: npcId,
        name: npcName,
        type: 'npc'
      };

      // Firestoreに保存
      await addSocialContact(user.uid, activeAccount.id, newContact);

      // 状態を更新
      setContacts(prev => {
        const updatedContacts = [newContact, ...prev];
        setCachedContacts(user.uid, activeAccount.id, updatedContacts);
        return updatedContacts;
      });
      return newContact;
    } catch (error) {
      console.error('Failed to add contact:', error);
      const errorType = error instanceof Error ? error.message : 'general';
      setError(getSocialErrorMessage(errorType as SocialErrorType));
      throw error;
    }
  }, [user, activeAccount, contacts]);

  /**
   * プロフィールを更新（キャッシュも更新）
   */
  const updateUserProfile = useCallback(async (profileData: SocialAccount) => {
    if (!user || !activeAccount) throw new Error('authError');

    try {
      setError(null);
      await updateSocialAccount(user.uid, activeAccount.id, profileData);

      // アカウントキャッシュを更新
      const cached = getCachedAccounts(user.uid);
      if (cached) {
        const updatedAccounts = cached.accounts.map(account =>
          account.id === activeAccount.id
            ? { ...account, ...profileData }
            : account
        );
        setCachedAccounts(user.uid, updatedAccounts);
      }

      return true;
    } catch (error) {
      console.error('Failed to update profile:', error);
      const errorType = error instanceof Error ? error.message : 'general';
      setError(getSocialErrorMessage(errorType as SocialErrorType));
      throw error;
    }
  }, [user, activeAccount]);

  /**
   * DMメッセージを送信
   */
  const sendMessage = useCallback(async (text: string) => {
    if (!user || !activeAccount || !selectedContact) throw new Error('authError');

    const messageId = crypto.randomUUID();
    const userMessage: UISocialDMMessage = {
      id: messageId,
      sender: 'me',
      text,
      time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
      timestamp: new Date(),
    };

    // UI状態を即座に更新
    const addMessageToState = (message: UISocialDMMessage) => {
      setMessages(prev => {
        const newMessages = [...prev, message];
        setCachedMessages(user.uid, activeAccount.id, selectedContact.id, newMessages, hasMoreMessages);
        return newMessages;
      });
    };

    const removeMessageFromState = (messageId: string) => {
      setMessages(prev => {
        const newMessages = prev.filter(msg => msg.id !== messageId);
        setCachedMessages(user.uid, activeAccount.id, selectedContact.id, newMessages, hasMoreMessages);
        return newMessages;
      });
    };

    addMessageToState(userMessage);

    try {
      setError(null);

      // ユーザーメッセージを保存
      await addSocialMessage(user.uid, activeAccount.id, selectedContact.id, {
        sender: 'user',
        text,
        timestamp: userMessage.timestamp,
      });

      // AI応答を生成
      const aiText = await generateSocialAIResponse(text, [], selectedContact.id);

      const aiMessageId = generateSecureId();
      const aiMessage: UISocialDMMessage = {
        id: aiMessageId,
        sender: 'other',
        text: aiText,
        time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date(),
      };

      // AI応答を保存
      await addSocialMessage(user.uid, activeAccount.id, selectedContact.id, {
        sender: 'npc',
        text: aiText,
        timestamp: aiMessage.timestamp,
      });

      addMessageToState(aiMessage);
    } catch (error) {
      console.error('Failed to send message:', error);
      removeMessageFromState(messageId);

      const errorType = error instanceof Error ? error.message : 'general';
      const errorText = getSocialErrorMessage(errorType as SocialErrorType);

      const errorMessage: UISocialDMMessage = {
        id: generateSecureId(),
        sender: 'other',
        text: errorText,
        time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date(),
      };
      addMessageToState(errorMessage);
    }
  }, [user, activeAccount, selectedContact, hasMoreMessages]);

  // 初期データ読み込み
  useEffect(() => {
    loadNPCs();
  }, [loadNPCs]);

  useEffect(() => {
    if (user && activeAccount) {
      // アカウント切り替え時にDM関連の状態をリセット
      setContacts([]);
      setMessages([]);
      setSelectedContact(null);

      loadContacts();
    }
  }, [user, activeAccount, loadContacts]);

  useEffect(() => {
    if (npcs.length > 0 && !npcsLoading) {
      loadInitialTimeline();
    }
  }, [npcs, npcsLoading, loadInitialTimeline]);

  // タイムライン初期化（初回のみ）
  useEffect(() => {
    if (user && npcs.length > 0 && !npcsLoading) {
      const initializeTimeline = async () => {
        try {
          // タイムラインが空かチェック
          const cached = getCachedPosts(user.uid);
          if (!cached || cached.posts.length === 0) {
            console.log('Initializing user timeline...');
            await initializeUserTimeline(user.uid);
            // 初期化後、タイムライン再読み込み
            loadInitialTimeline();
          }
        } catch (error) {
          console.error('Failed to initialize timeline:', error);
        }
      };
      initializeTimeline();
    }
  }, [user, npcs, npcsLoading, loadInitialTimeline]);

  useEffect(() => {
    if (selectedContact) {
      loadInitialMessages(selectedContact.id);
    } else {
      setMessages([]);
    }
  }, [selectedContact, loadInitialMessages]);

  // NPCをIDで取得する関数（キャッシュ付き）
  const getNPCById = useCallback((id: string): SocialNPC | null => {
    return npcs.find(npc => npc.id === id) || null;
  }, [npcs]);

  /**
   * キャッシュ付きで個別NPCプロフィールを取得
   */
  const getNPCProfile = useCallback(async (npcId: string): Promise<SocialNPC | null> => {
    try {
      // キャッシュから読み込み
      const cached = getCachedNPCProfile(npcId);
      if (cached && Date.now() < cached.timestamp + SOCIAL_CACHE_FRESHNESS_THRESHOLD) {
        return cached.npc;
      }

      // サーバーから取得
      const npc = await getSocialNPC(npcId);
      if (npc) {
        setCachedNPCProfile(npc);
      }
      return npc;
    } catch (error) {
      console.error('Failed to get NPC profile:', error);
      return null;
    }
  }, []);

  /**
   * キャッシュ付きでソーシャルアカウントリストを取得
   */
  const loadSocialAccounts = useCallback(async (userId: string): Promise<SocialAccount[]> => {
    try {
      // キャッシュから読み込み
      const cached = getCachedAccounts(userId);
      if (cached && Date.now() < cached.timestamp + SOCIAL_CACHE_FRESHNESS_THRESHOLD) {
        return cached.accounts;
      }

      // サーバーから取得
      const accounts = await getSocialAccounts(userId);
      setCachedAccounts(userId, accounts);
      return accounts;
    } catch (error) {
      console.error('Failed to load social accounts:', error);
      throw error;
    }
  }, []);


  // エラーの自動クリア
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return {
    // タイムライン
    posts,
    postsLoading,
    isLoadingMorePosts,
    hasMorePosts,
    loadMorePosts,
    createPost,

    // DM
    contacts,
    contactsLoading,
    selectedContact,
    setSelectedContact,
    messages,
    messagesLoading,
    isLoadingMoreMessages,
    hasMoreMessages,
    loadMoreMessages,
    sendMessage,

    // NPC
    npcs,
    npcsLoading,
    getNPCById,
    getNPCProfile,

    // アカウント管理
    loadSocialAccounts,

    // プロフィール
    updateUserProfile,

    // エラー
    error,
    setError,

    // 連絡先管理
    addNewContact,

    // リフレッシュ
    refreshTimeline: loadInitialTimeline,
    refreshContacts: loadContacts,
  };
};