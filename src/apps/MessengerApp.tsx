'use client';

import React, { useState, useRef, useEffect, useCallback, UIEvent } from 'react';
import { AppProps } from '@/types/app';
import { BaseApp } from '@/components/BaseApp';
import { Send } from 'lucide-react';
import { addMessage, generateAIResponse, getContacts, addContact, getIntroductionMessageFromFirestore, getSubmissionQuestions, validateSubmission } from '@/actions/messenger';
import { useAuthContext } from '@/providers/AuthProvider';
import { useMessenger } from '@/hooks/useMessenger';
import { UIMessage, ErrorType, selectErrorMessage, defaultMessengerContacts, ChatMessage, SubmissionQuestion } from '@/types/messenger';
import { appNotifications } from '@/utils/notifications';
import { useGameStore } from '@/store/gameStore';
import { useSubmissionStore } from '@/store/submissionStore';

function generateSecureId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

async function initializeUserContacts(): Promise<void> {
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
}

async function sendIntroductionMessage(): Promise<void> {
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
}

// グローバルな初期化フラグ
let globalInitializationPromise: Promise<boolean> | null = null;

async function initializeMessengerIntroduction(): Promise<boolean> {
  // 既に初期化処理が実行中または完了している場合は、その結果を返す
  if (globalInitializationPromise) {
    return globalInitializationPromise;
  }

  // 初期化処理を開始
  globalInitializationPromise = (async () => {
    try {
      const contacts = await getContacts();
      if (contacts.length > 0) {
        return false; // 既に初期化済み
      }

      console.log('Starting messenger initialization...');

      // 1. デフォルト連絡先をDBに追加
      await initializeUserContacts();

      // 2. 少し遅れてからイントロメッセージを送信
      setTimeout(sendIntroductionMessage, 2000);

      return true;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Messenger initialization failed:', error);
      }
      return false;
    }
  })();

  return globalInitializationPromise;
}

export const MessengerApp: React.FC<AppProps> = ({ windowId, isActive }) => {
  const { user } = useAuthContext();
  const { completeSubmission } = useGameStore();
  const {
    submissionState,
    setSubmissionMode,
    setSubmissionQuestion,
    addSubmissionAnswer,
    setSubmissionResult,
  } = useSubmissionStore();

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
    addTemporaryMessage,
  } = useMessenger();

  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [submissionQuestions, setSubmissionQuestions] = useState<SubmissionQuestion[]>([]);
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const isScrolledToBottomRef = useRef(true);
  const initializationExecuted = useRef(false);

  // メッセンジャーの初期化処理
  useEffect(() => {
    if (!initializationExecuted.current) {
      initializationExecuted.current = true;

      initializeMessengerIntroduction()
        .then((wasInitialized) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('Messenger initialization result:', wasInitialized ? 'initialized' : 'already initialized');
          }
        })
        .catch((error) => {
          if (process.env.NODE_ENV === 'development') {
            console.error('Messenger initialization failed:', error);
          }
        });
    }
  }, []);

  const startSubmissionMode = useCallback(async () => {
    if (!selectedContact || selectedContact.type !== 'darkOrganization') return;

    try {
      const questions = await getSubmissionQuestions('darkOrganization');
      setSubmissionQuestions(questions);
      setSubmissionMode(true);

      const firstQuestion = questions[0];
      if (firstQuestion) {
        const questionMessage: UIMessage = {
          id: generateSecureId(),
          sender: 'other',
          text: firstQuestion.text,
          time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date(),
        };
        addTemporaryMessage(questionMessage);
      }
    } catch {
      const errorMessage: UIMessage = {
        id: generateSecureId(),
        sender: 'other',
        text: 'エラーが発生しました。自動応答モードを開始できません。',
        time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date(),
      };
      addTemporaryMessage(errorMessage);
    }
  }, [selectedContact, setSubmissionMode, addTemporaryMessage]);

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

    // /submit コマンドの検知
    if (currentInput.trim() === '/submit' && selectedContact.type === 'darkOrganization') {
      addTemporaryMessage(userMessage);
      await startSubmissionMode();
      return;
    }

    // 提出モード中の処理
    if (submissionState.isInSubmissionMode && selectedContact.type === 'darkOrganization') {
      addTemporaryMessage(userMessage);
      try {
        addSubmissionAnswer(currentInput);

        if (submissionState.currentQuestion < submissionState.totalQuestions) {
          // 次の質問を表示
          const nextQuestionIndex = submissionState.currentQuestion;
          const nextQuestion = submissionQuestions[nextQuestionIndex];

          if (nextQuestion) {
            setSubmissionQuestion(submissionState.currentQuestion + 1);

            const questionMessage: UIMessage = {
              id: generateSecureId(),
              sender: 'other',
              text: nextQuestion.text,
              time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
              timestamp: new Date(),
            };
            addTemporaryMessage(questionMessage);
          }
        } else {
          // 全ての質問が完了、結果を検証
          const allAnswers = [...submissionState.answers, currentInput];
          const result = await validateSubmission(allAnswers, 'darkOrganization');

          const resultMessage: UIMessage = {
            id: generateSecureId(),
            sender: 'other',
            text: `検証中...`,
            time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date(),
          };
          addTemporaryMessage(resultMessage);

          // 結果をsubmissionStoreに保存
          setSubmissionResult(result);

          // 3秒後にシーン遷移
          setTimeout(() => {
            completeSubmission(result.success);
          }, 3000);
        }
      } catch {
        const errorMessage: UIMessage = {
          id: generateSecureId(),
          sender: 'other',
          text: '提出処理中にエラーが発生しました。',
          time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date(),
        };
        addTemporaryMessage(errorMessage);
      }
      return;
    }

    // 通常のAI応答処理
    addMessageToState(userMessage);
    try {
      await addMessage(selectedContact.id, {
        id: messageId,
        sender: 'user',
        text: currentInput,
        timestamp: userMessage.timestamp,
      });

      const aiText = await generateAIResponse(currentInput, [], selectedContact.type);

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
  }, [inputText, selectedContact, user, submissionState, submissionQuestions, addMessageToState, removeMessageFromState, addTemporaryMessage, startSubmissionMode, addSubmissionAnswer, setSubmissionQuestion, setSubmissionResult, completeSubmission]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.keyCode === 13 && !e.shiftKey) {
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