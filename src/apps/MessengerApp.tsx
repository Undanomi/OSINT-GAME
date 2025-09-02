'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { AppProps } from '@/types/app';
import { BaseApp } from '@/components/BaseApp';
import { User, Phone, Video, MoreVertical, Send, Search } from 'lucide-react';
import { Content } from '@google/generative-ai';
import { useWindowStore } from '@/store/windowStore';
import { appNotifications } from '@/utils/notifications';
import { getChatHistory, addMessage, ChatMessage, generateAIResponse } from '@/actions/messenger';
import { useAuthContext } from '@/providers/AuthProvider';
import { useMessengerContacts } from '@/hooks/useMessengerContacts';
import { MessengerContactDocument } from '@/types/messenger';

// セキュアなID生成関数
function generateSecureId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * メッセンジャー連絡先の情報を表すインターフェース（UI用の拡張）
 * @interface MessengerContact
 */
interface MessengerContact extends MessengerContactDocument {
  /** 最後に受信したメッセージ */
  lastMessage: string;
  /** 未読メッセージ数 */
  unreadCount: number;
}

/**
 * チャットメッセージを表すインターフェース
 * @interface Message
 */
interface Message {
  id: string;
  sender: 'me' | 'other';
  text: string;
  time: string;
}

/** デフォルトメッセンジャー連絡先データ - Firestore取得前の初期状態 */
const defaultMessengerContact: MessengerContact = {
  id: 'dark_organization',
  name: '闇の組織',
  type: 'darkOrganization',
  lastMessage: 'メッセージを待っています...',
  unreadCount: 0
};

/** 全メッセージデータ - メッセンジャー連絡先IDをキーとするメッセージ配列のマップ */
const allMessengerMessages: { [contactId: string]: Message[] } = {
  'dark_organization': [], // 初期状態では空のメッセージ配列
};


/**
 * メッセンジャーアプリケーションコンポーネント
 *
 * OSINTゲーム内で使用されるメッセンジャーアプリケーション。
 * NPCとの対話機能を持ち、AI（Gemini）を使用してリアルな会話を生成する。
 *
 * @component
 * @param {AppProps} props - アプリケーションのプロパティ
 * @param {string} props.windowId - ウィンドウの一意識別子
 * @param {boolean} props.isActive - ウィンドウがアクティブかどうか
 * @returns {JSX.Element} メッセンジャーアプリケーションUI
 */
export const MessengerApp: React.FC<AppProps> = ({ windowId, isActive }) => {
  const { user } = useAuthContext();
  const { contacts: firestoreContacts, loading: contactsLoading } = useMessengerContacts();

  // メッセンジャー連絡先リスト（未読カウントも含む）
  const [contacts, setContacts] = useState<MessengerContact[]>([defaultMessengerContact]);

  // 現在選択されているメッセンジャー連絡先
  const [selectedContact, setSelectedContact] = useState<MessengerContact>(defaultMessengerContact);

  // 全てのメッセンジャー連絡先のメッセージデータ
  const [messages, setMessages] = useState<{ [contactId: string]: Message[] }>(allMessengerMessages);


  // メッセージ入力フィールドのテキスト
  const [inputText, setInputText] = useState('');

  // 連絡先検索用のクエリ
  const [searchQuery, setSearchQuery] = useState('');

  // チャット末尾へのスクロール用参照
  const chatEndRef = useRef<HTMLDivElement>(null);

  // AI チャット履歴（Gemini APIとの会話コンテキスト）
  const [chatHistory, setChatHistory] = useState<Content[]>([]);


  // NPCがメッセージを入力中かどうかのフラグ
  const [isNpcTyping, setIsNpcTyping] = useState(false);

  // ウィンドウ状態管理
  const { activeWindowId } = useWindowStore();

  /**
   * MessengerAppがアクティブかどうかを判定する
   *
   * @returns {boolean} Messengerアプリがアクティブかどうか
   */
  const isMessengerActive = useMemo(() => {
    return activeWindowId === windowId;
  }, [activeWindowId, windowId]);

  /**
   * 特定の連絡先との会話が現在表示されているかどうかを判定する
   *
   * @param {string} contactId - 連絡先ID
   * @returns {boolean} その連絡先の会話が表示されているかどうか
   */
  const isContactActive = useCallback((contactId: string) => {
    return isMessengerActive && selectedContact.id === contactId;
  }, [isMessengerActive, selectedContact.id]);

  /**
   * 未読メッセージ数を更新する
   *
   * @param {string} contactId - 連絡先ID
   * @param {number} count - 未読数の変更量（正数で増加、負数で減少）
   */
  const updateUnreadCount = useCallback((contactId: string, count: number) => {
    setContacts(prevContacts =>
      prevContacts.map(contact =>
        contact.id === contactId
          ? { ...contact, unreadCount: Math.max(0, contact.unreadCount + count) }
          : contact
      )
    );
  }, []);

  /**
   * 特定の連絡先の未読メッセージをすべて既読にする
   *
   * @param {string} contactId - 連絡先ID
   */
  const markAllAsRead = useCallback((contactId: string) => {
    setContacts(prevContacts =>
      prevContacts.map(contact =>
        contact.id === contactId
          ? { ...contact, unreadCount: 0 }
          : contact
      )
    );
  }, []);

  /**
   * 新着メッセージの通知を送信する
   *
   * @param {string} contactId - 送信者の連絡先ID
   * @param {string} senderName - 送信者名
   * @param {string} messageText - メッセージ内容
   */
  const sendNotification = useCallback((contactId: string, senderName: string, messageText: string) => {
    // 該当する会話がアクティブでない場合のみ通知を送信
    if (!isContactActive(contactId)) {
      const previewText = messageText.length > 50
        ? messageText.substring(0, 50) + '...'
        : messageText;

      appNotifications.fromApp(
        'messenger',
        `${senderName}からの新着メッセージ`,
        previewText,
        'info',
        5000
      );
    }
  }, [isContactActive]);

  /**
   * Firestoreからチャット履歴を読み込む関数
   */
  const loadChatHistory = useCallback(async () => {
    if (!user) {
      console.warn('ログインが必要です');
      return;
    }

    try {
      const history = await getChatHistory();
      if (history && history.messages.length > 0) {
        // Firestoreの形式からUI用の形式に変換
        const uiMessages = history.messages.map((msg: ChatMessage) => ({
          id: msg.id,
          sender: msg.sender === 'user' ? 'me' as const : 'other' as const,
          text: msg.text,
          time: msg.timestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        }));

        setMessages(prev => ({
          ...prev,
          [selectedContact.id]: uiMessages
        }));

        // 最新メッセージを連絡先に反映
        const lastMessage = history.messages[history.messages.length - 1];
        setContacts(prevContacts =>
          prevContacts.map(contact =>
            contact.id === selectedContact.id
              ? { ...contact, lastMessage: lastMessage.text }
              : contact
          )
        );

      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  }, [selectedContact, user]);


  /**
   * 検索クエリに基づいて連絡先をフィルタリングする
   *
   * @returns {Contact[]} フィルタリングされた連絡先リスト
   */
  const filteredContacts = useMemo(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    // 検索クエリが空の場合は全ての連絡先を返す
    if (!lowercasedQuery) return contacts;
    // 連絡先名に検索クエリが含まれるものをフィルタリング
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(lowercasedQuery)
    );
  }, [contacts, searchQuery]);

  /**
   * 現在選択されている連絡先のメッセージを取得する
   *
   * @returns {Message[]} 現在選択中の連絡先のメッセージリスト
   */
  const currentMessages = useMemo(() => messages[selectedContact.id] || [], [messages, selectedContact]);

  /**
   * 新しいメッセージが追加されたときやタイピング状態が変わったときにチャットを最下部へスクロールする
   */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, isNpcTyping]);


  /**
   * メッセージ送信を処理する関数
   *
   * ユーザーのメッセージを送信し、サーバーサイドでAI応答を取得する。
   */
  const handleSendMessage = useCallback(async () => {
    // 入力テキストが空または連絡先が未選択の場合は処理を中断
    if (!inputText.trim() || !selectedContact) return;

    // ユーザーメッセージオブジェクトを作成（セキュアなID生成）
    const messageId = generateSecureId();
    const userMessage: Message = {
      id: messageId,
      sender: 'me',
      text: inputText,
      time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    const currentInput = inputText;
    setInputText(''); // 入力フィールドを先にクリア

    if (!user) {
      console.warn('ログインが必要です');
      setInputText(currentInput); // 入力を復元
      return;
    }

    try {

      // Firestoreに保存するためのChatMessage形式に変換してユーザーメッセージを保存
      const userChatMessage: ChatMessage = {
        id: messageId,
        sender: 'user',
        text: currentInput,
        timestamp: new Date()
      };
      await addMessage(userChatMessage);

      // DB保存成功後にUIに反映
      setMessages(prev => ({ ...prev, [selectedContact.id]: [...(prev[selectedContact.id] || []), userMessage] }));

      setIsNpcTyping(true);

      // サーバーサイドでAI応答を生成（セキュアなAPI実行）
      const aiText = await generateAIResponse(currentInput, chatHistory, selectedContact.type);

      // AIからの応答メッセージオブジェクトを作成（セキュアなID生成）
      const aiMessageId = generateSecureId();
      const aiMessage: Message = {
        id: aiMessageId,
        sender: 'other',
        text: aiText,
        time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };

      // Firestoreに保存するためのChatMessage形式に変換してAIメッセージを保存
      const aiChatMessage: ChatMessage = {
        id: aiMessageId,
        sender: 'npc',
        npcId: selectedContact.id,
        text: aiText,
        timestamp: new Date()
      };
      await addMessage(aiChatMessage);

      // DB保存成功後にUIを更新
      setMessages(prev => ({ ...prev, [selectedContact.id]: [...(prev[selectedContact.id] || []), aiMessage] }));

      // 連絡先の最新メッセージを更新
      setContacts(prevContacts =>
        prevContacts.map(contact =>
          contact.id === selectedContact.id
            ? { ...contact, lastMessage: aiText }
            : contact
        )
      );

      // 未読カウントと通知の処理
      if (!isContactActive(selectedContact.id)) {
        // 会話がアクティブでない場合、未読カウントを増やして通知を送信
        updateUnreadCount(selectedContact.id, 1);
        sendNotification(selectedContact.id, selectedContact.name, aiText);
      }

      // チャット履歴を更新（次回の会話コンテキスト用）
      // メモリリーク防止のため履歴を制限
      setChatHistory(prevHistory => {
        const newHistory = [
          ...prevHistory,
          { role: 'user', parts: [{ text: `プレイヤーからの入力: ${currentInput}` }] },
          { role: 'model', parts: [{ text: aiText }] }
        ];
        // 履歴が20件を超えた場合、古いものを削除
        return newHistory.length > 20 ? newHistory.slice(-20) : newHistory;
      });

    } catch (error) {
      // エラーハンドリング：統一されたエラー処理
      console.error("Message handling failed:", error);

      // ユーザーメッセージがDB保存に失敗した場合はUIからも削除
      if (error instanceof Error && error.message.includes('メッセージの追加に失敗')) {
        // UIからユーザーメッセージを削除してロールバック
        setMessages(prev => ({
          ...prev,
          [selectedContact.id]: prev[selectedContact.id]?.filter(msg => msg.id !== messageId) || []
        }));
        // 入力フィールドを復元
        setInputText(currentInput);
        return;
      }

      // AI応答エラーの場合は連絡先固有のエラーメッセージを表示
      const errorText = error instanceof Error
        ? error.message  // 連絡先タイプに応じたエラーメッセージ
        : 'エラーが発生しました。';

      const errorMessageId = generateSecureId();
      const errorMessage: Message = {
        id: errorMessageId,
        sender: 'other',
        text: errorText,
        time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };

      // Firestoreにエラーメッセージを保存
      try {
        const errorChatMessage: ChatMessage = {
          id: errorMessageId,
          sender: 'npc',
          npcId: selectedContact.id,
          text: errorText,
          timestamp: new Date()
        };
        await addMessage(errorChatMessage);

        // DB保存成功後にUIを更新
        setMessages(prev => ({ ...prev, [selectedContact.id]: [...(prev[selectedContact.id] || []), errorMessage] }));

        // エラーメッセージも最新メッセージとして更新
        setContacts(prevContacts =>
          prevContacts.map(contact =>
            contact.id === selectedContact.id
              ? { ...contact, lastMessage: errorText }
              : contact
          )
        );
      } catch (saveError) {
        console.error('Failed to save error message:', saveError);
        // エラーメッセージの保存も失敗した場合はUIのみ更新
        setMessages(prev => ({ ...prev, [selectedContact.id]: [...(prev[selectedContact.id] || []), errorMessage] }));
      }

      // エラーメッセージでも未読カウントと通知の処理
      if (!isContactActive(selectedContact.id)) {
        updateUnreadCount(selectedContact.id, 1);
        sendNotification(selectedContact.id, selectedContact.name, errorText);
      }
    } finally {
      setIsNpcTyping(false);
    }

  }, [inputText, selectedContact, chatHistory, isContactActive, updateUnreadCount, sendNotification, user]);

  /**
   * キーボード入力イベントを処理する関数
   *
   * Enterキー押下時にメッセージを送信する（Shift+Enterは改行）
   *
   * @param {React.KeyboardEvent<HTMLInputElement>} e - キーボードイベント
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  /**
   * Firestore連絡先データが読み込まれた時の初期化処理
   */
  useEffect(() => {
    if (!contactsLoading && firestoreContacts.length > 0) {
      // Firestoreのメッセンジャー連絡先データをUI用の形式に変換
      const uiContacts: MessengerContact[] = firestoreContacts.map(contact => ({
        ...contact,
        lastMessage: 'メッセージを待っています...',
        unreadCount: 0
      }));

      setContacts(uiContacts);

      // 選択中の連絡先が存在しない場合は最初の連絡先を選択
      const currentSelectedExists = uiContacts.find(c => c.id === selectedContact.id);
      if (!currentSelectedExists && uiContacts.length > 0) {
        setSelectedContact(uiContacts[0]);
      }
    }
  }, [firestoreContacts, contactsLoading, selectedContact.id]);

  /**
   * 選択された連絡先が変更されたときの初期化処理
   *
   * チャット履歴をリセットし、新しく選択された連絡先の未読メッセージを既読にする
   */
  useEffect(() => {
    setChatHistory([]);

    // Firestoreからチャット履歴を読み込み
    loadChatHistory();

    // 選択された連絡先の未読メッセージを既読にする
    markAllAsRead(selectedContact.id);
  }, [selectedContact, markAllAsRead, loadChatHistory]);  /**
   * ウィンドウがアクティブになった時に、選択中の連絡先の未読をクリアする
   */
  useEffect(() => {
    if (isMessengerActive && selectedContact) {
      markAllAsRead(selectedContact.id);
    }
  }, [isMessengerActive, selectedContact, markAllAsRead]);



  // ステータスバーの表示テキストを生成
  const statusBar = selectedContact ? selectedContact.name : 'メッセージ';

  // ツールバーコンポーネントの定義（連絡先情報と操作ボタン）
  const toolbar = (
    <div className="flex items-center justify-between p-3 bg-white border-b">
      {/* 連絡先情報エリア */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
          <User size={14} className="text-gray-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">{selectedContact.name}</h3>
        </div>
      </div>
      {/* 操作ボタンエリア */}
      <div className="flex items-center space-x-2">
        <button className="p-2 hover:bg-gray-100 rounded-lg" title="音声通話">
          <Phone size={14} className="text-gray-600" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-lg" title="ビデオ通話">
          <Video size={14} className="text-gray-600" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-lg" title="詳細">
          <MoreVertical size={14} className="text-gray-600" />
        </button>
      </div>
    </div>
  );

  return (
    <BaseApp windowId={windowId} isActive={isActive} toolbar={toolbar} statusBar={statusBar}>
      <div className="flex h-full">
        {/* 左側サイドバー：連絡先リスト */}
        <div className="w-72 border-r border-gray-200 bg-white flex-shrink-0 flex flex-col">
          {/* 連絡先検索エリア */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1-2 -translate-y-1-2 text-gray-400" />
              <input
                type="text"
                placeholder="連絡先を検索"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          {/* 連絡先リスト表示エリア */}
          <div className="flex-1 overflow-y-auto">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className={`flex items-center space-x-3 p-3 cursor-pointer hover:bg-blue-50 transition-colors ${selectedContact?.id === contact.id ? 'bg-blue-100' : ''}`}
                onClick={() => {
                  setSelectedContact(contact);
                  // 選択時に未読メッセージを既読にする
                  markAllAsRead(contact.id);
                }}
              >
                {/* 連絡先アバター */}
                <div className="relative w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                  <User size={16} className="text-gray-600" />
                </div>
                {/* 連絡先名と最新メッセージプレビュー */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-800">{contact.name}</h4>
                    {/* 未読メッセージカウント */}
                    {contact.unreadCount > 0 && (
                      <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ml-2 flex-shrink-0">
                        {contact.unreadCount > 99 ? '99+' : contact.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{contact.lastMessage}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右側メインエリア：チャット表示・入力 */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {/* メッセージ表示エリア */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {currentMessages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-md p-3 rounded-lg shadow-sm text-sm ${
                  message.sender === 'me'
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-white text-gray-800 rounded-bl-none'
                }`}>
                  <p className="whitespace-pre-wrap">{message.text}</p>
                  <p className={`text-xs mt-1 text-right ${
                    message.sender === 'me' ? 'text-blue-200' : 'text-gray-500'
                  }`}>
                    {message.time}
                  </p>
                </div>
              </div>
            ))}

            {/* NPCタイピングインジケーター */}
            {isNpcTyping && (
              <div className="flex justify-start">
                <div className="max-w-md p-3 rounded-lg shadow-sm text-sm bg-white text-gray-800 rounded-bl-none">
                  <div className="flex items-center space-x-1">
                    <span className="text-gray-500">{selectedContact.name}が入力中</span>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 自動スクロール用の参照要素 */}
            <div ref={chatEndRef} />
          </div>

          {/* メッセージ入力エリア */}
          <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center space-x-3">
              <input
                type="text"
                placeholder="メッセージを入力..."
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                onClick={handleSendMessage}
                className="bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300"
                title="送信"
                disabled={!inputText.trim()}
              >
                <Send size={20} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Enterで送信
            </p>
          </div>
        </div>
      </div>
    </BaseApp>
  );
};