'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { School, Calendar, Phone, Mail, MapPin, Users, Award, Megaphone, Sun, Heart, Star, Smile, BookOpen, Sparkles } from 'lucide-react';
import { ElementarySchoolContent } from '@/types/elementarySchool';
import { UnifiedSearchResult } from '@/types/search';
import { validateElementarySchoolContent } from '@/actions/elementarySchoolValidation';

interface ElementarySchoolPageProps {
  documentId: string;
  initialData: UnifiedSearchResult;
}

export const ElementarySchoolPage: React.FC<ElementarySchoolPageProps> = ({ documentId, initialData }) => {
  const [schoolData, setSchoolData] = useState<ElementarySchoolContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchoolData = async () => {
      try {
        const searchResult = initialData;

        if (searchResult.template !== 'ElementarySchoolPage') {
          throw new Error('Invalid template');
        }

        const data = await validateElementarySchoolContent(searchResult.content);

        // 校舎画像のURL変換
        if (data.schoolImage?.startsWith('gs://')) {
          const url = await getDownloadURL(ref(storage, data.schoolImage));
          data.schoolImage = url;
        }

        setSchoolData(data);
      } catch {
        setSchoolData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSchoolData();
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

  if (!schoolData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-xl text-gray-600">学校情報が見つかりません</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-yellow-50 to-pink-50 relative overflow-hidden">
      {/* 背景装飾 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out ${Math.random() * 2}s infinite`,
            }}
          >
            {i % 3 === 0 ? (
              <Star className="text-yellow-300 opacity-40" size={10 + Math.random() * 15} />
            ) : i % 3 === 1 ? (
              <Heart className="text-pink-300 opacity-40" size={10 + Math.random() * 15} />
            ) : (
              <Sparkles className="text-blue-300 opacity-40" size={10 + Math.random() * 15} />
            )}
          </div>
        ))}
      </div>

      {/* ヘッダー */}
      <header className="bg-gradient-to-r from-blue-500 via-green-400 to-yellow-400 text-white shadow-2xl relative z-10 border-b-8 border-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="bg-white rounded-full p-3 shadow-lg">
                <School className="w-12 h-12 text-blue-500" />
              </div>
              <div>
                <h1 className="text-4xl font-bold drop-shadow-lg">{schoolData.schoolName}</h1>
                <p className="text-lg opacity-90 flex items-center space-x-2 mt-1">
                  <Sun className="w-5 h-5" />
                  <span>みんな なかよく げんきよく</span>
                  <Smile className="w-5 h-5" />
                </p>
              </div>
            </div>
            <nav className="hidden md:flex space-x-6">
              <button className="hover:bg-white/20 px-4 py-2 rounded-lg transition-colors font-bold">ホーム</button>
              <button className="hover:bg-white/20 px-4 py-2 rounded-lg transition-colors font-bold">学校紹介</button>
              <button className="hover:bg-white/20 px-4 py-2 rounded-lg transition-colors font-bold">お知らせ</button>
              <button className="hover:bg-white/20 px-4 py-2 rounded-lg transition-colors font-bold">行事予定</button>
            </nav>
          </div>
        </div>
      </header>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
      `}} />

      {/* メインコンテンツ */}
      <main className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        {/* 校舎画像 */}
        {schoolData.schoolImage && (
          <div className="mb-8 rounded-3xl overflow-hidden shadow-2xl border-8 border-white transform hover:scale-105 transition-transform duration-300">
            <div className="relative w-full h-80">
              <Image
                src={schoolData.schoolImage}
                alt="校舎"
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full font-bold shadow-lg flex items-center space-x-2">
                <Star className="w-5 h-5 fill-yellow-900" />
                <span>わたしたちの学校</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左カラム */}
          <div className="lg:col-span-2 space-y-6">
            {/* 校長挨拶 */}
            <div className="bg-white rounded-3xl shadow-xl p-8 border-8 border-blue-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-bl-full opacity-50"></div>
              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-blue-500 rounded-full p-3">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800">校長先生からのごあいさつ</h2>
                </div>
                <div className="bg-blue-50 rounded-2xl p-6 mb-4">
                  <p className="text-gray-700 leading-relaxed text-lg">{schoolData.greeting}</p>
                </div>
                <div className="flex items-center justify-end space-x-2">
                  <Smile className="w-6 h-6 text-blue-500" />
                  <p className="text-gray-600 font-bold text-lg">校長 {schoolData.principal}</p>
                </div>
              </div>
            </div>

            {/* 教育目標 */}
            <div className="bg-gradient-to-br from-green-200 via-blue-200 to-purple-200 rounded-3xl shadow-xl p-8 border-8 border-white relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/30 rounded-full"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/30 rounded-full"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-center space-x-3 mb-6">
                  <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
                  <h2 className="text-3xl font-bold text-gray-800">教育目標</h2>
                  <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
                </div>
                <div className="bg-white/80 rounded-2xl p-8 shadow-lg">
                  <p className="text-2xl text-gray-800 font-bold text-center leading-relaxed">{schoolData.motto}</p>
                </div>
              </div>
            </div>

            {/* お知らせ */}
            <div className="bg-white rounded-3xl shadow-xl p-8 border-8 border-yellow-200 relative overflow-hidden">
              <div className="absolute -top-5 -left-5 w-20 h-20 bg-yellow-200 rounded-full opacity-50"></div>
              <div className="absolute -bottom-5 -right-5 w-32 h-32 bg-yellow-100 rounded-full opacity-30"></div>
              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-yellow-500 rounded-full p-3 animate-pulse">
                    <Megaphone className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800">お知らせ</h2>
                </div>
                <div className="space-y-4">
                  {schoolData.news.map((news, index) => (
                    <div key={index} className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-8 border-yellow-400 rounded-r-2xl pl-6 pr-4 py-4 shadow-md hover:shadow-lg transition-shadow">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-sm font-bold text-gray-500 bg-white px-3 py-1 rounded-full">{news.date}</span>
                        <span className="px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full flex items-center space-x-1">
                          <Sparkles className="w-3 h-3" />
                          <span>NEW</span>
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-800 text-lg mb-2">{news.title}</h3>
                      <p className="text-gray-600">{news.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 年間行事 */}
            <div className="bg-white rounded-3xl shadow-xl p-8 border-8 border-pink-200 relative overflow-hidden">
              <div className="absolute top-0 left-1/2 w-40 h-40 bg-pink-100 rounded-full opacity-30 -translate-x-1/2"></div>
              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-pink-500 rounded-full p-3">
                    <Calendar className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800">年間行事</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {schoolData.events.map((event, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 rounded-2xl p-5 border-4 border-white shadow-lg hover:scale-105 transition-transform"
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="bg-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                          {event.date}
                        </div>
                      </div>
                      <h3 className="font-bold text-gray-800 text-lg mb-2 flex items-center space-x-2">
                        <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
                        <span>{event.title}</span>
                      </h3>
                      <p className="text-gray-700">{event.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 右カラム - 学校情報 */}
          <div className="space-y-6">
            {/* 基本情報 */}
            <div className="bg-white rounded-3xl shadow-xl p-6 border-8 border-green-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-100 rounded-full opacity-30 -mr-10 -mt-10"></div>
              <div className="relative z-10">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  <div className="bg-green-500 rounded-full p-2 mr-3">
                    <School className="w-6 h-6 text-white" />
                  </div>
                  学校情報
                </h2>
                <div className="space-y-4">
                  <div className="bg-green-50 rounded-xl p-3 flex items-start space-x-3 border-2 border-green-200">
                    <MapPin className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-green-600 mb-1">所在地</div>
                      <div className="text-sm text-gray-800">{schoolData.address}</div>
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-3 flex items-start space-x-3 border-2 border-blue-200">
                    <Phone className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-blue-600 mb-1">電話番号</div>
                      <div className="text-sm text-gray-800">{schoolData.phone}</div>
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-3 flex items-start space-x-3 border-2 border-purple-200">
                    <Mail className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-purple-600 mb-1">メール</div>
                      <div className="text-sm text-gray-800 break-all">{schoolData.email}</div>
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-3 flex items-start space-x-3 border-2 border-orange-200">
                    <Calendar className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-orange-600 mb-1">創立</div>
                      <div className="text-sm text-gray-800">{schoolData.established}</div>
                    </div>
                  </div>
                  <div className="bg-pink-50 rounded-xl p-3 flex items-start space-x-3 border-2 border-pink-200">
                    <Users className="w-5 h-5 text-pink-600 mt-1 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-pink-600 mb-1">児童数</div>
                      <div className="text-sm text-gray-800 font-bold">{schoolData.studentCount}名</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* アクセスカウンター風 */}
            <div className="bg-gradient-to-br from-orange-200 via-red-200 to-pink-200 rounded-3xl shadow-xl p-6 border-8 border-white relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/30"></div>
              <div className="relative z-10">
                <h3 className="text-center text-lg font-bold text-gray-700 mb-3 flex items-center justify-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-600 fill-yellow-600" />
                  <span>あなたは</span>
                  <Star className="w-5 h-5 text-yellow-600 fill-yellow-600" />
                </h3>
                <div className="bg-gray-900 text-green-400 font-mono text-3xl py-4 px-6 rounded-xl text-center shadow-inner border-4 border-gray-700">
                  {Math.floor(Math.random() * 10000) + 1000}
                </div>
                <h3 className="text-center text-lg font-bold text-gray-700 mt-3">人目の訪問者です</h3>
                <div className="flex justify-center space-x-2 mt-3">
                  <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                  <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                  <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                </div>
              </div>
            </div>

            {/* リンク集 */}
            <div className="bg-white rounded-3xl shadow-xl p-6 border-8 border-purple-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <BookOpen className="w-6 h-6 mr-2 text-purple-600" />
                リンク集
              </h2>
              <div className="space-y-3">
                <button className="w-full text-left px-5 py-3 bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 rounded-xl text-purple-700 font-bold transition-colors border-2 border-purple-300 shadow-md">
                  文部科学省
                </button>
                <button className="w-full text-left px-5 py-3 bg-gradient-to-r from-blue-100 to-cyan-100 hover:from-blue-200 hover:to-cyan-200 rounded-xl text-blue-700 font-bold transition-colors border-2 border-blue-300 shadow-md">
                  教育委員会
                </button>
                <button className="w-full text-left px-5 py-3 bg-gradient-to-r from-green-100 to-emerald-100 hover:from-green-200 hover:to-emerald-200 rounded-xl text-green-700 font-bold transition-colors border-2 border-green-300 shadow-md">
                  PTA
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-gradient-to-r from-blue-500 via-green-400 to-yellow-400 text-white mt-16 py-8 relative z-10 border-t-8 border-white shadow-2xl">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-3 mb-3">
            <Star className="w-6 h-6 fill-white" />
            <Heart className="w-6 h-6 fill-white" />
            <Smile className="w-6 h-6" />
          </div>
          <p className="text-lg font-bold">© 2025 {schoolData.schoolName}. All Rights Reserved.</p>
          <p className="text-sm opacity-90 mt-2">みんなの笑顔があふれる学校</p>
        </div>
      </footer>
    </div>
  );
};
