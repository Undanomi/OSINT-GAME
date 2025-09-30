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
    selectedContact,
    messages,
    messagesLoading,
    isLoadingMore,
    hasMore,
    loadMoreMessages,
    addMessageToState,
    addTemporaryMessage,
  } = useMessenger();

  const [inputText, setInputText] = useState('');
  const [isWaitingForAI, setIsWaitingForAI] = useState(false);
  const [submissionQuestions, setSubmissionQuestions] = useState<SubmissionQuestion[]>([]);
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const isScrolledToBottomRef = useRef(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
          isSubmissionMessage: true,
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

    // textareaの高さをリセット
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

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
              isSubmissionMessage: true,
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
            isSubmissionMessage: true,
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.keyCode === 13 && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.substring(0, 500);
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
      <div className="flex h-full bg-[#2a2d35]">
        <div className="flex-1 flex flex-col">
          <div className="p-4 bg-[#2a2d35] flex items-center justify-between shadow-lg">
            <h3 className="font-medium text-blue-400">{selectedContact?.name || '暗号化通信'}</h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#1c1f26]" ref={chatAreaRef} onScroll={handleScroll}>
            {messagesLoading && <p className="text-center text-sm text-gray-500">メッセージを読み込み中...</p>}
            {isLoadingMore && <p className="text-center text-sm text-gray-500">さらに読み込み中...</p>}
            {messages.map(message => (
              <div key={message.id} className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                  message.isSubmissionMessage
                    ? 'bg-slate-800/90 text-slate-300 shadow-lg border border-slate-600/50 font-mono'
                    : 'bg-gradient-to-br from-blue-950/80 to-blue-900/60 text-gray-100 shadow-lg shadow-blue-900/20'
                }`}>
                  <p className="whitespace-pre-wrap">{message.text.replace(/\\n/g, '\n')}</p>
                  <p className={`text-xs mt-1 text-right ${
                    message.isSubmissionMessage
                      ? 'text-slate-500 font-mono'
                      : 'text-blue-300/60'
                  }`}>{message.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-[#2a2d35] border-t border-blue-900/20">
            <div className="flex items-end space-x-2">
              <textarea
                ref={textareaRef}
                placeholder="メッセージを入力..."
                className="flex-1 p-3 rounded-2xl resize-none overflow-y-auto bg-[#353841] text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={!selectedContact || isWaitingForAI}
                maxLength={500}
                rows={1}
              />
              <button onClick={handleSendMessage} disabled={!inputText.trim() || !selectedContact || isWaitingForAI} className="bg-gradient-to-br from-blue-700 to-blue-800 text-white p-3 rounded-full disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-500 hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg">
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </BaseApp>
  );
};