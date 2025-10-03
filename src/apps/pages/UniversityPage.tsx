'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { School, Phone, Mail, MapPin, Users, BookOpen, Building2, GraduationCap, Award, Microscope, Globe, Library, Trophy, Star } from 'lucide-react';
import { UniversityContent } from '@/types/university';
import { UnifiedSearchResult } from '@/types/search';
import { validateUniversityContent } from '@/actions/universityValidation';

interface UniversityPageProps {
  documentId: string;
  initialData: UnifiedSearchResult;
}

export const UniversityPage: React.FC<UniversityPageProps> = ({ documentId, initialData }) => {
  const [universityData, setUniversityData] = useState<UniversityContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUniversityData = async () => {
      try {
        const searchResult = initialData;

        if (searchResult.template !== 'UniversityPage') {
          throw new Error('Invalid template');
        }

        const data = await validateUniversityContent(searchResult.content);

        if (data.campusImage?.startsWith('gs://')) {
          const url = await getDownloadURL(ref(storage, data.campusImage));
          data.campusImage = url;
        }

        setUniversityData(data);
      } catch {
        setUniversityData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUniversityData();
  }, [documentId, initialData]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700"></div>
      </div>
    );
  }

  if (!universityData) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-xl text-gray-600">大学情報が見つかりません</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-amber-50">
      {/* ヘッダー */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-stone-900 text-white shadow-2xl relative overflow-hidden border-b-8 border-amber-500">
        {/* 背景装飾 */}
        <div className="absolute inset-0 overflow-hidden opacity-5">
          {[...Array(25)].map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `fade ${5 + Math.random() * 5}s ease-in-out ${Math.random() * 3}s infinite`,
              }}
            >
              {i % 4 === 0 ? (
                <Microscope className="text-white" size={20 + Math.random() * 40} />
              ) : i % 4 === 1 ? (
                <Library className="text-amber-300" size={20 + Math.random() * 40} />
              ) : i % 4 === 2 ? (
                <Globe className="text-blue-300" size={15 + Math.random() * 35} />
              ) : (
                <Award className="text-amber-400" size={15 + Math.random() * 35} />
              )}
            </div>
          ))}
        </div>

        <div className="max-w-8xl mx-auto px-10 py-12 relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-8">
              <div className="bg-gradient-to-br from-amber-500 to-yellow-600 rounded-3xl p-6 shadow-2xl">
                <GraduationCap className="w-20 h-20 text-white" />
              </div>
              <div>
                <h1 className="text-6xl font-bold tracking-tight mb-3 drop-shadow-2xl">{universityData.universityName}</h1>
                <p className="text-2xl opacity-90 font-light tracking-wide">{universityData.englishName}</p>
              </div>
            </div>
            <div className="hidden xl:flex items-center space-x-4">
              <div className="bg-slate-700 rounded-2xl p-4">
                <Microscope className="w-10 h-10 text-amber-400" />
              </div>
              <div className="bg-slate-700 rounded-2xl p-4">
                <Library className="w-10 h-10 text-amber-400" />
              </div>
              <div className="bg-slate-700 rounded-2xl p-4">
                <Globe className="w-10 h-10 text-amber-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-600/20 to-yellow-600/20 backdrop-blur-sm border-l-8 border-amber-400 rounded-r-2xl pl-8 py-6 mb-8 shadow-xl">
            <p className="text-2xl font-light italic flex items-center space-x-4">
              <Star className="w-7 h-7 text-amber-400 fill-amber-400" />
              <span>{universityData.vision}</span>
            </p>
          </div>

          <nav className="flex space-x-10 text-base font-bold border-t-2 border-slate-700 pt-8">
            <button className="hover:text-amber-400 transition-colors flex items-center space-x-2">
              <span>ホーム</span>
            </button>
            <button className="hover:text-amber-400 transition-colors flex items-center space-x-2">
              <span>大学案内</span>
            </button>
            <button className="hover:text-amber-400 transition-colors flex items-center space-x-2">
              <School className="w-4 h-4" />
              <span>学部・学科</span>
            </button>
            <button className="hover:text-amber-400 transition-colors flex items-center space-x-2">
              <span>入試情報</span>
            </button>
            <button className="hover:text-amber-400 transition-colors flex items-center space-x-2">
              <span>キャンパスライフ</span>
            </button>
            <button className="hover:text-amber-400 transition-colors flex items-center space-x-2">
              <Microscope className="w-4 h-4" />
              <span>研究活動</span>
            </button>
          </nav>
        </div>
      </header>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fade {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.3; }
        }
      `}} />

      {/* キャンパス画像 */}
      {universityData.campusImage && (
        <div className="w-full h-[600px] relative shadow-2xl">
          <Image src={universityData.campusImage} alt="キャンパス" fill className="object-cover" unoptimized />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 p-12">
            <div className="max-w-8xl mx-auto">
              <div className="bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-md text-white px-10 py-8 rounded-3xl shadow-2xl border-4 border-amber-500/50">
                <p className="text-4xl font-bold mb-2">知の探求、未来の創造</p>
                <p className="text-xl opacity-90">Pursuit of Knowledge, Creation of Future</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* メインコンテンツ */}
      <main className="max-w-8xl mx-auto px-10 py-20">
        {/* 学長メッセージ */}
        <section className="mb-20">
          <div className="bg-white rounded-3xl shadow-2xl p-12 border-t-8 border-amber-500 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-amber-100 rounded-full opacity-20"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-slate-100 rounded-full opacity-30"></div>
            <div className="relative z-10">
              <div className="flex items-center mb-8">
                <div className="bg-gradient-to-br from-amber-500 to-yellow-600 rounded-2xl p-5 mr-6 shadow-xl">
                  <BookOpen className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-5xl font-bold text-slate-900">学長メッセージ</h2>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-10 mb-10 border-4 border-amber-200 shadow-lg">
                <p className="text-gray-800 leading-relaxed text-xl mb-0 whitespace-pre-wrap">
                  {universityData.presidentMessage}
                </p>
              </div>
              <div className="flex items-center justify-end bg-slate-50 rounded-2xl p-6 shadow-md">
                <Award className="w-10 h-10 text-amber-600 mr-4" />
                <div className="text-right">
                  <p className="text-sm text-gray-500 font-bold">学長</p>
                  <p className="text-2xl font-bold text-slate-900">{universityData.president}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* 左カラム */}
          <div className="lg:col-span-2 space-y-12">
            {/* ニュース */}
            <div className="bg-white rounded-3xl shadow-2xl p-10 border-t-8 border-slate-700">
              <h2 className="text-4xl font-bold text-slate-900 mb-8 pb-6 border-b-4 border-slate-200 flex items-center">
                <div className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl p-4 mr-5 shadow-lg">
                  <Library className="w-10 h-10 text-amber-400" />
                </div>
                ニュース
              </h2>
              <div className="space-y-6">
                {universityData.news.map((news, index) => (
                  <div key={index} className="bg-gradient-to-r from-slate-50 to-amber-50 border-l-8 border-amber-500 rounded-r-2xl pl-8 pr-6 py-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-center space-x-4 mb-3">
                      <span className="bg-white text-slate-700 px-4 py-2 rounded-full text-sm font-bold shadow-sm">{news.date}</span>
                      <span className="px-4 py-2 bg-gradient-to-r from-slate-700 to-slate-900 text-white text-xs font-bold rounded-full">
                        {news.category}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-2xl mb-3">{news.title}</h3>
                    <p className="text-gray-700 leading-relaxed text-lg">{news.summary}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 学部紹介 */}
            <div className="bg-white rounded-3xl shadow-2xl p-10 border-t-8 border-amber-600">
              <h2 className="text-4xl font-bold text-slate-900 mb-8 pb-6 border-b-4 border-slate-200 flex items-center">
                <div className="bg-gradient-to-br from-amber-500 to-yellow-600 rounded-2xl p-4 mr-5 shadow-lg">
                  <School className="w-10 h-10 text-white" />
                </div>
                学部・学科
              </h2>
              <div className="space-y-8">
                {universityData.faculties.map((faculty, index) => (
                  <div key={index} className="bg-gradient-to-br from-amber-50 via-yellow-50 to-slate-50 rounded-2xl p-8 border-4 border-amber-200 shadow-lg hover:shadow-2xl transition-shadow">
                    <h3 className="text-3xl font-bold text-slate-900 mb-4 flex items-center">
                      <div className="bg-amber-600 rounded-xl p-2 mr-3">
                        <GraduationCap className="w-8 h-8 text-white" />
                      </div>
                      {faculty.name}
                    </h3>
                    <p className="text-gray-800 mb-6 text-lg leading-relaxed">{faculty.description}</p>
                    <div className="bg-white rounded-xl p-5 shadow-md">
                      <div className="flex flex-wrap gap-3">
                        {faculty.departments.map((dept, idx) => (
                          <span key={idx} className="px-5 py-2 bg-gradient-to-r from-slate-100 to-amber-100 text-slate-800 font-bold rounded-full border-2 border-amber-300 shadow-sm">
                            {dept}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* キャンパス情報 */}
            <div className="bg-white rounded-3xl shadow-2xl p-10 border-t-8 border-blue-600">
              <h2 className="text-4xl font-bold text-slate-900 mb-8 pb-6 border-b-4 border-slate-200 flex items-center">
                <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl p-4 mr-5 shadow-lg">
                  <Building2 className="w-10 h-10 text-white" />
                </div>
                キャンパス情報
              </h2>
              <div className="space-y-6">
                {universityData.campuses.map((campus, index) => (
                  <div key={index} className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-8 hover:shadow-xl transition-shadow">
                    <h3 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
                      <MapPin className="w-7 h-7 mr-3 text-blue-600" />
                      {campus.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 flex items-start bg-white rounded-lg p-3 shadow-sm">
                      <MapPin className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0 text-blue-600" />
                      {campus.address}
                    </p>
                    <p className="text-gray-800 text-lg leading-relaxed">{campus.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 右カラム */}
          <div className="space-y-10">
            {/* 大学情報 */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 border-t-8 border-slate-700">
              <h2 className="text-2xl font-bold text-slate-900 mb-8 pb-4 border-b-4 border-slate-200 flex items-center">
                <div className="bg-slate-700 rounded-xl p-3 mr-3">
                  <School className="w-7 h-7 text-amber-400" />
                </div>
                大学情報
              </h2>
              <div className="space-y-5">
                <div className="bg-amber-50 rounded-2xl p-5 flex items-start space-x-4 border-3 border-amber-200 shadow-md">
                  <MapPin className="w-7 h-7 text-amber-600 mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-amber-700 mb-2">所在地</div>
                    <div className="text-slate-800 text-sm leading-relaxed">{universityData.address}</div>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-2xl p-5 flex items-start space-x-4 border-3 border-blue-200 shadow-md">
                  <Phone className="w-7 h-7 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-blue-700 mb-2">電話番号</div>
                    <div className="text-slate-800 text-sm">{universityData.phone}</div>
                  </div>
                </div>
                <div className="bg-purple-50 rounded-2xl p-5 flex items-start space-x-4 border-3 border-purple-200 shadow-md">
                  <Mail className="w-7 h-7 text-purple-600 mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-purple-700 mb-2">Email</div>
                    <div className="text-slate-800 break-all text-sm">{universityData.email}</div>
                  </div>
                </div>
                <div className="bg-green-50 rounded-2xl p-5 flex items-start space-x-4 border-3 border-green-200 shadow-md">
                  <School className="w-7 h-7 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-green-700 mb-2">設立</div>
                    <div className="text-slate-800 text-sm">{universityData.established}</div>
                  </div>
                </div>
                <div className="bg-orange-50 rounded-2xl p-5 flex items-start space-x-4 border-3 border-orange-200 shadow-md">
                  <Users className="w-7 h-7 text-orange-600 mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-orange-700 mb-2">学生数</div>
                    <div className="text-slate-800 font-bold text-lg">{universityData.studentCount.toLocaleString()}名</div>
                  </div>
                </div>
              </div>
            </div>

            {/* クイックリンク */}
            <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 text-white rounded-3xl shadow-2xl p-8 border-4 border-white">
              <div className="flex items-center justify-center mb-6">
                <GraduationCap className="w-12 h-12" />
              </div>
              <h3 className="font-bold text-2xl mb-6 text-center">受験生の方へ</h3>
              <div className="space-y-4">
                <button className="w-full bg-white text-amber-600 font-bold py-4 rounded-xl hover:bg-amber-50 transition-colors shadow-xl text-lg">
                  入試情報
                </button>
                <button className="w-full bg-white text-amber-600 font-bold py-4 rounded-xl hover:bg-amber-50 transition-colors shadow-xl text-lg">
                  オープンキャンパス
                </button>
                <button className="w-full bg-white text-amber-600 font-bold py-4 rounded-xl hover:bg-amber-50 transition-colors shadow-xl text-lg">
                  資料請求
                </button>
              </div>
            </div>

            {/* 在学生・卒業生向け */}
            <div className="bg-gradient-to-br from-slate-100 to-stone-100 rounded-3xl p-8 border-4 border-slate-300 shadow-xl">
              <h3 className="font-bold text-slate-900 text-xl mb-6 flex items-center">
                <Library className="w-7 h-7 mr-3 text-slate-700" />
                在学生・卒業生の方へ
              </h3>
              <div className="space-y-3">
                <button className="w-full text-left px-6 py-4 bg-white rounded-xl hover:bg-slate-50 transition-colors text-slate-700 font-bold shadow-md border-2 border-slate-200">
                  学生ポータル
                </button>
                <button className="w-full text-left px-6 py-4 bg-white rounded-xl hover:bg-slate-50 transition-colors text-slate-700 font-bold shadow-md border-2 border-slate-200">
                  図書館システム
                </button>
                <button className="w-full text-left px-6 py-4 bg-white rounded-xl hover:bg-slate-50 transition-colors text-slate-700 font-bold shadow-md border-2 border-slate-200">
                  就職支援
                </button>
                <button className="w-full text-left px-6 py-4 bg-white rounded-xl hover:bg-slate-50 transition-colors text-slate-700 font-bold shadow-md border-2 border-slate-200">
                  同窓会
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-gradient-to-r from-slate-900 via-slate-800 to-stone-900 text-white mt-24 py-16 shadow-2xl border-t-8 border-amber-500">
        <div className="max-w-8xl mx-auto px-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <h4 className="font-bold text-2xl mb-6 flex items-center">
                <Library className="w-6 h-6 mr-3 text-amber-400" />
                大学案内
              </h4>
              <ul className="space-y-3 text-base opacity-90">
                <li className="hover:text-amber-400 cursor-pointer transition-colors">学長メッセージ</li>
                <li className="hover:text-amber-400 cursor-pointer transition-colors">建学の精神</li>
                <li className="hover:text-amber-400 cursor-pointer transition-colors">沿革</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-2xl mb-6 flex items-center">
                <GraduationCap className="w-6 h-6 mr-3 text-amber-400" />
                学部・大学院
              </h4>
              <ul className="space-y-3 text-base opacity-90">
                {universityData.faculties.map((f, i) => (
                  <li key={i} className="hover:text-amber-400 cursor-pointer transition-colors">{f.name}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-2xl mb-6 flex items-center">
                <Mail className="w-6 h-6 mr-3 text-amber-400" />
                お問い合わせ
              </h4>
              <ul className="space-y-3 text-base opacity-90">
                <li className="hover:text-amber-400 cursor-pointer transition-colors">資料請求</li>
                <li className="hover:text-amber-400 cursor-pointer transition-colors">アクセス</li>
                <li className="hover:text-amber-400 cursor-pointer transition-colors">お問い合わせフォーム</li>
              </ul>
            </div>
          </div>
          <div className="text-center border-t-4 border-slate-700 pt-10">
            <div className="flex items-center justify-center space-x-6 mb-6">
              <Microscope className="w-10 h-10 text-amber-400" />
              <Library className="w-10 h-10 text-amber-400" />
              <Globe className="w-10 h-10 text-amber-400" />
              <Trophy className="w-10 h-10 text-amber-400" />
            </div>
            <p className="text-xl font-bold mb-3">© 2025 {universityData.universityName}. All Rights Reserved.</p>
            <p className="text-sm opacity-75">世界に羽ばたく知性と品格を</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
