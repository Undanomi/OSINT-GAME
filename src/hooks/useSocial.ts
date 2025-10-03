'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuthContext } from '@/providers/AuthProvider';
import { useSocialStore } from '@/store/socialStore';
import { useGameStore } from '@/store/gameStore';
import {
  getTimeline,
  createSocialPost,
  getSocialContacts,
  addSocialContact,
  getSocialMessages,
  addSocialMessage,
  generateSocialAIResponse,
  getSocialNPCs,
  getSocialNPC,
  getSocialAccounts,
  updateSocialAccount,
  getErrorMessage
} from '@/actions/social';
import {
  SocialPost,
  SocialContact,
  UISocialDMMessage,
  UISocialPost,
  SocialNPC,
  SocialAccount,
  SocialErrorType,
  convertToUISocialPost,
  convertToUISocialDMMessage,
} from '@/types/social';
import {
  SOCIAL_POSTS_PER_PAGE,
  SOCIAL_MESSAGES_PER_PAGE,
  MAX_SOCIAL_CONVERSATION_HISTORY_LENGTH,
  CAUTION_GAME_OVER_THRESHOLD,
} from '@/lib/social/constants';


/**
 * タイムスタンプベースのメッセージID生成
 */
function generateTimestampId(timestamp: Date): string {
  const timeString = timestamp.toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${timeString}_${randomSuffix}`;
}


/**
 * SNSアプリのデータ管理とキャッシュ機能を提供するカスタムフック
 */
export const useSocial = (
  activeAccount: SocialAccount | null = null,
  allAccounts: SocialAccount[] = [],
  updateAccount?: (accountId: string, updates: Partial<SocialAccount>) => Promise<void>
) => {
  const { user } = useAuthContext();
  const store = useSocialStore();
  const { triggerGameOver } = useGameStore();

  // ローディング状態
  const [postsLoading, setPostsLoading] = useState(false);
  const [isLoadingMorePosts, setIsLoadingMorePosts] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);
  const [npcsLoading, setNpcsLoading] = useState(true);
  const [isWaitingForAI, setIsWaitingForAI] = useState(false);

  // UI状態
  const [selectedContact, setSelectedContact] = useState<SocialContact | null>(null);


  // ストアからデータを取得（useMemoで最適化）
  const posts = useMemo(() => {
    const now = new Date();
    const baseDate = new Date('2025-10-28');
    baseDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
    return (store.timeline?.posts || []).filter(post => post.timestamp <= baseDate);
  }, [store.timeline]);

  const hasMorePosts = useMemo(() => {
    return store.timeline?.hasMore ?? true;
  }, [store.timeline]);

  const npcs = useMemo(() => {
    return store.npcs?.npcs || [];
  }, [store.npcs]);
  const contacts = useMemo(() => {
    return activeAccount ? store.contacts[activeAccount.id]?.contacts || [] : [];
  }, [activeAccount, store.contacts]);

  const messages = useMemo(() => {
    return activeAccount && selectedContact
      ? store.messages[`${activeAccount.id}_${selectedContact.id}`]?.messages || []
      : [];
  }, [activeAccount, selectedContact, store.messages]);
  const hasMoreMessages = activeAccount && selectedContact
    ? store.messages[`${activeAccount.id}_${selectedContact.id}`]?.hasMore ?? true
    : true;


  // エラー状態
  const [error, setError] = useState<string | null>(null);

  /**
   * 投稿の作成者情報を取得
   */
  const getAuthorInfo = useCallback((post: SocialPost) => {
    if (post.authorType === 'npc') {
      const npc = npcs.find(n => n.id === post.authorId);
      if (npc) {
        return { id: npc.id, account_id: npc.account_id, name: npc.name, avatar: npc.avatar };
      } else {
        console.warn(`NPC not found for post ${post.id}, authorId: ${post.authorId}`);
        return { id: 'unknown', account_id: 'unknown', name: 'Unknown', avatar: 'U' };
      }
    } else {
      // ユーザー投稿の場合はストアのアカウント情報から取得
      const cachedAccounts = store.accounts?.accounts || [];
      const userAccount = [...allAccounts, ...cachedAccounts].find(acc => acc.id === post.authorId);
      if (userAccount) {
        return {
          id: userAccount.id,
          account_id: userAccount.account_id,
          name: userAccount.name,
          avatar: userAccount.avatar
        };
      } else {
        console.warn(`User account not found for post ${post.id}, authorId: ${post.authorId}`);
        return { id: 'unknown', account_id: 'unknown', name: 'Unknown', avatar: 'U' };
      }
    }
  }, [npcs, allAccounts, store.accounts]);

  /**
   * NPCデータを読み込み
   */
  const loadNPCs = useCallback(async () => {
    try {
      setNpcsLoading(true);
      setError(null);

      // ストアから読み込み
      if (store.npcs) {
        setNpcsLoading(false);
        return;
      }

      // サーバーから取得
      const fetchedNPCs = await getSocialNPCs();
      store.setNPCs(fetchedNPCs);
    } catch (error) {
      console.error('Failed to load NPCs:', error);
      setError("データの読み込みに失敗しました。しばらく待ってから再試行してください。");
    } finally {
      setNpcsLoading(false);
    }
  }, [store]);

  /**
   * タイムライン初期読み込み
   */
  const loadInitialTimeline = useCallback(async () => {
    if (!user) return;

    setPostsLoading(true);
    setError(null);

    try {
      // ストアから読み込み
      const existingTimeline = store.timeline;
      if (existingTimeline) {
        setPostsLoading(false);
        return;
      }

      // 全アカウント情報を事前に読み込み（作者情報解決のため）
      try {
        const accounts = await getSocialAccounts();
        store.setAccounts(accounts);
      } catch (accountError) {
        console.warn('Failed to load accounts for timeline:', accountError);
        // アカウント読み込みエラーでもタイムライン表示は継続
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

      store.setTimeline(uiPosts, hasMore);
    } catch (error) {
      console.error('Failed to load timeline:', error);
      setError("データの読み込みに失敗しました。しばらく待ってから再試行してください。");
    } finally {
      setPostsLoading(false);
    }
  }, [user, getAuthorInfo, store]);

  /**
   * タイムスタンプを更新（キャッシュは保持）
   */
  const refreshTimeline = useCallback(() => {
    if (!user || !store.timeline) return;

    // 現在のタイムラインの投稿に対してタイムスタンプのみを再計算
    const updatedPosts = store.timeline.posts.map(post => {
      // SocialPostの形に戻してからconvertToUISocialPostで再変換
      const socialPost = {
        id: post.id,
        authorId: post.authorId,
        authorType: post.authorType,
        content: post.content,
        timestamp: post.timestamp,
        likes: post.likes,
        comments: post.comments,
        shares: post.shares,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      };

      return convertToUISocialPost(socialPost, post.author);
    });

    // ストアを更新
    store.setTimeline(updatedPosts, store.timeline.hasMore);
  }, [user, store]);

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

        store.appendTimeline(uiPosts, hasMore);
      }
    } catch (error) {
      console.error('Failed to load more posts:', error);
      setError("データの読み込みに失敗しました。しばらく待ってから再試行してください。");
    } finally {
      setIsLoadingMorePosts(false);
    }
  }, [user, hasMorePosts, isLoadingMorePosts, posts, getAuthorInfo, store]);

  /**
   * 新しい投稿を作成
   */
  const createPost = useCallback(async (content: string) => {
    if (!user || !activeAccount) throw new Error('authError');

    try {
      setError(null);
      const newPost = await createSocialPost(activeAccount.id, content); // activeAccount.idはstable_id

      const author = {
        id: activeAccount.id,
        account_id: activeAccount.account_id,
        name: activeAccount.name,
        avatar: activeAccount.avatar
      };

      const uiPost = convertToUISocialPost(newPost, author);

      // タイムラインの先頭に追加
      const currentTimeline = store.timeline;
      if (currentTimeline) {
        store.setTimeline([uiPost, ...currentTimeline.posts], currentTimeline.hasMore);
      } else {
        store.setTimeline([uiPost], true);
      }

      return uiPost;
    } catch (error) {
      console.error('Failed to create post:', error);
      setError("データの読み込みに失敗しました。しばらく待ってから再試行してください。");
      throw error;
    }
  }, [user, activeAccount, store]);

  /**
   * DM連絡先を読み込み
   */
  const loadContacts = useCallback(async () => {
    if (!user || !activeAccount) return;

    setContactsLoading(true);
    setError(null);

    try {
      // ストアから読み込み
      const cached = store.contacts[activeAccount.id];
      if (cached) {
        setContactsLoading(false);
        return;
      }

      // サーバーから取得
      const fetchedContacts = await getSocialContacts(activeAccount.id);
      store.setContacts(activeAccount.id, fetchedContacts);
    } catch (error) {
      console.error('Failed to load contacts:', error);
      setError("データの読み込みに失敗しました。しばらく待ってから再試行してください。");
    } finally {
      setContactsLoading(false);
    }
  }, [user, activeAccount, store]);

  /**
   * DMメッセージ初期読み込み
   */
  const loadInitialMessages = useCallback(async (contactId: string) => {
    if (!user || !activeAccount || !contactId) return;

    setMessagesLoading(true);
    setError(null);

    try {
      // ストアから読み込み
      const cached = store.messages[`${activeAccount.id}_${contactId}`];
      if (cached) {
        setMessagesLoading(false);
        return;
      }

      // サーバーから取得
      const { items: newMessages, hasMore } = await getSocialMessages({
        accountId: activeAccount.id,
        contactId,
        limit: SOCIAL_MESSAGES_PER_PAGE
      });

      const uiMessages = newMessages.map(convertToUISocialDMMessage);
      store.setMessages(activeAccount.id, contactId, uiMessages, hasMore);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setError("データの読み込みに失敗しました。しばらく待ってから再試行してください。");
    } finally {
      setMessagesLoading(false);
    }
  }, [user, activeAccount, store]);

  /**
   * DMメッセージの追加読み込み（無限スクロール）
   */
  const loadMoreMessages = useCallback(async () => {
    if (!user || !activeAccount || !selectedContact || !hasMoreMessages || isLoadingMoreMessages || messages.length === 0) return;

    setIsLoadingMoreMessages(true);
    const oldestMessage = messages[0];

    try {
      const { items: newMessages, hasMore } = await getSocialMessages({
        accountId: activeAccount.id,
        contactId: selectedContact.id,
        limit: SOCIAL_MESSAGES_PER_PAGE,
        cursor: oldestMessage.id
      });

      if (newMessages.length > 0) {
        const uiMessages = newMessages.map(convertToUISocialDMMessage);
        store.appendMessages(activeAccount.id, selectedContact.id, uiMessages, hasMore);
      }
    } catch (error) {
      console.error('Failed to load more messages:', error);
      setError("データの読み込みに失敗しました。しばらく待ってから再試行してください。");
    } finally {
      setIsLoadingMoreMessages(false);
    }
  }, [user, activeAccount, selectedContact, hasMoreMessages, isLoadingMoreMessages, messages, store]);

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
      await addSocialContact(activeAccount.id, newContact);

      // ストアを更新
      const updatedContacts = [newContact, ...contacts];
      store.setContacts(activeAccount.id, updatedContacts);
      return newContact;
    } catch (error) {
      console.error('Failed to add contact:', error);
      setError("データの読み込みに失敗しました。しばらく待ってから再試行してください。");
      throw error;
    }
  }, [user, activeAccount, contacts, store]);

  /**
   * プロフィールを更新（キャッシュも更新）
   */
  const updateUserProfile = useCallback(async (profileData: SocialAccount) => {
    if (!user || !activeAccount) throw new Error('authError');

    try {
      setError(null);

      // SocialAccountProviderの updateAccount を使用
      if (updateAccount) {
        await updateAccount(activeAccount.id, profileData);
      } else {
        // フォールバック: 直接Firestoreを更新
        await updateSocialAccount(activeAccount.id, profileData);
      }

      // アカウントキャッシュを更新
      const cached = store.accounts;
      if (cached) {
        const updatedAccounts = cached.accounts.map((account: SocialAccount) =>
          account.id === activeAccount.id
            ? { ...account, ...profileData }
            : account
        );
        store.setAccounts(updatedAccounts);
      }

      return true;
    } catch (error) {
      console.error('Failed to update profile:', error);
      setError("データの読み込みに失敗しました。しばらく待ってから再試行してください。");
      throw error;
    }
  }, [user, activeAccount, store, updateAccount]);

  /**
   * DMメッセージを送信
   */
  const sendMessage = useCallback(async (text: string) => {
    if (!user || !activeAccount || !selectedContact) throw new Error('authError');
    if (isWaitingForAI) return; // AI応答待ち中は処理しない

    setIsWaitingForAI(true);
    const userTimestamp = new Date();
    const messageId = generateTimestampId(userTimestamp);
    const userMessage: UISocialDMMessage = {
      id: messageId,
      sender: 'me',
      text,
      time: userTimestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
      timestamp: userTimestamp,
    };

    // UI状態を即座に更新
    const addMessageToState = (message: UISocialDMMessage) => {
      store.addMessage(activeAccount.id, selectedContact.id, message);
    };

    addMessageToState(userMessage);

    try {
      setError(null);

      // ユーザーメッセージを保存
      await addSocialMessage(activeAccount.id, selectedContact.id, {
        id: messageId,
        sender: 'user',
        text,
        timestamp: userMessage.timestamp,
      });

      // AI応答を生成（過去の履歴を含める、最新N件に制限）
      const recentMessages = messages.slice(-MAX_SOCIAL_CONVERSATION_HISTORY_LENGTH);
      const chatHistory = recentMessages.map(msg => ({
        role: msg.sender === 'me' ? 'user' as const : 'model' as const,
        parts: [{ text: msg.text }]
      }));

      // 新しいAI応答生成関数を使用（プロフィールと関係性情報を含む）
      const aiResponse = await generateSocialAIResponse({
        message: text,
        chatHistory,
        npcId: selectedContact.id,
        userProfile: activeAccount,
        accountId: activeAccount.id
      });
      const aiText = aiResponse.responseText;

      const aiTimestamp = new Date();
      const aiMessageId = generateTimestampId(aiTimestamp);
      const aiMessage: UISocialDMMessage = {
        id: aiMessageId,
        sender: 'other',
        text: aiText,
        time: aiTimestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        timestamp: aiTimestamp,
      };

      // AI応答を保存
      await addSocialMessage(activeAccount.id, selectedContact.id, {
        id: aiMessageId,
        sender: 'npc',
        text: aiText,
        timestamp: aiMessage.timestamp,
      });
      addMessageToState(aiMessage);

      // ゲームオーバー対象NPCかどうかをチェック
      const currentNPC = npcs.find(npc => npc.id === selectedContact.id);
      if (currentNPC?.isGameOverTarget) {
        // 警戒度の閾値チェック
        if (aiResponse.newCaution >= CAUTION_GAME_OVER_THRESHOLD) {
          setTimeout(() => {
            triggerGameOver('social-relationship', `ターゲットに完全に警戒され、これ以上の情報収集が不可能になりました。`)
          }, 3000);
          return;
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);

      // エラーメッセージをFirestoreから取得
      const errorType = error instanceof Error ? error.message as SocialErrorType : 'general';
      const errorMessages = await getErrorMessage(selectedContact.id);
      const customErrorText = errorMessages?.[errorType];

      // Firestoreからの取得に失敗した場合は固定フォールバックメッセージを使用
      const errorText = customErrorText || "通信エラーが発生しました。しばらく待ってから再試行してください。";

      const errorTimestamp = new Date();
      const errorMessage: UISocialDMMessage = {
        id: generateTimestampId(errorTimestamp),
        sender: 'other',
        text: errorText,
        time: errorTimestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        timestamp: errorTimestamp,
      };

      // NPCエラーメッセージを保存・表示
      await addSocialMessage(activeAccount.id, selectedContact.id, {
        id: errorMessage.id,
        sender: 'npc',
        text: errorText,
        timestamp: errorMessage.timestamp,
      });
      addMessageToState(errorMessage);

    } finally {
      setIsWaitingForAI(false);
    }
  }, [user, activeAccount, selectedContact, messages, store, isWaitingForAI, npcs, triggerGameOver]);

  // 初期データ読み込み
  useEffect(() => {
    loadNPCs();
  }, [loadNPCs]);

  useEffect(() => {
    if (user && activeAccount) {
      // アカウント切り替え時にキャッシュを切り替え（削除ではない）
      loadContacts();
    }
  }, [user, activeAccount, loadContacts]);

  // SocialApp初期化：デフォルトアカウント作成後に初期タイムライン表示
  useEffect(() => {
    if (user && npcs.length > 0 && !npcsLoading) {
      const initializeSocialApp = async () => {
        try {
          console.log('Initializing Social App - User timeline...');
          // 初期タイムライン表示
          loadInitialTimeline();
        } catch (error) {
          console.error('Failed to initialize Social App:', error);
        }
      };

      initializeSocialApp();
    }
  }, [user, npcs, npcsLoading, loadInitialTimeline]);

  useEffect(() => {
    if (selectedContact) {
      loadInitialMessages(selectedContact.id);
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
      // NPCリストから検索
      const npc = npcs.find(n => n.id === npcId);
      if (npc) {
        return npc;
      }

      // サーバーから取得
      const fetchedNPC = await getSocialNPC(npcId);
      return fetchedNPC;
    } catch (error) {
      console.error('Failed to get NPC profile:', error);
      return null;
    }
  }, [npcs]);

  /**
   * キャッシュ付きでソーシャルアカウントリストを取得
   */
  const loadSocialAccounts = useCallback(async (): Promise<SocialAccount[]> => {
    try {
      // ストアから読み込み
      const cached = store.accounts;
      if (cached) {
        return cached.accounts;
      }

      // サーバーから取得（認証済みユーザーのアカウントのみ）
      const accounts = await getSocialAccounts();
      store.setAccounts(accounts);
      return accounts;
    } catch (error) {
      console.error('Failed to load social accounts:', error);
      throw error;
    }
  }, [store]);


  /**
   * 投稿を検索（段階的にタイムラインを拡張）
   */
  const searchPosts = useCallback(async (
    query: string,
    targetLimit: number = SOCIAL_POSTS_PER_PAGE
  ): Promise<UISocialPost[]> => {
    if (!query.trim()) return [];

    const searchQuery = query.toLowerCase();

    // タイムラインが空の場合は初期読み込みを実行
    if (posts.length === 0 && !postsLoading) {
      await loadInitialTimeline();

      // 状態が非同期更新されるため、storeから直接取得
      const updatedPosts = store.timeline?.posts || [];

      // 即座に検索を実行するために更新された投稿を使用
      if (updatedPosts.length > 0) {
        const immediateMatches = updatedPosts.filter(post =>
          post.content.toLowerCase().includes(searchQuery)
        );
        return immediateMatches.slice(0, targetLimit);
      }
    }

    const matches: UISocialPost[] = [];
    let attempts = 0;
    const maxAttempts = 5; // 無限ループを防止

    // 最初に現在の投稿から検索を実行
    if (posts.length > 0) {
      const currentMatches = posts.filter(post =>
        post.content.toLowerCase().includes(searchQuery)
      );
      matches.push(...currentMatches);
    }

    // 追加投稿の読み込みが可能な場合のみループ実行
    while (matches.length < targetLimit && hasMorePosts && attempts < maxAttempts) {
      // 現在のタイムラインから検索
      const currentMatches = posts.filter(post =>
        post.content.toLowerCase().includes(searchQuery)
      );

      // 新しく見つかったマッチを追加（重複除外）
      const newMatches = currentMatches.filter(match =>
        !matches.find(existing => existing.id === match.id)
      );
      matches.push(...newMatches);

      // 十分な結果が得られた場合は終了
      if (matches.length >= targetLimit) {
        break;
      }

      // まだ足りない場合は、より多くのポストを読み込み
      if (hasMorePosts) {
        await loadMorePosts();
        attempts++;
      } else {
        break;
      }
    }

    return matches.slice(0, targetLimit);
  }, [posts, hasMorePosts, loadMorePosts, postsLoading, loadInitialTimeline, store]);

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
    isWaitingForAI,

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

    // 検索
    searchPosts,

    // リフレッシュ
    refreshTimeline,
    refreshContacts: loadContacts,
  };
};