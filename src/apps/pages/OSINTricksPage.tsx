'use client';

import React, { useEffect, useState, useRef } from 'react';
import { OSINTricksHomeContent, OSINTricksTipFull } from '@/types/osintrick';
import { UnifiedSearchResult } from '@/types/search';
import { validateOSINTricksHomeContent } from '@/actions/osintricksValidation';
import { parseMarkdown } from '@/lib/markdown';
import { Menu, ChevronLeft } from 'lucide-react';
import { useOSINTricksAuthStore } from '@/store/osintricksAuthStore';

interface OSINTricksPageProps {
  documentId: string;
  initialData: UnifiedSearchResult;
}

type ViewMode = 'home' | 'tip';

export const OSINTricksPage: React.FC<OSINTricksPageProps> = ({ documentId, initialData }) => {
  const [homeData, setHomeData] = useState<OSINTricksHomeContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [currentTip, setCurrentTip] = useState<OSINTricksTipFull | null>(null);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  // Zustand Storeから認証状態を取得
  const { isAuthenticated, authenticate } = useOSINTricksAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Basic認証
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await authenticate(username, password);

    if (result) {
      setAuthError('');
    } else {
      setAuthError('ユーザー名またはパスワードが正しくありません');
      setPassword('');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Loading OSINTricks data for document ID:', documentId);
        const searchResult = initialData;

        if (searchResult.template !== 'OSINTricksHomePage') {
          console.error('Invalid template for OSINTricks:', searchResult.template);
          throw new Error('Invalid template');
        }

        const data = await validateOSINTricksHomeContent(searchResult.content);
        console.log('Validated OSINTricks data:', data);

        setHomeData(data);
      } catch (error) {
        console.error('Error fetching OSINTricks data:', error);
        setHomeData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [documentId, initialData]);

  const showTip = (tip: OSINTricksTipFull) => {
    setCurrentTip(tip);
    setViewMode('tip');
    setLeftSidebarOpen(false);
    setTimeout(() => {
      topRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
    }, 0);
  };

  const showHome = () => {
    setCurrentTip(null);
    setViewMode('home');
    setLeftSidebarOpen(false);
    setTimeout(() => {
      topRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
    }, 0);
  };

  // 説明文から最初の一文を抽出し、**を取り除く
  const extractFirstSentence = (text: string): string => {
    // 。までを抽出
    const firstSentence = text.split('。')[0] + '。';
    // **を取り除く
    return firstSentence.replace(/\*\*/g, '');
  };

  // Basic認証フォーム
  if (!isAuthenticated) {
    return (
      <div className="h-full flex justify-center pt-20 bg-gray-50">
        <div className="max-w-sm w-full bg-white shadow-lg rounded-lg p-6 h-fit">
          <h2 className="text-lg font-bold text-gray-900 mb-4 text-center">OSINTricks - ログイン</h2>
          <form onSubmit={handleAuth}>
            <div className="mb-3">
              <label htmlFor="username" className="block text-xs font-medium text-gray-800 mb-1">
                ユーザー名
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="password" className="block text-xs font-medium text-gray-800 mb-1">
                パスワード
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            {authError && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-700 rounded-md text-xs">
                {authError}
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-1.5 px-3 rounded-md hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              ログイン
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
          <span className="text-gray-700">読み込み中...</span>
        </div>
      </div>
    );
  }

  if (!homeData) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-xl text-gray-700">ページが見つかりません</div>
      </div>
    );
  }

  return (
    <div ref={topRef} className="min-h-screen bg-white text-gray-900 scroll-smooth" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 h-14 flex items-center">
          <button
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded transition-colors text-blue-600 mr-3"
            aria-label="Toggle sidebar"
          >
            {leftSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
          <h1 className="text-base font-semibold text-gray-800">
            OSINTricks
          </h1>
        </div>
      </header>

      <div className="flex">
        {/* Left Sidebar */}
        {leftSidebarOpen && (
          <aside className="w-56 bg-white border-r border-gray-200 h-[calc(100vh-3.5rem)] sticky top-14 overflow-y-auto">
            <div className="py-4 px-3">
              <button
                onClick={showHome}
                className="block w-full text-left px-2 py-1.5 mb-4 rounded text-xs font-medium text-gray-800 hover:bg-gray-100 transition-colors"
              >
                🏠 Home
              </button>

              <div className="mb-2">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">Tips</h2>
                <nav className="space-y-0.5">
                  {homeData.tips.map((tip) => (
                    <button
                      key={tip.id}
                      onClick={() => showTip(tip)}
                      className="block w-full text-left px-2 py-1.5 rounded text-xs text-gray-800 hover:bg-gray-100 transition-colors"
                    >
                      <div className="font-medium">{tip.tipNumber}. {tip.title}</div>
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 max-w-4xl mx-auto px-8 py-8">
          {viewMode === 'home' ? (
            <>
              {/* ホームページ */}
              <div className="mb-10">
                <h1 className="text-3xl font-bold text-gray-900 mb-5">
                  {homeData.title}
                </h1>
                <p className="text-base font-bold text-gray-900 mb-4">
                  {homeData.subtitle}
                </p>
                <div className="prose prose-gray max-w-none text-sm text-gray-800 leading-relaxed">
                  {parseMarkdown(homeData.description)}
                </div>
              </div>

              {/* Tips Overview */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-5">
                  Tips 一覧
                </h2>
                <div className="space-y-2">
                  {homeData.tips.map((tip) => (
                    <button
                      key={tip.id}
                      onClick={() => showTip(tip)}
                      className="block w-full text-left border border-gray-200 rounded-md p-3 hover:border-gray-400 hover:shadow-sm transition-all group"
                    >
                      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                        {tip.tipNumber}. {tip.title}
                      </h3>
                      <p className="text-xs text-gray-700">
                        {extractFirstSentence(tip.description)}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : currentTip ? (
            <>
              {/* Tipsページ */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-3">
                  {currentTip.tipNumber}. {currentTip.title}
                </h1>
                <div className="text-sm text-gray-700 leading-relaxed mb-4">
                  {parseMarkdown(currentTip.description)}
                </div>

                {/* description と sections の間の区切り線 */}
                {currentTip.sections && currentTip.sections.length > 0 && (
                  <hr className="my-6 border-t border-gray-200" />
                )}
              </div>

              {/* Sections */}
              {currentTip.sections && currentTip.sections.length > 0 && (
                <div className="space-y-8">
                  {currentTip.sections.map((section, index, arr) => (
                    <section key={index} id={`section-${index}`} className="scroll-mt-20">
                      <h2 className="text-xl font-bold text-gray-900 mb-3">
                        {section.title}
                      </h2>
                      <div className="prose prose-gray max-w-none text-sm text-gray-800 leading-relaxed">
                        {parseMarkdown(section.content)}
                      </div>

                      {/* Examples */}
                      {section.examples && section.examples.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {section.examples.map((example, exIdx) => (
                            <div key={exIdx} className="bg-gray-50 border border-gray-200 rounded p-3">
                              <div className="prose prose-gray max-w-none text-sm text-gray-800">
                                {parseMarkdown(example)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* セクション区切り線 */}
                      {index < arr.length - 1 && (
                        <hr className="mt-10 border-t border-gray-200" />
                      )}
                    </section>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </main>

        {/* Right Sidebar - Tips詳細の目次 */}
        {viewMode === 'tip' && currentTip && currentTip.sections && currentTip.sections.length > 0 && (
          <aside className="w-56 bg-white border-l border-gray-200 h-[calc(100vh-3.5rem)] sticky top-14 overflow-y-auto">
            <div className="py-4 px-3">
              <h2 className="text-xs font-semibold text-blue-600 uppercase tracking-wider px-2 mb-2">目次</h2>
              <nav className="space-y-0.5">
                {currentTip.sections.map((section, index) => (
                  <a
                    key={index}
                    href={`#section-${index}`}
                    className="block px-2 py-1.5 rounded text-xs text-gray-800 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    {section.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
