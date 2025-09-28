'use client';

import React, { useState, useRef, useEffect, useCallback, UIEvent } from 'react';
import { AppProps } from '@/types/app';
import { BaseApp } from '@/components/BaseApp';
import { Send } from 'lucide-react';
import { addMessage, generateAIResponse, getSubmissionQuestions, validateSubmission, getErrorMessage } from '@/actions/messenger';
import { useAuthContext } from '@/providers/AuthProvider';
import { useMessenger } from '@/hooks/useMessenger';
import { UIMessage, ErrorType, SubmissionQuestion } from '@/types/messenger';
import { useGameStore } from '@/store/gameStore';
import { useSubmissionStore } from '@/store/submissionStore';

/**
 * タイムスタンプベースのメッセージID生成
 */
function generateTimestampId(timestamp: Date): string {
  const timeString = timestamp.toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${timeString}_${randomSuffix}`;
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
    addTemporaryMessage,
  } = useMessenger();

  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isWaitingForAI, setIsWaitingForAI] = useState(false);
  const [submissionQuestions, setSubmissionQuestions] = useState<SubmissionQuestion[]>([]);
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const isScrolledToBottomRef = useRef(true);

  const startSubmissionMode = useCallback(async () => {
    if (!selectedContact || selectedContact.type !== 'darkOrganization') return;

    try {
      const questions = await getSubmissionQuestions('darkOrganization');
      setSubmissionQuestions(questions);
      setSubmissionMode(true);

      const firstQuestion = questions[0];
      if (firstQuestion) {
        const questionTimestamp = new Date();
        const questionMessage: UIMessage = {
          id: generateTimestampId(questionTimestamp),
          sender: 'other',
          text: firstQuestion.text,
          time: questionTimestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
          timestamp: questionTimestamp,
        };
        addTemporaryMessage(questionMessage);
      }
    } catch {
      const errorTimestamp = new Date();
      const errorMessage: UIMessage = {
        id: generateTimestampId(errorTimestamp),
        sender: 'other',
        text: 'エラーが発生しました。自動応答モードを開始できません。',
        time: errorTimestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        timestamp: errorTimestamp,
      };
      addTemporaryMessage(errorMessage);
    }
  }, [selectedContact, setSubmissionMode, addTemporaryMessage]);

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() || !selectedContact || !user || inputText.trim().length > 500 || isWaitingForAI) return;

    const currentInput = inputText;
    const userTimestamp = new Date();
    const messageId = generateTimestampId(userTimestamp);
    const userMessage: UIMessage = {
      id: messageId,
      sender: 'me',
      text: currentInput,
      time: userTimestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
      timestamp: userTimestamp,
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
            const questionTimestamp = new Date();
            const questionMessage: UIMessage = {
              id: generateTimestampId(questionTimestamp),
              sender: 'other',
              text: nextQuestion.text,
              time: questionTimestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
              timestamp: questionTimestamp,
            };
            addTemporaryMessage(questionMessage);
          }
        } else {
          // 全ての質問が完了、結果を検証
          const allAnswers = [...submissionState.answers, currentInput];
          const result = await validateSubmission(allAnswers, 'darkOrganization');
          const validationTimestamp = new Date();
          const resultMessage: UIMessage = {
            id: generateTimestampId(validationTimestamp),
            sender: 'other',
            text: `検証中...`,
            time: validationTimestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
            timestamp: validationTimestamp,
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
        const errorTimestamp = new Date();
        const errorMessage: UIMessage = {
          id: generateTimestampId(errorTimestamp),
          sender: 'other',
          text: '提出処理中にエラーが発生しました。',
          time: errorTimestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
          timestamp: errorTimestamp,
        };
        addTemporaryMessage(errorMessage);
      }
      return;
    }

    // 通常のAI応答処理
    setIsWaitingForAI(true);
    addMessageToState(userMessage);

    try {
      // ユーザーメッセージ保存
      await addMessage(selectedContact.id, {
        id: messageId,
        sender: 'user',
        text: currentInput,
        timestamp: userMessage.timestamp,
      });

      // AI応答生成
      const aiText = await generateAIResponse(currentInput, messages, selectedContact.type);

      const aiTimestamp = new Date();
      const aiMessageId = generateTimestampId(aiTimestamp);
      const aiMessage: UIMessage = {
        id: aiMessageId,
        sender: 'other',
        text: aiText,
        time: aiTimestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        timestamp: aiTimestamp,
      };

      // AI応答保存
      await addMessage(selectedContact.id, {
        id: aiMessageId,
        sender: 'npc',
        text: aiText,
        timestamp: aiMessage.timestamp,
      });
      addMessageToState(aiMessage);

    } catch (error) {
      // エラーメッセージをFirestoreから取得
      const errorType = error instanceof Error ? error.message as ErrorType : 'general';
      const errorMessages = await getErrorMessage(selectedContact.type);
      const customErrorText = errorMessages?.[errorType];

      // Firestoreからの取得に失敗した場合はgeneral固定メッセージを使用
      const errorText = customErrorText || "通信エラーが発生しました。しばらく待ってから再試行してください。";

      const errorTimestamp = new Date();
      const errorMessage: UIMessage = {
        id: generateTimestampId(errorTimestamp),
        sender: 'other',
        text: errorText,
        time: errorTimestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        timestamp: errorTimestamp,
      };

      // NPCエラーメッセージを保存・表示
      await addMessage(selectedContact.id, {
        id: errorMessage.id,
        sender: 'npc',
        text: errorText,
        timestamp: errorMessage.timestamp,
      });
      addMessageToState(errorMessage);

    } finally {
      setIsWaitingForAI(false);
    }
  }, [inputText, selectedContact, user, submissionState, submissionQuestions, addMessageToState, addTemporaryMessage, startSubmissionMode, addSubmissionAnswer, setSubmissionQuestion, setSubmissionResult, completeSubmission, messages, isWaitingForAI]);

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
                disabled={!selectedContact || isWaitingForAI}
                maxLength={500}
              />
              <button onClick={handleSendMessage} disabled={!inputText.trim() || !selectedContact || isWaitingForAI} className="bg-blue-500 text-white p-3 rounded-lg disabled:bg-blue-300">
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </BaseApp>
  );
};