'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { AppProps } from '@/types/app';
import { BaseApp } from '@/components/BaseApp';
import { User, Phone, Video, MoreVertical, Send, Search } from 'lucide-react';
import { GoogleGenerativeAI, Content } from '@google/generative-ai';
import { SYSTEM_PROMPT } from '@/prompts/npcPrompt';

/**
 * 連絡先の情報を表すインターフェース
 * @interface Contact
 */
interface Contact {
  /** 連絡先の一意識別子 */
  id: string;
  /** 連絡先の表示名 */
  name: string;
  /** オンライン/オフライン状態 */
  status: 'online' | 'offline';
  /** 最後に受信したメッセージ */
  lastMessage: string;
}

/**
 * チャットメッセージを表すインターフェース
 * @interface Message
 */
interface Message {
  /** メッセージの一意識別子 */
  id: string;
  /** 送信者（自分または相手） */
  sender: 'me' | 'other';
  /** メッセージの内容 */
  text: string;
  /** メッセージの送信時刻 */
  time: string;
}

/** サンプル連絡先データ - デモンストレーション用の初期データ */
const sampleContacts: Contact[] = [
  { id: '1', name: '新田 祐樹', status: 'online', lastMessage: '元気？久しぶり！' },
];

/** 全メッセージデータ - 連絡先IDをキーとするメッセージ配列のマップ */
const allMessages: { [contactId: string]: Message[] } = {
  '1': [ { id: 'm1-1', sender: 'other', text: '元気？久しぶり！', time: '18:02:15' } ],
};

/** Google Generative AI インスタンス - Gemini APIクライアント */
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

/**
 * Gemini AI モデルの設定
 * gemini-1.5-flash-latest モデルを使用し、NPCの応答生成用システム指示を設定
 */
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-latest",
  systemInstruction: SYSTEM_PROMPT,
});

/**
 * メッセンジャーアプリケーションコンポーネント
 * 
 * OSINTゲーム内で使用されるメッセンジャーアプリケーション。
 * NPCとの対話機能を持ち、AI（Gemini）を使用してリアルな会話を生成する。
 * 信頼度と警戒度システムを通じて、プレイヤーの行動に応じた反応を示す。
 * 
 * @component
 * @param {AppProps} props - アプリケーションのプロパティ
 * @param {string} props.windowId - ウィンドウの一意識別子
 * @param {boolean} props.isActive - ウィンドウがアクティブかどうか
 * @returns {JSX.Element} メッセンジャーアプリケーションUI
 */
export const MessengerApp: React.FC<AppProps> = ({ windowId, isActive }) => {
  // 連絡先リスト（現在は固定データ）
  const [contacts] = useState<Contact[]>(sampleContacts);
  
  // 現在選択されている連絡先
  const [selectedContact, setSelectedContact] = useState<Contact>(sampleContacts[0]);
  
  // 全ての連絡先のメッセージデータ
  const [messages, setMessages] = useState<{ [contactId: string]: Message[] }>(allMessages);
  
  // メッセージ入力フィールドのテキスト
  const [inputText, setInputText] = useState('');
  
  // 連絡先検索用のクエリ
  const [searchQuery, setSearchQuery] = useState('');
  
  // チャット末尾へのスクロール用参照
  const chatEndRef = useRef<HTMLDivElement>(null);

  // NPCの信頼度レベル（0-100）
  const [trustLevel, setTrustLevel] = useState(50);
  
  // NPCの警戒度レベル（0-100）
  const [cautionLevel, setCautionLevel] = useState(10);

  // AI チャット履歴（Gemini APIとの会話コンテキスト）
  const [chatHistory, setChatHistory] = useState<Content[]>([]);

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
   * 新しいメッセージが追加されたときにチャットを最下部へスクロールする
   */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  /**
   * メッセージ送信を処理する関数
   * 
   * ユーザーのメッセージを送信し、Gemini AIからの応答を取得する。
   * 信頼度と警戒度のパラメータも更新される。
   */
  const handleSendMessage = useCallback(async () => {
    // 入力テキストが空または連絡先が未選択の場合は処理を中断
    if (!inputText.trim() || !selectedContact) return;

    // ユーザーメッセージオブジェクトを作成
    const userMessage: Message = {
      id: `m${selectedContact.id}-${currentMessages.length + 1}`,
      sender: 'me',
      text: inputText,
      time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    // ユーザーメッセージをメッセージリストに追加
    setMessages(prev => ({ ...prev, [selectedContact.id]: [...(prev[selectedContact.id] || []), userMessage] }));
    const currentInput = inputText;
    setInputText(''); // 入力フィールドをクリア

    // AIモデル用のプロンプトを構築（現在の信頼度・警戒度を含む）
    const promptForModel = `
      ### 現在の状態
      * 現在の信頼度: ${trustLevel}
      * 現在の警戒度: ${cautionLevel}

      ### プレイヤーからの入力
      "${currentInput}"
    `;

    try {
      // Geminiモデルとのチャットセッションを開始
      const chat = model.startChat({
        history: chatHistory, // 過去の会話履歴を含める
        generationConfig: {
          responseMimeType: "application/json", // JSON形式での応答を要求
        },
      });

      // プロンプトを送信してAI応答を取得
      const result = await chat.sendMessage(promptForModel);
      const responseText = result.response.text();

      // JSON応答をパースして必要なデータを抽出
      const responseObject = JSON.parse(responseText);
      const { responseText: aiText, newTrust, newCaution } = responseObject;

      // レスポンスの型チェック
      if (typeof aiText !== 'string' || typeof newTrust !== 'number' || typeof newCaution !== 'number') {
        throw new Error('Invalid JSON structure received from API.');
      }

      // AIからの応答メッセージオブジェクトを作成
      const aiMessage: Message = {
        id: `m${selectedContact.id}-${currentMessages.length + 2}`,
        sender: 'other',
        text: aiText,
        time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };

      // AIメッセージをメッセージリストに追加
      setMessages(prev => ({ ...prev, [selectedContact.id]: [...(prev[selectedContact.id] || []), aiMessage] }));
      
      // 信頼度と警戒度を更新
      setTrustLevel(newTrust);
      setCautionLevel(newCaution);

      // チャット履歴を更新（次回の会話コンテキスト用）
      setChatHistory(prevHistory => [
        ...prevHistory,
        { role: 'user', parts: [{ text: promptForModel }] },
        { role: 'model', parts: [{ text: responseText }] }
      ]);

    } catch (error) {
      // エラーハンドリング：API呼び出しまたはJSONパース失敗時
      console.error("API call or JSON parsing failed:", error);
      const errorMessage: Message = {
        id: `m${selectedContact.id}-${currentMessages.length + 2}`,
        sender: 'other',
        text: 'エラーが発生しました。応答を生成できませんでした。',
        time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      setMessages(prev => ({ ...prev, [selectedContact.id]: [...(prev[selectedContact.id] || []), errorMessage] }));
    }

  }, [inputText, selectedContact, currentMessages, trustLevel, cautionLevel, chatHistory]);

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
   * 選択された連絡先が変更されたときの初期化処理
   * 
   * メッセージデータ、チャット履歴、信頼度・警戒度をリセットする
   */
  useEffect(() => {
    setMessages(allMessages);
    setChatHistory([]);
    setTrustLevel(50);
    setCautionLevel(10);
  }, [selectedContact]);


  // ステータスバーの表示テキストを生成
  const statusBar = selectedContact ? `${selectedContact.name} - ${selectedContact.status === 'online' ? 'オンライン' : 'オフライン'}` : 'メッセージ';
  
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
          <p className="text-xs text-gray-500">{selectedContact.status === 'online' ? 'オンライン' : 'オフライン'}</p>
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
                onClick={() => setSelectedContact(contact)}
              >
                {/* 連絡先アバターとオンライン状態インジケーター */}
                <div className="relative w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                  <User size={16} className="text-gray-600" />
                  {contact.status === 'online' && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-white border-2"></span>
                  )}
                </div>
                {/* 連絡先名と最新メッセージプレビュー */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-800">{contact.name}</h4>
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