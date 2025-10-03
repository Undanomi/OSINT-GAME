'use client';

import React, { FormEvent, useEffect, useState } from 'react';
import { BBSThreadContent } from '@/types/bbs';
import { UnifiedSearchResult } from '@/types/search';
import { validateBBSThreadContent } from '@/actions/bbsValidation';

interface BBSThreadPageProps {
  documentId: string;
  initialData: UnifiedSearchResult;
}

export const BBSThreadPage: React.FC<BBSThreadPageProps> = ({ documentId, initialData }) => {
  const [threadData, setThreadData] = useState<BBSThreadContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [formState, setFormState] = useState({
    name: '',
    content: ''
  });
  const [posterId, setPosterId] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingPost, setPendingPost] = useState<{ name: string; content: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleInputChange = (field: 'name' | 'content') =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormState(prev => ({ ...prev, [field]: event.target.value }));
      setPendingPost(null);
    };

  const generatePostId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  const getCurrentDateString = () => {
    const formatter = new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    return formatter.format(new Date()).replace(/-/g, '/');
  };

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedContent = formState.content.trim();
    if (!trimmedContent) {
      return;
    }

    const displayName = formState.name.trim() || '名無しさん';
    setPendingPost({ name: displayName, content: trimmedContent });
    setIsConfirmOpen(true);
  };

  const handleConfirm = () => {
    if (!pendingPost) {
      setIsConfirmOpen(false);
      return;
    }

    const nextPosterId = posterId ?? generatePostId();

    setThreadData(prev => {
      if (!prev) {
        return prev;
      }

      const latestNumber = prev.posts.reduce((max, post) => Math.max(max, post.number), 0);
      const newPost = {
        number: latestNumber + 1,
        name: pendingPost.name,
        date: getCurrentDateString(),
        id: nextPosterId,
        content: pendingPost.content
      };

      return {
        ...prev,
        posts: [...prev.posts, newPost],
        totalPosts: prev.totalPosts + 1
      };
    });

    setPosterId(nextPosterId);
    setFormState({ name: '', content: '' });
    setPendingPost(null);
    setIsConfirmOpen(false);

    setToastMessage('投稿を受け付けました。');
  };

  const handleCancel = () => {
    setIsConfirmOpen(false);
    setPendingPost(null);
  };

  const isSubmitDisabled = formState.content.trim().length === 0;

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    const fetchThreadData = async () => {
      try {
        const searchResult = initialData;

        if (searchResult.template !== 'BBSThreadPage') {
          throw new Error('Invalid template');
        }

        const data = await validateBBSThreadContent(searchResult.content);
        setThreadData(data);
      } catch {
        setThreadData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchThreadData();
  }, [documentId, initialData]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (!threadData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-xl text-gray-600">スレッドが見つかりません</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EFEFEF] font-mono text-sm">
      {/* ヘッダー */}
      <div className="bg-[#F0E0D6] border-b border-[#800000] py-1 px-2">
        <div className="text-[#800000] font-bold text-xs">■掲示板に戻る■ 全部 1- 最新50</div>
      </div>

      {/* タイトルバー */}
      <div className="bg-[#CC9966] border-b border-black py-2 px-3">
        <div className="text-black font-bold">{threadData.boardName}</div>
      </div>

      {/* スレッドタイトル */}
      <div className="bg-white border-b border-gray-400 py-3 px-4">
        <h1 className="text-lg font-bold text-black">{threadData.threadTitle}</h1>
      </div>

      {/* 投稿一覧 */}
      <div className="max-w-5xl mx-auto">
        {threadData.posts.map((post) => (
          <div key={post.number} className="border-b border-gray-300 py-3 px-4 bg-white hover:bg-gray-50">
            {/* 投稿ヘッダー */}
            <div className="mb-2">
              <span className="font-bold text-green-700">{post.number}</span>
              <span className="mx-2">:</span>
              <span className="font-bold text-green-700">{post.name}</span>
              <span className="mx-2">:</span>
              <span className="text-gray-600">{post.date}</span>
              <span className="mx-2">ID:</span>
              <span className="text-red-600">{post.id}</span>
            </div>
            {/* 投稿内容 */}
            <div className="text-black whitespace-pre-wrap leading-relaxed pl-4">
              {post.content}
            </div>
          </div>
        ))}
      </div>

      {/* 投稿フォーム */}
      <div className="max-w-5xl mx-auto mt-6 bg-white border border-gray-300 shadow-sm">
        <div className="bg-[#F0E0D6] border-b border-gray-300 px-4 py-2 text-sm font-bold text-[#800000]">
          書き込みフォーム
        </div>
        <form onSubmit={handleFormSubmit} className="p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-[120px_1fr] items-center text-sm">
            <label htmlFor="bbs-name" className="text-gray-600">
              名前
            </label>
            <input
              id="bbs-name"
              name="name"
              type="text"
              placeholder="名無しさん"
              value={formState.name}
              onChange={handleInputChange('name')}
              className="w-full border border-gray-300 rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000]/40"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-[120px_1fr] text-sm">
            <label htmlFor="bbs-content" className="text-gray-600 mt-2 sm:mt-0">
              本文
            </label>
            <textarea
              id="bbs-content"
              name="content"
              required
              minLength={1}
              rows={6}
              placeholder="投稿内容を入力してください"
              value={formState.content}
              onChange={handleInputChange('content')}
              className="w-full border border-gray-300 rounded-sm px-3 py-2 resize-y focus:outline-none focus:ring-2 focus:ring-[#800000]/40"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="bg-[#800000] disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-bold px-4 py-2 rounded-sm shadow"
          >
            書き込む
          </button>
        </form>
      </div>

      {isConfirmOpen && pendingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white w-full max-w-md rounded-md shadow-xl border border-gray-300">
            <div className="bg-[#F0E0D6] border-b border-gray-300 px-4 py-2 text-sm font-bold text-[#800000]">
              投稿確認
            </div>
            <div className="p-4 space-y-4 text-sm text-gray-800">
              <p>以下の内容で投稿します。よろしいですか？</p>
              <div className="bg-gray-100 border border-gray-300 rounded-sm p-3">
                <p className="font-bold text-green-700 mb-2">{pendingPost.name}</p>
                <pre className="whitespace-pre-wrap leading-relaxed text-black">{pendingPost.content}</pre>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm border border-gray-400 rounded-sm text-gray-700 hover:bg-gray-100"
                >
                  修正する
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="px-4 py-2 text-sm rounded-sm bg-[#800000] text-white hover:bg-[#660000]"
                >
                  投稿する
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-40">
          <div className="rounded border border-[#800000] bg-[#F0E0D6] px-4 py-3 shadow-lg">
            <p className="text-xs font-bold text-[#800000]">掲示板</p>
            <p className="mt-1 text-sm text-black">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* フッター */}
      <div className="bg-[#F0E0D6] border-t border-[#800000] py-3 px-4 mt-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-xs text-gray-600 mb-2">
            {threadData.totalPosts}レス | 容量 -- KB
          </div>
          <div className="text-xs text-gray-600">
            <span className="text-[#800000]">■</span> 掲示板に戻る
            <span className="mx-2">|</span>
            <span className="text-[#800000]">■</span> 全部
            <span className="mx-2">|</span>
            <span className="text-[#800000]">■</span> 最新50
          </div>
          <div className="text-xs text-gray-500 mt-3">
            read.cgi ver 2025
          </div>
        </div>
      </div>
    </div>
  );
};
