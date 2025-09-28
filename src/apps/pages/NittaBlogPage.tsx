'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Tag, User, Share2 } from 'lucide-react';
import { parseMarkdown } from '@/lib/markdown';
import { NittaBlogContent } from '@/types/nittaBlog';
import { UnifiedSearchResult } from '@/types/search';
import { validateNittaBlogContent } from '@/actions/nittaBlogValidation';

interface NittaBlogPageProps {
  documentId: string;
  initialData: UnifiedSearchResult;
}

const NittaBlogMarkdownContent: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900">
      {parseMarkdown(content)}
    </div>
  );
};

export const NittaBlogPage: React.FC<NittaBlogPageProps> = ({ documentId, initialData }) => {
  const [blogData, setBlogData] = useState<NittaBlogContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogData = async () => {
      try {
        console.log('Loading blog data for document ID:', documentId);
        const searchResult = initialData;
        console.log('Raw search result:', searchResult);

        if (searchResult.template !== 'NittaBlogPage') {
          console.error('Invalid template for NittaBlog:', searchResult.template);
          throw new Error('Invalid template');
        }

        const data = await validateNittaBlogContent(searchResult.content);
        console.log('Validated blog data:', data);
        setBlogData(data);
      } catch (error) {
        console.error('Error fetching blog data:', error);
        setBlogData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogData();
  }, [documentId, initialData]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">読み込み中...</span>
        </div>
      </div>
    );
  }

  if (!blogData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-xl text-gray-600">ブログ記事が見つかりません</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div>
                <h1 className="text-lg font-bold text-gray-900">y_nitta_dev</h1>
                <p className="text-xs text-gray-500">とあるフリーランスWebエンジニアのブログ</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 transition-colors">Home</button>
              <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 transition-colors">Posts</button>
              <button className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded transition-colors">About</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg border-4 border-white">
              <svg width="80" height="80" viewBox="0 0 80 80" className="drop-shadow-sm">
                {/* 犬のアイコン */}
                <circle cx="40" cy="45" r="18" fill="#8B4513" />
                <ellipse cx="28" cy="35" rx="8" ry="12" fill="#654321" transform="rotate(-30 28 35)" />
                <ellipse cx="52" cy="35" rx="8" ry="12" fill="#654321" transform="rotate(30 52 35)" />
                <ellipse cx="40" cy="48" rx="3" ry="2" fill="#2D1810" />
                <circle cx="35" cy="42" r="2.5" fill="#2D1810" />
                <circle cx="45" cy="42" r="2.5" fill="#2D1810" />
                <circle cx="35.5" cy="41.5" r="0.8" fill="white" />
                <circle cx="45.5" cy="41.5" r="0.8" fill="white" />
                <path d="M 40 50 Q 37 52 34 50" stroke="#2D1810" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                <path d="M 40 50 Q 43 52 46 50" stroke="#2D1810" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                <rect x="32" y="25" width="16" height="12" fill="#FF6B6B" rx="6" />
                <text x="40" y="33" textAnchor="middle" className="fill-white font-bold text-sm">Y</text>
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{blogData.title}</h1>
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {blogData.tags && blogData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-white bg-opacity-80 text-gray-700 text-sm font-medium rounded-full shadow-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
            <div className="flex justify-center items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>投稿日: {blogData.publicDate}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{Math.max(1, Math.ceil(blogData.content.chapters.reduce((acc, chapter) => acc + chapter.content.length, 0) / 400))}分</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <article className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          {blogData.content.chapters.map((chapter, index) => (
            <section key={index} className="mb-12 last:mb-0">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-blue-100">
                {index + 1}. {chapter.title}
              </h2>
              <div className="text-gray-700 leading-relaxed text-lg">
                <NittaBlogMarkdownContent content={chapter.content} />
              </div>
            </section>
          ))}
        </article>

        {/* Author Card */}
        <div className="mt-12 bg-white rounded-xl shadow-sm p-8">
          <div className="flex items-start space-x-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full flex items-center justify-center shadow-lg border-3 border-white flex-shrink-0">
              <svg width="60" height="60" viewBox="0 0 80 80" className="drop-shadow-sm">
                {/* 犬のアイコン */}
                <circle cx="40" cy="45" r="18" fill="#8B4513" />
                <ellipse cx="28" cy="35" rx="8" ry="12" fill="#654321" transform="rotate(-30 28 35)" />
                <ellipse cx="52" cy="35" rx="8" ry="12" fill="#654321" transform="rotate(30 52 35)" />
                <ellipse cx="40" cy="48" rx="3" ry="2" fill="#2D1810" />
                <circle cx="35" cy="42" r="2.5" fill="#2D1810" />
                <circle cx="45" cy="42" r="2.5" fill="#2D1810" />
                <circle cx="35.5" cy="41.5" r="0.8" fill="white" />
                <circle cx="45.5" cy="41.5" r="0.8" fill="white" />
                <path d="M 40 50 Q 37 52 34 50" stroke="#2D1810" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                <path d="M 40 50 Q 43 52 46 50" stroke="#2D1810" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                <rect x="30" y="25" width="20" height="12" fill="#FF6B6B" rx="6" />
                <text x="40" y="33" textAnchor="middle" className="fill-white font-bold text-xs">Y</text>
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{blogData.author.name} ({blogData.author.englishName})</h3>
              <p className="text-blue-600 font-medium mb-3">{blogData.author.title}</p>
              <p className="text-gray-600 leading-relaxed mb-4">
                {blogData.author.bio}
              </p>
              <div className="flex flex-col space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {blogData.author.experience}
                  </span>
                  <span className="flex items-center">
                    <Tag className="w-4 h-4 mr-1" />
                    {blogData.author.techStack}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-gray-500 text-xs mb-2">お仕事のご依頼・ご相談</p>
                  <span className="flex items-center text-gray-700">
                    <User className="w-4 h-4 mr-1" />
                    {blogData.author.email}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="mt-8 text-center">
          <div className="flex justify-center space-x-4">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
              <Share2 className="w-4 h-4 mr-2" />
              この記事をシェア
            </button>
            <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              他の記事を読む
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};