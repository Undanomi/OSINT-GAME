import React, { useState, useRef, useEffect, useCallback, UIEvent } from 'react';
import { SocialContact, UISocialDMMessage } from '@/types/social';
import { MAX_MESSAGE_LENGTH } from '@/lib/social/constants';
import { ArrowLeft, User, Send } from 'lucide-react';

interface DMChatPageProps {
  contact: SocialContact;
  messages: UISocialDMMessage[];
  onBack: () => void;
  onSendMessage: (text: string) => Promise<void>;
  messagesLoading: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  isWaitingForAI: boolean;
}

/**
 * DMチャットページ
 */
export const DMChatPage: React.FC<DMChatPageProps> = ({
  contact,
  messages,
  onBack,
  onSendMessage,
  messagesLoading,
  isLoadingMore,
  onLoadMore,
  isWaitingForAI
}) => {
  const [inputText, setInputText] = useState('');
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const isScrolledToBottomRef = useRef(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() || isWaitingForAI) return;

    const currentInput = inputText;
    setInputText('');

    try {
      await onSendMessage(currentInput);
    } catch {
      setInputText(currentInput);
    }
  }, [inputText, onSendMessage, isWaitingForAI]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.keyCode === 13 && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.substring(0, MAX_MESSAGE_LENGTH);
    setInputText(value);

    // 高さ自動調整
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = window.innerHeight * 0.25; // アプリ画面の25%（縦幅半分の半分程度）
      textareaRef.current.style.height = Math.min(scrollHeight, maxHeight) + 'px';
    }
  };

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollTop < 50 && !isLoadingMore) {
      onLoadMore();
    }
    isScrolledToBottomRef.current = scrollHeight - scrollTop - clientHeight < 50;
  };

  useEffect(() => {
    if (chatAreaRef.current && isScrolledToBottomRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages.length]);

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center p-4 bg-white border-b">
        <button onClick={onBack} className="mr-3 p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex items-center space-x-3">
          <div className="relative w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            <User size={16} className="text-gray-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{contact.name}</h3>
            <p className="text-xs text-gray-500">オンライン</p>
          </div>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
        ref={chatAreaRef}
        onScroll={handleScroll}
      >
        {messagesLoading && (
          <p className="text-center text-sm text-gray-500">メッセージを読み込み中...</p>
        )}
        {isLoadingMore && (
          <p className="text-center text-sm text-gray-500">さらに読み込み中...</p>
        )}
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-md p-3 rounded-lg shadow-sm text-sm ${
              message.sender === 'me'
                ? 'bg-blue-500 text-white rounded-br-none'
                : 'bg-white text-gray-800 rounded-bl-none'
            }`}>
              <p className="whitespace-pre-wrap">{message.text.replace(/\\n/g, '\n')}</p>
              <p className={`text-xs mt-1 text-right ${
                message.sender === 'me' ? 'text-blue-200' : 'text-gray-500'
              }`}>
                {message.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-shrink-0 p-4 border-t bg-white">
        <div className="flex items-center space-x-3">
          <textarea
            ref={textareaRef}
            placeholder="メッセージを入力..."
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-y-auto"
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            maxLength={MAX_MESSAGE_LENGTH}
            disabled={isWaitingForAI}
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            className="bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
            disabled={!inputText.trim() || isWaitingForAI}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};