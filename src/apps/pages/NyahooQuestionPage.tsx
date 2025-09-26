'use client';

import React, { useEffect, useState } from 'react';
import { NyahooQuestionContent, NyahooQuestionReply } from '@/types/nyahooQuestion';
import { UnifiedSearchResult } from '@/types/search';
import { validateNyahooQuestionContent } from '@/actions/nyahooQuestionValidation';
import {
  Share2, ThumbsUp, ThumbsDown, MessageCircle,
  Search, Menu, Star, MoreHorizontal, Tag,
  Bookmark, Heart, Reply
} from 'lucide-react';

interface NyahooQuestionPageProps {
  documentId: string;
  initialData: UnifiedSearchResult;
}

export const NyahooQuestionPage: React.FC<NyahooQuestionPageProps> = ({ documentId, initialData }) => {
  const [questionData, setQuestionData] = useState<NyahooQuestionContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLoginMessage, setShowLoginMessage] = useState(false);
  const [sortOrder, setSortOrder] = useState<'likes' | 'newest'>('likes');

  // Generate random category questions for sidebar
  const generateCategoryQuestions = () => {
    const categories = [
      { name: 'スマートフォン', count: 856 },
      { name: '料理', count: 2341 },
      { name: '恋愛相談', count: 967 },
      { name: '健康', count: 1543 },
      { name: '学習', count: 789 },
      { name: '仕事', count: 1122 },
      { name: '趣味', count: 654 },
      { name: 'プログラミング', count: 234 }
    ];
    return categories;
  };

  const [categories] = useState(generateCategoryQuestions());

  useEffect(() => {
    const fetchQuestionData = async () => {
      try {
        console.log('Loading initial data for document ID:', documentId);
        const searchResult = initialData;
        console.log('Raw search result:', searchResult);

        if (searchResult.template !== 'NyahooQuestionPage') {
          console.error('Invalid template for NyahooQuestion:', searchResult.template);
          throw new Error('Invalid template');
        }

        const data = await validateNyahooQuestionContent(searchResult.content);
        console.log('Validated data:', data);

        setQuestionData(data);
      } catch (error) {
        console.error('Error fetching question data:', error);
        setQuestionData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestionData();
  }, [documentId, initialData]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const sortReplies = (replies: NyahooQuestionReply[]): NyahooQuestionReply[] => {
    const sorted = [...replies];
    if (sortOrder === 'likes') {
      return sorted.sort((a, b) => b.likes - a.likes);
    } else if (sortOrder === 'newest') {
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return sorted;
  };

  const renderReply = (reply: NyahooQuestionReply, level: number = 0) => {
    const marginLeft = level > 0 ? `ml-${Math.min(level * 4, 16)}` : '';

    return (
      <div key={reply.user_id} className={`border-b border-gray-200 ${marginLeft}`}>
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {reply.user_id.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <span className="font-medium text-sm text-gray-900">{reply.user_id}</span>
                <div className="text-xs text-gray-500">
                  {formatDate(reply.createdAt.toString())}
                </div>
              </div>
            </div>
            <button className="text-gray-400 hover:text-gray-600">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          <div className="mb-3">
            <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-line">
              {reply.content}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors text-xs">
              <ThumbsUp className="w-4 h-4" />
              <span>{reply.likes}</span>
            </button>
            <button className="flex items-center space-x-1 text-gray-500 hover:text-red-600 transition-colors text-xs">
              <ThumbsDown className="w-4 h-4" />
              <span>{reply.bads}</span>
            </button>
            <button className="flex items-center space-x-1 text-gray-500 hover:text-orange-600 transition-colors text-xs">
              <Heart className="w-4 h-4" />
              <span>{reply.thanks}</span>
            </button>
            <button className="flex items-center space-x-1 text-gray-500 hover:text-purple-600 transition-colors text-xs">
              <Reply className="w-4 h-4" />
              <span>返信</span>
            </button>
          </div>
        </div>

        {reply.replies && reply.replies.length > 0 && (
          <div className="bg-gray-50">
            {reply.replies.map((nestedReply) => renderReply(nestedReply, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
          <span className="text-gray-600">読み込み中...</span>
        </div>
      </div>
    );
  }

  if (!questionData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-xl text-gray-600">質問が見つかりません</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-14 px-4">
            {/* Left section */}
            <div className="flex items-center">
              <div className="flex items-center mr-6">
                <div className="text-2xl font-bold">
                  <span className="text-purple-600">Nyahoo!</span>
                  <span className="text-gray-800 text-lg ml-1">無知袋</span>
                </div>
              </div>
              <nav className="hidden lg:flex space-x-6">
                <button className="text-gray-700 hover:text-purple-600 transition-colors text-sm font-medium">
                  質問する
                </button>
                <button className="text-gray-700 hover:text-purple-600 transition-colors text-sm">
                  カテゴリ
                </button>
                <button className="text-gray-700 hover:text-purple-600 transition-colors text-sm">
                  ランキング
                </button>
              </nav>
            </div>

            {/* Right section */}
            <div className="flex items-center space-x-3">
              <div className="relative hidden lg:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="質問を検索"
                  className="border border-gray-300 rounded-lg pl-10 pr-4 py-2 w-64 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <button className="hidden lg:flex items-center text-gray-700 hover:text-purple-600 transition-colors px-3 py-2 text-sm">
                ログイン
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg lg:hidden">
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Advertisement Banner */}
      {questionData?.ads && questionData.ads.length > 0 && (
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-2">
            {questionData.ads.map((ad, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-yellow-600 font-medium bg-yellow-100 px-2 py-1 rounded">PR</span>
                  <span className="text-sm text-gray-700">{ad.text}</span>
                </div>
                <button className="text-xs text-yellow-700 hover:text-yellow-800 bg-yellow-100 hover:bg-yellow-200 px-3 py-1 rounded transition-colors">
                  {ad.button}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Question */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Question Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">
                        {questionData.user_id.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-sm text-gray-900">{questionData.user_id}</span>
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
                          #{questionData.tag}
                        </span>
                        <span className="text-xs text-gray-500">{formatDate(questionData.date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-500 text-sm">
                    <MessageCircle className="w-4 h-4" />
                    <span>{questionData.reply_count}</span>
                  </div>
                </div>

                <div className="mb-4 ml-13">
                  <p className="text-gray-800 text-base leading-relaxed whitespace-pre-line">
                    {questionData.content}
                  </p>
                </div>

                {questionData.supplement && (
                  <div className="bg-gray-100 border-l-4 border-gray-300 p-3 mb-4 ml-13">
                    <p className="text-sm text-gray-600 font-medium">補足情報</p>
                    <p className="text-sm text-gray-500 mt-1">{questionData.supplement}</p>
                  </div>
                )}

                <div className="flex items-center space-x-4 pt-3 ml-13">
                  <button className="flex items-center space-x-1 text-gray-600 hover:text-purple-600 transition-colors text-sm">
                    <ThumbsUp className="w-4 h-4" />
                    <span>参考になった ({questionData.likes})</span>
                  </button>
                  <button className="flex items-center space-x-1 text-gray-600 hover:text-orange-600 transition-colors text-sm">
                    <Bookmark className="w-4 h-4" />
                    <span>保存</span>
                  </button>
                  <button className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 transition-colors text-sm">
                    <Share2 className="w-4 h-4" />
                    <span>シェア</span>
                  </button>
                </div>
              </div>

              {/* Answer Form */}
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900 mb-3">回答する</h3>

                {showLoginMessage && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 text-xs">i</span>
                      </div>
                      <div>
                        <p className="text-blue-800 text-sm font-medium">ログインのご案内</p>
                        <p className="text-blue-700 text-xs mt-1">回答を投稿するには、ログインまたは新規登録をお願いします。</p>
                      </div>
                    </div>
                    <div className="mt-3 flex space-x-2">
                      <button className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700 transition-colors">
                        ログイン
                      </button>
                      <button className="border border-blue-300 text-blue-700 px-3 py-1 rounded text-xs font-medium hover:bg-blue-50 transition-colors">
                        新規登録
                      </button>
                      <button
                        className="text-blue-600 text-xs hover:text-blue-800 transition-colors"
                        onClick={() => setShowLoginMessage(false)}
                      >
                        閉じる
                      </button>
                    </div>
                  </div>
                )}

                <textarea
                  placeholder="回答を入力してください..."
                  className="w-full h-24 p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none"
                />
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>匿名で回答</span>
                    <span>|</span>
                    <span>画像を添付</span>
                  </div>
                  <button
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                    onClick={() => setShowLoginMessage(true)}
                  >
                    回答を投稿
                  </button>
                </div>
              </div>

              {/* Answers Section */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <MessageCircle className="w-5 h-5 mr-2 text-purple-600" />
                    回答 ({questionData.reply_count})
                  </h3>
                  <div className="flex items-center space-x-2">
                    <select
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-purple-500"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as 'likes' | 'newest')}
                    >
                      <option value="likes">いいね順</option>
                      <option value="newest">新しい順</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-0">
                  {sortReplies(questionData.replies).map((reply) => renderReply(reply))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            {/* Categories */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <Tag className="w-5 h-5 mr-2 text-purple-600" />
                  カテゴリ
                </h2>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  {categories.map((category, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                      <span className="text-sm text-gray-700 hover:text-purple-600">{category.name}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{category.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Trending Questions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <Star className="w-5 h-5 mr-2 text-purple-600" />
                  注目の質問
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                {questionData?.trending_questions && questionData.trending_questions.length > 0 ? (
                  questionData.trending_questions.map((question, idx) => (
                    <div key={idx} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                      <h3 className="font-medium text-sm text-gray-900 mb-2 leading-tight hover:text-purple-600">
                        {question.title}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="bg-gray-100 px-2 py-1 rounded">{question.category}</span>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="w-3 h-3" />
                          <span>{question.replies}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    注目の質問がありません
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">クイックアクション</h2>
              </div>
              <div className="p-4 space-y-3">
                <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
                  質問を投稿
                </button>
                <button className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                  回答を探す
                </button>
                <button className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                  専門家に相談
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

    </div>
  );
};