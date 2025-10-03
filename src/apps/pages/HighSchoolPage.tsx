'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { School, Phone, Mail, MapPin, TrendingUp, BookOpen, GraduationCap, Target, Award, Users2, Briefcase, Star, Sparkles } from 'lucide-react';
import { HighSchoolContent } from '@/types/highSchool';
import { UnifiedSearchResult } from '@/types/search';
import { validateHighSchoolContent } from '@/actions/highSchoolValidation';

interface HighSchoolPageProps {
  documentId: string;
  initialData: UnifiedSearchResult;
}

export const HighSchoolPage: React.FC<HighSchoolPageProps> = ({ documentId, initialData }) => {
  const [schoolData, setSchoolData] = useState<HighSchoolContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchoolData = async () => {
      try {
        const searchResult = initialData;

        if (searchResult.template !== 'HighSchoolPage') {
          throw new Error('Invalid template');
        }

        const data = await validateHighSchoolContent(searchResult.content);

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
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      {/* ヘッダー */}
      <header className="bg-gradient-to-r from-indigo-900 via-purple-900 to-violet-900 text-white shadow-2xl relative overflow-hidden border-b-4 border-purple-400">
        {/* 背景装飾 */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `twinkle ${3 + Math.random() * 3}s ease-in-out ${Math.random() * 2}s infinite`,
              }}
            >
              {i % 2 === 0 ? (
                <Star className="text-purple-300" size={10 + Math.random() * 20} />
              ) : (
                <Sparkles className="text-indigo-300" size={10 + Math.random() * 20} />
              )}
            </div>
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-8 py-10 relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-6">
              <div className="bg-white rounded-2xl p-5 shadow-2xl">
                <School className="w-16 h-16 text-indigo-900" />
              </div>
              <div>
                <h1 className="text-5xl font-bold tracking-tight drop-shadow-xl">{schoolData.schoolName}</h1>
                <p className="text-xl mt-2 opacity-90 font-light">{schoolData.englishName}</p>
              </div>
            </div>
            <div className="hidden lg:flex items-center space-x-3">
              <div className="bg-purple-600 rounded-xl p-3">
                <GraduationCap className="w-10 h-10" />
              </div>
              <div className="bg-indigo-600 rounded-xl p-3">
                <Target className="w-10 h-10" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6 border-2 border-white/20">
            <p className="text-2xl font-light italic flex items-center space-x-3">
              <Sparkles className="w-6 h-6 text-purple-300" />
              <span>{schoolData.motto}</span>
            </p>
          </div>

          <nav className="flex space-x-8 text-sm font-bold border-t-2 border-white/30 pt-6">
            <button className="hover:text-purple-300 transition-colors">ホーム</button>
            <button className="hover:text-purple-300 transition-colors">学校案内</button>
            <button className="hover:text-purple-300 transition-colors">学科紹介</button>
            <button className="hover:text-purple-300 transition-colors flex items-center space-x-1">
              <TrendingUp className="w-4 h-4" />
              <span>進路情報</span>
            </button>
            <button className="hover:text-purple-300 transition-colors">入学案内</button>
          </nav>
        </div>
      </header>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}} />

      {/* 校舎画像 */}
      {schoolData.schoolImage && (
        <div className="w-full h-[500px] relative shadow-2xl">
          <Image src={schoolData.schoolImage} alt="校舎" fill className="object-cover" unoptimized />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end">
            <div className="bg-gradient-to-r from-indigo-900/90 to-purple-900/90 text-white px-8 py-6 rounded-2xl shadow-2xl backdrop-blur-sm border-2 border-white/20">
              <p className="text-3xl font-bold">未来を切り拓く力を</p>
              <p className="text-lg opacity-90 mt-2">Discover Your Future</p>
            </div>
          </div>
        </div>
      )}

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* 左カラム */}
          <div className="lg:col-span-2 space-y-10">
            {/* 校長メッセージ */}
            <div className="bg-white rounded-3xl shadow-2xl p-10 border-t-8 border-indigo-600 relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-100 rounded-full opacity-20"></div>
              <div className="relative z-10">
                <h2 className="text-4xl font-bold text-gray-900 mb-8 flex items-center">
                  <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-4 mr-5 shadow-lg">
                    <BookOpen className="w-10 h-10 text-white" />
                  </div>
                  校長メッセージ
                </h2>
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 mb-8 border-2 border-indigo-200">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-lg">{schoolData.message}</p>
                </div>
                <div className="flex items-center justify-end space-x-3 bg-gray-50 rounded-xl p-4">
                  <Award className="w-7 h-7 text-indigo-600" />
                  <p className="text-gray-800 font-bold text-xl">校長 {schoolData.principal}</p>
                </div>
              </div>
            </div>

            {/* 学科紹介 */}
            <div className="bg-white rounded-3xl shadow-2xl p-10 border-t-8 border-purple-600 relative overflow-hidden">
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-100 rounded-full opacity-20"></div>
              <div className="relative z-10">
                <h2 className="text-4xl font-bold text-gray-900 mb-8 flex items-center">
                  <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-4 mr-5 shadow-lg">
                    <GraduationCap className="w-10 h-10 text-white" />
                  </div>
                  学科紹介
                </h2>
                <div className="space-y-6">
                  {schoolData.departments.map((dept, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 border-l-8 border-purple-600 rounded-r-2xl pl-8 pr-6 py-6 shadow-lg hover:shadow-xl transition-shadow"
                    >
                      <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                        <Target className="w-7 h-7 text-purple-600" />
                        <span>{dept.name}</span>
                      </h3>
                      <p className="text-gray-700 text-lg mb-5 leading-relaxed">{dept.description}</p>
                      <div className="bg-white rounded-xl p-5 shadow-md">
                        <ul className="space-y-3">
                          {dept.features.map((feature, idx) => (
                            <li key={idx} className="text-gray-700 flex items-start">
                              <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                                ✓
                              </span>
                              <span className="text-base">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 新着情報 */}
            <div className="bg-white rounded-3xl shadow-2xl p-10 border-t-8 border-indigo-500">
              <h2 className="text-4xl font-bold text-gray-900 mb-8 flex items-center">
                <div className="bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-2xl p-4 mr-5 shadow-lg">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                新着情報
              </h2>
              <div className="space-y-5">
                {schoolData.news.map((news, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 hover:shadow-lg transition-shadow border-2 border-indigo-200"
                  >
                    <div className="flex items-center space-x-4 mb-3">
                      <span className="bg-white text-indigo-600 px-4 py-2 rounded-full text-sm font-bold shadow-sm">
                        {news.date}
                      </span>
                      <span className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold rounded-full">
                        {news.category}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-xl mb-2">{news.title}</h3>
                    <p className="text-gray-700 leading-relaxed">{news.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 右カラム */}
          <div className="space-y-8">
            {/* 進路実績 */}
            <div className="bg-gradient-to-br from-green-100 via-emerald-100 to-teal-100 rounded-3xl shadow-2xl p-8 border-8 border-green-300 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-300 rounded-full opacity-30"></div>
              <div className="relative z-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="bg-green-600 rounded-xl p-3 mr-3">
                    <TrendingUp className="w-7 h-7 text-white" />
                  </div>
                  進路実績
                </h2>
                <div className="space-y-5">
                  <div className="bg-white rounded-2xl p-6 shadow-xl border-4 border-green-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-bold text-green-700">大学進学率</div>
                      <GraduationCap className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="text-5xl font-bold text-green-600 mb-2">{schoolData.careerData.universityRate}%</div>
                    <div className="h-3 bg-green-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                        style={{ width: `${schoolData.careerData.universityRate}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-xl border-4 border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-bold text-blue-700">就職率</div>
                      <Briefcase className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-5xl font-bold text-blue-600 mb-2">{schoolData.careerData.employmentRate}%</div>
                    <div className="h-3 bg-blue-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                        style={{ width: `${schoolData.careerData.employmentRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 学校情報 */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 border-t-8 border-indigo-600">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="bg-indigo-600 rounded-xl p-3 mr-3">
                  <School className="w-7 h-7 text-white" />
                </div>
                学校情報
              </h2>
              <div className="space-y-4">
                <div className="bg-indigo-50 rounded-xl p-4 flex items-start space-x-3 border-2 border-indigo-200">
                  <MapPin className="w-6 h-6 text-indigo-600 mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-indigo-600 mb-1">所在地</div>
                    <div className="text-sm text-gray-800">{schoolData.address}</div>
                  </div>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 flex items-start space-x-3 border-2 border-purple-200">
                  <Phone className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-purple-600 mb-1">TEL / FAX</div>
                    <div className="text-sm text-gray-800">{schoolData.phone}</div>
                    <div className="text-sm text-gray-800">{schoolData.fax}</div>
                  </div>
                </div>
                <div className="bg-pink-50 rounded-xl p-4 flex items-start space-x-3 border-2 border-pink-200">
                  <Mail className="w-6 h-6 text-pink-600 mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-pink-600 mb-1">Email</div>
                    <div className="text-sm text-gray-800 break-all">{schoolData.email}</div>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 flex items-start space-x-3 border-2 border-blue-200">
                  <School className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-blue-600 mb-1">創立</div>
                    <div className="text-sm text-gray-800">{schoolData.established}</div>
                  </div>
                </div>
                <div className="bg-green-50 rounded-xl p-4 flex items-start space-x-3 border-2 border-green-200">
                  <Users2 className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-green-600 mb-1">生徒数</div>
                    <div className="text-sm text-gray-800 font-bold">{schoolData.studentCount}名</div>
                  </div>
                </div>
              </div>
            </div>

            {/* お問い合わせ */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-3xl shadow-2xl p-8 border-4 border-white">
              <div className="flex items-center justify-center mb-4">
                <Target className="w-12 h-12" />
              </div>
              <h3 className="font-bold text-2xl mb-4 text-center">学校見学・お問い合わせ</h3>
              <p className="text-sm mb-6 opacity-90 text-center leading-relaxed">
                学校見学は随時受け付けております。<br />お気軽にお問い合わせください。
              </p>
              <button className="w-full bg-white text-indigo-600 font-bold py-4 rounded-xl hover:bg-gray-100 transition-colors shadow-xl text-lg">
                お問い合わせフォーム
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-gradient-to-r from-indigo-950 via-purple-950 to-violet-950 text-white mt-20 py-12 shadow-2xl border-t-4 border-purple-400">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <GraduationCap className="w-8 h-8 text-purple-300" />
              <Star className="w-6 h-6 text-purple-300 fill-purple-300" />
              <Target className="w-8 h-8 text-purple-300" />
            </div>
            <p className="text-xl font-bold mb-3">© 2025 {schoolData.schoolName}. All Rights Reserved.</p>
            <p className="text-sm opacity-90">夢を実現する力を、ここから</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
