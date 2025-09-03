'use client';

import React, { useState, useRef, useEffect, useCallback, UIEvent } from 'react';
import { AppProps } from '@/types/app';
import { BaseApp } from '@/components/BaseApp';
import { Send } from 'lucide-react';
import { addMessage, generateAIResponse } from '@/actions/messenger';
import { useAuthContext } from '@/providers/AuthProvider';
import { useMessenger } from '@/hooks/useMessenger';
import { UIMessage, ErrorType, selectErrorMessage } from '@/types/messenger';

function generateSecureId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

export const MessengerApp: React.FC<AppProps> = ({ windowId, isActive }) => {
  const { user } = useAuthContext();

  const {
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
  } = useMessenger();

  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const isScrolledToBottomRef = useRef(true);

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() || !selectedContact || !user || inputText.trim().length > 500) return;

    const currentInput = inputText;
    const messageId = generateSecureId();
    const userMessage: UIMessage = {
      id: messageId,
      sender: 'me',
      text: currentInput,
      time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
      timestamp: new Date(),
    };

    setInputText('');
    addMessageToState(userMessage);

    try {
      await addMessage(selectedContact.id, {
        id: messageId,
        sender: 'user',
        text: currentInput,
        timestamp: userMessage.timestamp,
      });

      const aiText = await generateAIResponse(currentInput, [], selectedContact.type); // chatHistoryは別途実装

      const aiMessageId = generateSecureId();
      const aiMessage: UIMessage = {
        id: aiMessageId,
        sender: 'other',
        text: aiText,
        time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date(),
      };

      await addMessage(selectedContact.id, {
        id: aiMessageId,
        sender: 'npc',
        text: aiText,
        timestamp: aiMessage.timestamp,
      });
      addMessageToState(aiMessage);

    } catch (error) {
      removeMessageFromState(messageId);
      setInputText(currentInput);

      const errorType = error instanceof Error ? error.message as ErrorType : 'general';
      const errorText = selectErrorMessage(errorType, selectedContact.type);

      const errorMessage: UIMessage = {
        id: generateSecureId(),
        sender: 'other',
        text: errorText,
        time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date(),
      };
      addMessageToState(errorMessage);
    }
  }, [inputText, selectedContact, user, addMessageToState, removeMessageFromState]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollTop < 50 && hasMore && !isLoadingMore) {
      loadMoreMessages();
    }
    isScrolledToBottomRef.current = scrollHeight - scrollTop - clientHeight < 50;
  };

  useEffect(() => {
    if (chatAreaRef.current && isScrolledToBottomRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages.length]);

  return (
    <BaseApp windowId={windowId} isActive={isActive} statusBar={selectedContact?.name || 'メッセンジャー'}>
      <div className="flex h-full bg-white">
        <div className="w-72 border-r flex flex-col">
          <div className="p-3 border-b">
            <input type="text" placeholder="検索" className="w-full pl-8 pr-3 py-1.5 border rounded-lg text-sm" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <div className="flex-1 overflow-y-auto">
            {contactsLoading ? <p className="p-3 text-sm text-gray-500">読み込み中...</p> :
              contacts.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(contact => (
                <div key={contact.id} onClick={() => setSelectedContact(contact)} className={`p-3 cursor-pointer ${selectedContact?.id === contact.id ? 'bg-blue-100' : 'hover:bg-gray-50'}`}>
                  <h4 className="font-semibold">{contact.name}</h4>
                </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="p-3 border-b flex items-center justify-between">
            <h3 className="font-semibold">{selectedContact?.name || '連絡先を選択'}</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={chatAreaRef} onScroll={handleScroll}>
            {messagesLoading && <p className="text-center text-sm text-gray-500">メッセージを読み込み中...</p>}
            {isLoadingMore && <p className="text-center text-sm text-gray-500">さらに読み込み中...</p>}
            {messages.map(message => (
              <div key={message.id} className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-md p-3 rounded-lg text-sm ${message.sender === 'me' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                  <p className="whitespace-pre-wrap">{message.text}</p>
                  <p className={`text-xs mt-1 text-right ${message.sender === 'me' ? 'text-blue-200' : 'text-gray-500'}`}>{message.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t">
            <div className="flex items-center space-x-3">
              <input
                type="text"
                placeholder="メッセージを入力..."
                className="flex-1 p-3 border rounded-lg"
                value={inputText}
                onChange={e => setInputText(e.target.value.substring(0, 500))}
                onKeyDown={handleKeyDown}
                disabled={!selectedContact}
                maxLength={500}
              />
              <button onClick={handleSendMessage} disabled={!inputText.trim() || !selectedContact} className="bg-blue-500 text-white p-3 rounded-lg disabled:bg-blue-300">
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </BaseApp>
  );
};