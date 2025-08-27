'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { AppProps } from '@/types/app';
import { BaseApp } from '@/components/BaseApp';
import { User, Phone, Video, MoreVertical, Send, Search } from 'lucide-react';
// ▼ 変更点1: Gemini APIからContent型をインポート
import { GoogleGenerativeAI, Content } from '@google/generative-ai';
import { SYSTEM_PROMPT } from '@/prompts/npcPrompt';

// --- (データ構造の定義は変更ありません) ---
interface Contact {
  id: string;
  name: string;
  status: 'online' | 'offline';
  lastMessage: string;
}
interface Message {
  id: string;
  sender: 'me' | 'other';
  text: string;
  time: string;
}

const sampleContacts: Contact[] = [
  { id: '1', name: '新田 祐樹', status: 'online', lastMessage: '元気？久しぶり！' },
];
const allMessages: { [contactId: string]: Message[] } = {
  '1': [ { id: 'm1-1', sender: 'other', text: '元気？久しぶり！', time: '18:02:15' } ],
};

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-latest",
  systemInstruction: SYSTEM_PROMPT,
});

export const MessengerApp: React.FC<AppProps> = ({ windowId, isActive }) => {
  const [contacts] = useState<Contact[]>(sampleContacts);
  const [selectedContact, setSelectedContact] = useState<Contact>(sampleContacts[0]);
  const [messages, setMessages] = useState<{ [contactId: string]: Message[] }>(allMessages);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [trustLevel, setTrustLevel] = useState(50);
  const [cautionLevel, setCautionLevel] = useState(10);

  const [chatHistory, setChatHistory] = useState<Content[]>([]);

  const filteredContacts = useMemo(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    if (!lowercasedQuery) return contacts;
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(lowercasedQuery)
    );
  }, [contacts, searchQuery]);

  const currentMessages = useMemo(() => messages[selectedContact.id] || [], [messages, selectedContact]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() || !selectedContact) return;

    const userMessage: Message = {
      id: `m${selectedContact.id}-${currentMessages.length + 1}`,
      sender: 'me',
      text: inputText,
      time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    setMessages(prev => ({ ...prev, [selectedContact.id]: [...(prev[selectedContact.id] || []), userMessage] }));
    const currentInput = inputText;
    setInputText('');

    const promptForModel = `
      ### 現在の状態
      * 現在の信頼度: ${trustLevel}
      * 現在の警戒度: ${cautionLevel}

      ### プレイヤーからの入力
      "${currentInput}"
    `;

    try {
      const chat = model.startChat({
        history: chatHistory,
        generationConfig: {
          responseMimeType: "application/json",
        },
      });

      const result = await chat.sendMessage(promptForModel);
      const responseText = result.response.text();

      const responseObject = JSON.parse(responseText);
      const { responseText: aiText, newTrust, newCaution } = responseObject;

      if (typeof aiText !== 'string' || typeof newTrust !== 'number' || typeof newCaution !== 'number') {
        throw new Error('Invalid JSON structure received from API.');
      }

      const aiMessage: Message = {
        id: `m${selectedContact.id}-${currentMessages.length + 2}`,
        sender: 'other',
        text: aiText,
        time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };

      setMessages(prev => ({ ...prev, [selectedContact.id]: [...(prev[selectedContact.id] || []), aiMessage] }));
      setTrustLevel(newTrust);
      setCautionLevel(newCaution);

      // 会話履歴を更新
      setChatHistory(prevHistory => [
        ...prevHistory,
        { role: 'user', parts: [{ text: promptForModel }] },
        { role: 'model', parts: [{ text: responseText }] }
      ]);

    } catch (error) {
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

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);


  useEffect(() => {
    setMessages(allMessages);
    setChatHistory([]);
    setTrustLevel(50);
    setCautionLevel(10);
  }, [selectedContact]);


  const statusBar = selectedContact ? `${selectedContact.name} - ${selectedContact.status === 'online' ? 'オンライン' : 'オフライン'}` : 'メッセージ';
  const toolbar = (
    <div className="flex items-center justify-between p-3 bg-white border-b">
      <div className="flex items-center space-x-3"><div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center"><User size={14} className="text-gray-600" /></div><div><h3 className="font-semibold text-gray-800">{selectedContact.name}</h3><p className="text-xs text-gray-500">{selectedContact.status === 'online' ? 'オンライン' : 'オフライン'}</p></div></div>
      <div className="flex items-center space-x-2"><button className="p-2 hover:bg-gray-100 rounded-lg" title="音声通話"><Phone size={14} className="text-gray-600" /></button><button className="p-2 hover:bg-gray-100 rounded-lg" title="ビデオ通話"><Video size={14} className="text-gray-600" /></button><button className="p-2 hover:bg-gray-100 rounded-lg" title="詳細"><MoreVertical size={14} className="text-gray-600" /></button></div>
    </div>
  );

  return (
    <BaseApp windowId={windowId} isActive={isActive} toolbar={toolbar} statusBar={statusBar}>
      <div className="flex h-full">
        <div className="w-72 border-r border-gray-200 bg-white flex-shrink-0 flex flex-col">
          <div className="p-3 border-b border-gray-200"><div className="relative"><Search size={16} className="absolute left-3 top-1-2 -translate-y-1-2 text-gray-400" /><input type="text" placeholder="連絡先を検索" className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div></div>
          <div className="flex-1 overflow-y-auto">{filteredContacts.map((contact) => (<div key={contact.id} className={`flex items-center space-x-3 p-3 cursor-pointer hover:bg-blue-50 transition-colors ${selectedContact?.id === contact.id ? 'bg-blue-100' : ''}`} onClick={() => setSelectedContact(contact)}><div className="relative w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0"><User size={16} className="text-gray-600" />{contact.status === 'online' && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-white border-2"></span>}</div><div className="flex-1 min-w-0"><h4 className="font-semibold text-gray-800">{contact.name}</h4><p className="text-xs text-gray-500 truncate">{contact.lastMessage}</p></div></div>))}</div>
        </div>

        <div className="flex-1 flex flex-col bg-gray-50">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {currentMessages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-md p-3 rounded-lg shadow-sm text-sm ${message.sender === 'me' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none'}`}>
                  <p className="whitespace-pre-wrap">{message.text}</p>
                  <p className={`text-xs mt-1 text-right ${message.sender === 'me' ? 'text-blue-200' : 'text-gray-500'}`}>{message.time}</p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center space-x-3">
              <input type="text" placeholder="メッセージを入力..." className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={handleKeyDown} />
              <button onClick={handleSendMessage} className="bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300" title="送信" disabled={!inputText.trim()}><Send size={20} /></button>
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