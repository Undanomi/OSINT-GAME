'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { School, Phone, Mail, MapPin, Users, BookOpen, Trophy, Star, Zap, Target, Award, Flame, Medal } from 'lucide-react';
import { JuniorHighSchoolContent } from '@/types/juniorHighSchool';
import { UnifiedSearchResult } from '@/types/search';
import { validateJuniorHighSchoolContent } from '@/actions/juniorHighSchoolValidation';

interface JuniorHighSchoolPageProps {
  documentId: string;
  initialData: UnifiedSearchResult;
}

export const JuniorHighSchoolPage: React.FC<JuniorHighSchoolPageProps> = ({ documentId, initialData }) => {
  const [schoolData, setSchoolData] = useState<JuniorHighSchoolContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchoolData = async () => {
      try {
        const searchResult = initialData;

        if (searchResult.template !== 'JuniorHighSchoolPage') {
          throw new Error('Invalid template');
        }

        const data = await validateJuniorHighSchoolContent(searchResult.content);

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
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!schoolData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-600">学校情報が見つかりません</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-50">
      {/* ヘッダー */}
      <header className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-600 text-white shadow-2xl relative overflow-hidden border-b-4 border-yellow-400">
        {/* 背景装飾 */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `pulse ${2 + Math.random() * 2}s ease-in-out ${Math.random()}s infinite`,
              }}
            >
              {i % 3 === 0 ? (
                <Zap className="text-white" size={20 + Math.random() * 30} />
              ) : i % 3 === 1 ? (
                <Star className="text-yellow-300" size={15 + Math.random() * 25} />
              ) : (
                <Trophy className="text-yellow-400" size={20 + Math.random() * 25} />
              )}
            </div>
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="bg-white rounded-full p-4 shadow-xl">
                <School className="w-12 h-12 text-blue-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold drop-shadow-lg">{schoolData.schoolName}</h1>
                <p className="text-lg mt-2 opacity-90 flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>{schoolData.philosophy}</span>
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-3">
              <div className="bg-yellow-400 text-blue-900 rounded-full p-3">
                <Trophy className="w-8 h-8" />
              </div>
              <div className="bg-blue-500 text-white rounded-full p-3">
                <Award className="w-8 h-8" />
              </div>
            </div>
          </div>
          <nav className="flex space-x-8 text-sm font-bold border-t-2 border-white/30 pt-4">
            <button className="hover:text-yellow-400 transition-colors flex items-center space-x-1">
              <span>ホーム</span>
            </button>
            <button className="hover:text-yellow-400 transition-colors flex items-center space-x-1">
              <span>学校案内</span>
            </button>
            <button className="hover:text-yellow-400 transition-colors flex items-center space-x-1">
              <Trophy className="w-4 h-4" />
              <span>部活動</span>
            </button>
            <button className="hover:text-yellow-400 transition-colors flex items-center space-x-1">
              <span>お知らせ</span>
            </button>
            <button className="hover:text-yellow-400 transition-colors flex items-center space-x-1">
              <span>アクセス</span>
            </button>
          </nav>
        </div>
      </header>

      {/* 校舎画像 */}
      {schoolData.schoolImage && (
        <div className="w-full h-80 relative shadow-2xl">
          <Image src={schoolData.schoolImage} alt="校舎" fill className="object-cover" unoptimized />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
          <div className="absolute bottom-6 left-6 bg-blue-600/90 text-white px-6 py-3 rounded-xl shadow-xl backdrop-blur-sm">
            <p className="text-2xl font-bold flex items-center space-x-2">
              <Flame className="w-6 h-6 text-yellow-400" />
              <span>挑戦と成長の3年間</span>
            </p>
          </div>
        </div>
      )}

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左カラム */}
          <div className="lg:col-span-2 space-y-8">
            {/* 校長挨拶 */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-t-8 border-blue-600 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-100 rounded-full opacity-30"></div>
              <div className="relative z-10">
                <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
                  <div className="bg-blue-600 rounded-xl p-3 mr-4">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  校長挨拶
                </h2>
                <div className="bg-blue-50 rounded-xl p-6 mb-6">
                  <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap">{schoolData.greeting}</p>
                </div>
                <div className="flex items-center justify-end space-x-2">
                  <Award className="w-6 h-6 text-blue-600" />
                  <p className="text-gray-600 font-bold text-lg">校長 {schoolData.principal}</p>
                </div>
              </div>
            </div>

            {/* お知らせ */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-t-8 border-cyan-500">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
                <div className="bg-cyan-500 rounded-xl p-3 mr-4">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                お知らせ
              </h2>
              <div className="space-y-4">
                {schoolData.news.map((news, index) => (
                  <div key={index} className="bg-gradient-to-r from-cyan-50 to-blue-50 border-l-8 border-cyan-500 rounded-r-xl pl-6 pr-4 py-5 hover:shadow-lg transition-shadow">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-sm font-bold text-gray-500 bg-white px-3 py-1 rounded-full">{news.date}</span>
                      <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                        {news.category}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg mb-1">{news.title}</h3>
                    <p className="text-gray-600">{news.content}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 部活動紹介 */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl shadow-xl p-8 border-8 border-yellow-300 relative overflow-hidden">
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-yellow-200 rounded-full opacity-30"></div>
              <div className="absolute -top-10 -right-10 w-60 h-60 bg-orange-200 rounded-full opacity-20"></div>
              <div className="relative z-10">
                <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-3 mr-4">
                    <Trophy className="w-8 h-8 text-white" />
                  </div>
                  部活動紹介
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {schoolData.clubs.map((club, index) => (
                    <div key={index} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-shadow border-4 border-yellow-200 hover:scale-105 transform transition-transform">
                      <h3 className="font-bold text-gray-800 text-lg mb-3 flex items-center space-x-2">
                        <Medal className="w-6 h-6 text-blue-600" />
                        <span>{club.name}</span>
                      </h3>
                      <p className="text-gray-600 mb-3">{club.description}</p>
                      {club.achievement && (
                        <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg p-3 mt-3 border-2 border-yellow-300">
                          <div className="flex items-center space-x-2">
                            <Trophy className="w-5 h-5 text-yellow-600 fill-yellow-600" />
                            <p className="text-sm text-yellow-900 font-bold">{club.achievement}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 右カラム */}
          <div className="space-y-6">
            {/* 学校情報 */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-t-8 border-blue-600">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <div className="bg-blue-600 rounded-lg p-2 mr-3">
                  <School className="w-6 h-6 text-white" />
                </div>
                学校情報
              </h2>
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-xl p-4 flex items-start space-x-3 border-2 border-blue-200">
                  <MapPin className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-blue-600 mb-1">所在地</div>
                    <div className="text-sm text-gray-800">{schoolData.address}</div>
                  </div>
                </div>
                <div className="bg-cyan-50 rounded-xl p-4 flex items-start space-x-3 border-2 border-cyan-200">
                  <Phone className="w-5 h-5 text-cyan-600 mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-cyan-600 mb-1">TEL / FAX</div>
                    <div className="text-sm text-gray-800">{schoolData.phone}</div>
                    <div className="text-sm text-gray-800">{schoolData.fax}</div>
                  </div>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 flex items-start space-x-3 border-2 border-purple-200">
                  <Mail className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-purple-600 mb-1">Email</div>
                    <div className="text-sm text-gray-800 break-all">{schoolData.email}</div>
                  </div>
                </div>
                <div className="bg-green-50 rounded-xl p-4 flex items-start space-x-3 border-2 border-green-200">
                  <School className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-green-600 mb-1">創立</div>
                    <div className="text-sm text-gray-800">{schoolData.established}</div>
                  </div>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 flex items-start space-x-3 border-2 border-orange-200">
                  <Users className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-orange-600 mb-1">生徒数</div>
                    <div className="text-sm text-gray-800 font-bold">{schoolData.studentCount}名</div>
                  </div>
                </div>
              </div>
            </div>

            {/* アクセス */}
            <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl p-6 border-4 border-blue-300 shadow-xl">
              <h3 className="font-bold text-blue-900 text-xl mb-4 flex items-center">
                <MapPin className="w-6 h-6 mr-2" />
                アクセス
              </h3>
              <div className="bg-white rounded-xl p-4 shadow-md">
                <p className="text-sm font-bold text-blue-800 mb-2">電車でお越しの方</p>
                <p className="text-sm text-blue-700">最寄り駅から徒歩15分</p>
              </div>
            </div>

            {/* 挑戦メッセージ */}
            <div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl p-6 border-4 border-yellow-300 shadow-xl">
              <div className="flex items-center justify-center mb-3">
                <Flame className="w-8 h-8 text-orange-600" />
              </div>
              <p className="text-center font-bold text-gray-800 text-lg leading-relaxed">
                夢に向かって<br />
                全力で挑戦しよう！
              </p>
            </div>

            {/* 更新情報 */}
            <div className="bg-white rounded-xl shadow p-4 border-2 border-gray-200">
              <p className="text-xs text-gray-600 text-center">最終更新日: 2025年3月20日</p>
            </div>
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-gradient-to-r from-blue-800 via-blue-700 to-cyan-700 text-white mt-16 py-8 shadow-2xl border-t-4 border-yellow-400">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <Star className="w-6 h-6 text-yellow-300 fill-yellow-300" />
            <Award className="w-6 h-6 text-yellow-400" />
          </div>
          <p className="text-lg font-bold mb-2">© 2025 {schoolData.schoolName}. All Rights Reserved.</p>
          <p className="text-sm opacity-90">限りない可能性を信じて</p>
        </div>
      </footer>
    </div>
  );
};
