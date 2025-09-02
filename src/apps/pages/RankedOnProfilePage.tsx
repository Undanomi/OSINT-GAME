'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { RankedOnUser } from '@/types/rankedon';
import { UnifiedSearchResult } from '@/types/search';
import { 
  Search, Bell, MessageSquare, Home, Users, Briefcase, Grid3x3,
  Plus, Camera, Edit2, MoreHorizontal, ThumbsUp, MessageCircle,
  Share2, Send, Eye, TrendingUp, X, MapPin,
  Mail, Phone, Globe, Award, Languages, Star,
  ExternalLink
} from 'lucide-react';

interface RankedOnProfilePageProps {
  documentId: string;
  initialData: UnifiedSearchResult;
}

export const RankedOnProfilePage: React.FC<RankedOnProfilePageProps> = ({ documentId, initialData }) => {
  const [userData, setUserData] = useState<RankedOnUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'activity' | 'experience' | 'education'>('activity');

  const handlePhotoClick = useCallback((photo: string) => {
    setSelectedPhoto(photo);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedPhoto(null);
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const searchResult = initialData;
        
        if (searchResult.template !== 'RankedOnProfilePage') {
          console.error('Invalid template for RankedOn:', searchResult.template);
          throw new Error('Invalid template');
        }
        
        const rankedOnContent = searchResult.content as unknown as RankedOnUser;
          
          
          const data: RankedOnUser = {
            userId: documentId,
            name: rankedOnContent.name,
            profileImage: rankedOnContent.profileImage,
            backgroundImage: rankedOnContent.backgroundImage,
            headline: rankedOnContent.headline,
            currentPosition: rankedOnContent.currentPosition,
            currentCompany: rankedOnContent.currentCompany,
            location: rankedOnContent.location,
            industry: rankedOnContent.industry,
            summary: rankedOnContent.summary,
            connectionsCount: rankedOnContent.connectionsCount,
            profileViews: rankedOnContent.profileViews,
            searchAppearances: rankedOnContent.searchAppearances,
            experience: rankedOnContent.experience || [],
            education: rankedOnContent.education || [],
            skills: rankedOnContent.skills || [],
            certifications: rankedOnContent.certifications,
            posts: rankedOnContent.posts || [],
            recommendations: rankedOnContent.recommendations,
            languages: rankedOnContent.languages,
            email: rankedOnContent.email,
            phone: rankedOnContent.phone,
            website: rankedOnContent.website,
            rankedonUrl: rankedOnContent.rankedonUrl
          };
          
          // Storage URLの変換
          if (data.profileImage?.startsWith('gs://')) {
            data.profileImage = await getDownloadURL(ref(storage, data.profileImage));
          }
          if (data.backgroundImage?.startsWith('gs://')) {
            data.backgroundImage = await getDownloadURL(ref(storage, data.backgroundImage));
          }
          
          // 投稿画像のURL変換
          for (const post of data.posts) {
            if (post.image?.startsWith('gs://')) {
              post.image = await getDownloadURL(ref(storage, post.image));
            }
            if (post.authorImage?.startsWith('gs://')) {
              post.authorImage = await getDownloadURL(ref(storage, post.authorImage));
            }
          }
          
          // 会社ロゴのURL変換
          for (const exp of data.experience) {
            if (exp.companyLogo?.startsWith('gs://')) {
              exp.companyLogo = await getDownloadURL(ref(storage, exp.companyLogo));
            }
          }
          
          // 学校ロゴのURL変換
          for (const edu of data.education) {
            if (edu.schoolLogo?.startsWith('gs://')) {
              edu.schoolLogo = await getDownloadURL(ref(storage, edu.schoolLogo));
            }
          }
          
          // 推薦者画像のURL変換
          if (data.recommendations) {
            for (const rec of data.recommendations) {
              if (rec.recommenderImage?.startsWith('gs://')) {
                rec.recommenderImage = await getDownloadURL(ref(storage, rec.recommenderImage));
              }
            }
          }
          
          setUserData(data);
      } catch {
        // エラーは静かに処理
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [documentId, initialData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-xl text-gray-600">ユーザーが見つかりません</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <span className="bg-[#0077b5] text-white px-2 py-1 rounded text-[24px] font-bold">On</span>
              </div>
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="検索"
                  className="bg-gray-100 pl-10 pr-4 py-1.5 w-64 rounded focus:outline-none focus:ring-2 focus:ring-[#0077b5]"
                />
              </div>
            </div>
            
            <nav className="flex items-center space-x-6">
              <button className="flex flex-col items-center text-gray-600 hover:text-black">
                <Home className="w-5 h-5" />
                <span className="text-xs mt-1 hidden lg:block">ホーム</span>
              </button>
              <button className="flex flex-col items-center text-gray-600 hover:text-black">
                <Users className="w-5 h-5" />
                <span className="text-xs mt-1 hidden lg:block">ネットワーク</span>
              </button>
              <button className="flex flex-col items-center text-gray-600 hover:text-black">
                <Briefcase className="w-5 h-5" />
                <span className="text-xs mt-1 hidden lg:block">求人</span>
              </button>
              <button className="flex flex-col items-center text-gray-600 hover:text-black">
                <MessageSquare className="w-5 h-5" />
                <span className="text-xs mt-1 hidden lg:block">メッセージ</span>
              </button>
              <button className="flex flex-col items-center text-gray-600 hover:text-black relative">
                <Bell className="w-5 h-5" />
                <span className="text-xs mt-1 hidden lg:block">通知</span>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">3</span>
              </button>
              <div className="border-l pl-4">
                <button className="flex flex-col items-center text-gray-600 hover:text-black">
                  <Grid3x3 className="w-5 h-5" />
                  <span className="text-xs mt-1 hidden lg:block">ビジネス</span>
                </button>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Section */}
          <div className="lg:col-span-2 space-y-4">
            {/* Profile Card */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {/* Background Image */}
              <div className="h-48 bg-gradient-to-r from-blue-400 to-blue-600 relative">
                {userData.backgroundImage && (
                  <Image
                    src={userData.backgroundImage}
                    alt="Background"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                )}
                <button className="absolute top-4 right-4 bg-white p-2 rounded-full hover:bg-gray-100">
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* Profile Info */}
              <div className="px-6 pb-6">
                <div className="flex justify-between items-start -mt-12">
                  <div 
                    className="w-32 h-32 relative cursor-pointer"
                    onClick={() => handlePhotoClick(userData.profileImage)}
                  >
                    <Image
                      src={userData.profileImage}
                      alt={userData.name}
                      fill
                      className="rounded-full border-4 border-white bg-white object-cover"
                      unoptimized
                    />
                  </div>
                  <button className="mt-16 p-2 hover:bg-gray-100 rounded-full">
                    <Edit2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-4">
                  <h1 className="text-2xl font-bold">{userData.name}</h1>
                  <p className="text-gray-700 mt-1">{userData.headline}</p>
                  <p className="text-gray-500 text-sm mt-2">
                    {userData.currentPosition && `${userData.currentPosition} · `}
                    {userData.currentCompany}
                  </p>
                  <div className="flex items-center text-gray-500 text-sm mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    {userData.location}
                    {userData.industry && ` · ${userData.industry}`}
                  </div>
                  <div className="mt-3">
                    <span className="text-[#0077b5] font-semibold cursor-default">
                      {userData.connectionsCount}+ つながり
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2 mt-4">
                    <button className="bg-[#0077b5] text-white px-4 py-1.5 rounded-full hover:bg-[#005885] flex items-center">
                      <Plus className="w-4 h-4 mr-1" />
                      つながりを申請
                    </button>
                    <button className="border border-[#0077b5] text-[#0077b5] px-4 py-1.5 rounded-full hover:bg-gray-50 flex items-center">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      メッセージ
                    </button>
                    <button className="border border-gray-300 text-gray-700 px-4 py-1.5 rounded-full hover:bg-gray-50">
                      その他
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Analytics Card */}
            {(userData.profileViews || userData.searchAppearances) && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">アナリティクス</h2>
                <div className="flex items-center text-gray-500 text-sm mb-2">
                  <Eye className="w-4 h-4 mr-1" />
                  非公開モード
                </div>
                <div className="space-y-3">
                  {userData.profileViews && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Eye className="w-5 h-5 text-gray-600 mr-3" />
                        <span>プロフィールビュー</span>
                      </div>
                      <span className="font-semibold">{userData.profileViews}</span>
                    </div>
                  )}
                  {userData.searchAppearances && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <TrendingUp className="w-5 h-5 text-gray-600 mr-3" />
                        <span>検索での表示回数</span>
                      </div>
                      <span className="font-semibold">{userData.searchAppearances}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* About Section */}
            {userData.summary && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">概要</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{userData.summary}</p>
              </div>
            )}

            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow">
              <div className="border-b">
                <nav className="flex">
                  <button
                    className={`px-6 py-3 font-medium border-b-2 ${
                      activeTab === 'activity' 
                        ? 'text-green-600 border-green-600' 
                        : 'text-gray-600 border-transparent hover:text-gray-900'
                    }`}
                    onClick={() => setActiveTab('activity')}
                  >
                    アクティビティ
                  </button>
                  <button
                    className={`px-6 py-3 font-medium border-b-2 ${
                      activeTab === 'experience' 
                        ? 'text-green-600 border-green-600' 
                        : 'text-gray-600 border-transparent hover:text-gray-900'
                    }`}
                    onClick={() => setActiveTab('experience')}
                  >
                    経歴
                  </button>
                  <button
                    className={`px-6 py-3 font-medium border-b-2 ${
                      activeTab === 'education' 
                        ? 'text-green-600 border-green-600' 
                        : 'text-gray-600 border-transparent hover:text-gray-900'
                    }`}
                    onClick={() => setActiveTab('education')}
                  >
                    学歴
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {/* Activity Tab */}
                {activeTab === 'activity' && (
                  <div className="space-y-4">
                    {userData.posts.map((post, idx) => (
                      <div key={idx} className="border-b pb-4 last:border-0">
                        <div className="flex space-x-3">
                          <div className="w-12 h-12 relative flex-shrink-0">
                            <Image
                              src={post.authorImage || userData.profileImage}
                              alt={post.authorName || userData.name}
                              fill
                              className="rounded-full object-cover"
                              unoptimized
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <div>
                                <h3 className="font-semibold">{post.authorName || userData.name}</h3>
                                <p className="text-sm text-gray-500">{post.authorTitle || userData.headline}</p>
                                <p className="text-xs text-gray-500">{post.timestamp}</p>
                              </div>
                              <button className="p-1 hover:bg-gray-100 rounded">
                                <MoreHorizontal className="w-5 h-5 text-gray-600" />
                              </button>
                            </div>
                            
                            <div className="mt-3">
                              <p className="text-gray-800">{post.content}</p>
                              {post.image && (
                                <div 
                                  className="mt-3 relative h-64 cursor-pointer"
                                  onClick={() => handlePhotoClick(post.image!)}
                                >
                                  <Image
                                    src={post.image}
                                    alt="Post"
                                    fill
                                    className="object-cover rounded-lg hover:opacity-95"
                                    unoptimized
                                  />
                                </div>
                              )}
                            </div>

                            {/* Post Stats */}
                            {post.impressions && (
                              <div className="mt-2 text-sm text-gray-500">
                                {post.impressions.toLocaleString()} インプレッション
                              </div>
                            )}

                            <div className="flex items-center justify-between mt-3 pt-3 border-t">
                              <button className="flex items-center space-x-2 text-gray-600 hover:text-[#0077b5]">
                                <ThumbsUp className="w-5 h-5" />
                                <span className="text-sm">{post.likes}</span>
                              </button>
                              <button className="flex items-center space-x-2 text-gray-600 hover:text-[#0077b5]">
                                <MessageCircle className="w-5 h-5" />
                                <span className="text-sm">{post.comments}</span>
                              </button>
                              <button className="flex items-center space-x-2 text-gray-600 hover:text-[#0077b5]">
                                <Share2 className="w-5 h-5" />
                                <span className="text-sm">{post.reposts}</span>
                              </button>
                              <button className="flex items-center space-x-2 text-gray-600 hover:text-[#0077b5]">
                                <Send className="w-5 h-5" />
                                <span className="text-sm">送信</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Experience Tab */}
                {activeTab === 'experience' && (
                  <div className="space-y-6">
                    {userData.experience.map((exp, idx) => (
                      <div key={idx} className="flex space-x-4">
                        {exp.companyLogo && (
                          <div className="w-12 h-12 relative flex-shrink-0">
                            <Image
                              src={exp.companyLogo}
                              alt={exp.company}
                              fill
                              className="object-cover rounded"
                              unoptimized
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold">{exp.title}</h3>
                          <p className="text-gray-700">{exp.company} · {exp.employmentType}</p>
                          <p className="text-sm text-gray-500">
                            {exp.startDate} - {exp.current ? '現在' : exp.endDate}
                            {exp.location && ` · ${exp.location}`}
                          </p>
                          {exp.description && (
                            <p className="mt-2 text-gray-700">{exp.description}</p>
                          )}
                          {exp.skills && exp.skills.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {exp.skills.map((skill, skillIdx) => (
                                <span key={skillIdx} className="bg-gray-100 px-2 py-1 rounded text-sm">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Education Tab */}
                {activeTab === 'education' && (
                  <div className="space-y-6">
                    {userData.education.map((edu, idx) => (
                      <div key={idx} className="flex space-x-4">
                        {edu.schoolLogo && (
                          <div className="w-12 h-12 relative flex-shrink-0">
                            <Image
                              src={edu.schoolLogo}
                              alt={edu.school}
                              fill
                              className="object-cover rounded"
                              unoptimized
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold">{edu.school}</h3>
                          {edu.degree && (
                            <p className="text-gray-700">
                              {edu.degree}
                              {edu.fieldOfStudy && ` · ${edu.fieldOfStudy}`}
                            </p>
                          )}
                          <p className="text-sm text-gray-500">
                            {edu.startYear} - {edu.endYear || '現在'}
                          </p>
                          {edu.activities && (
                            <p className="mt-2 text-gray-700">{edu.activities}</p>
                          )}
                          {edu.description && (
                            <p className="mt-2 text-gray-700">{edu.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Skills Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">スキル</h2>
                <span className="text-[#0077b5] text-sm cursor-default">すべて表示</span>
              </div>
              <div className="space-y-3">
                {userData.skills.slice(0, 5).map((skill, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{skill.name}</span>
                      {skill.endorsements && (
                        <span className="text-sm text-gray-500">{skill.endorsements}</span>
                      )}
                    </div>
                    {skill.endorsements && (
                      <div className="flex items-center mt-1">
                        <div className="flex -space-x-2">
                          {[...Array(Math.min(3, skill.endorsements))].map((_, i) => (
                            <div key={i} className="w-6 h-6 bg-gray-300 rounded-full border-2 border-white"></div>
                          ))}
                        </div>
                        {skill.endorsements > 3 && (
                          <span className="ml-2 text-xs text-gray-500">
                            +{skill.endorsements - 3} 人が推薦
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Certifications Card */}
            {userData.certifications && userData.certifications.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">資格・認定</h2>
                  <Award className="w-5 h-5 text-gray-600" />
                </div>
                <div className="space-y-3">
                  {userData.certifications.map((cert, idx) => (
                    <div key={idx} className="border-b pb-3 last:border-0">
                      <h3 className="font-medium">{cert.name}</h3>
                      <p className="text-sm text-gray-600">{cert.issuingOrganization}</p>
                      <p className="text-xs text-gray-500">発行: {cert.issueDate}</p>
                      {cert.credentialId && (
                        <p className="text-xs text-gray-500">認定ID: {cert.credentialId}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Languages Card */}
            {userData.languages && userData.languages.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">言語</h2>
                  <Languages className="w-5 h-5 text-gray-600" />
                </div>
                <div className="space-y-2">
                  {userData.languages.map((lang, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="font-medium">{lang.name}</span>
                      <span className="text-sm text-gray-600">{lang.proficiency}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations Card */}
            {userData.recommendations && userData.recommendations.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">推薦</h2>
                  <Star className="w-5 h-5 text-gray-600" />
                </div>
                <div className="space-y-3">
                  {userData.recommendations.map((rec, idx) => (
                    <div key={idx} className="border-b pb-3 last:border-0">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 relative flex-shrink-0">
                          <Image
                            src={rec.recommenderImage || 'https://via.placeholder.com/40'}
                            alt={rec.recommenderName}
                            fill
                            className="rounded-full object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">{rec.recommenderName}</h3>
                          <p className="text-xs text-gray-600">{rec.recommenderTitle}</p>
                          <p className="text-xs text-gray-500">{rec.relationship}</p>
                          <p className="text-sm text-gray-700 mt-2 line-clamp-3">{rec.text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Info Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">連絡先情報</h2>
              <div className="space-y-3">
                {userData.email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-600" />
                    <span className="text-sm">{userData.email}</span>
                  </div>
                )}
                {userData.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-600" />
                    <span className="text-sm">{userData.phone}</span>
                  </div>
                )}
                {userData.website && (
                  <div className="flex items-center space-x-3">
                    <Globe className="w-5 h-5 text-gray-600" />
                    <span className="text-sm text-[#0077b5] cursor-default">
                      {userData.website.replace('https://', '')}
                    </span>
                  </div>
                )}
                {userData.rankedonUrl && (
                  <div className="flex items-center space-x-3">
                    <ExternalLink className="w-5 h-5 text-gray-600" />
                    <span className="text-sm text-[#0077b5] cursor-default">
                      プロフィールURL
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <>
          <div 
            className="fixed inset-0 bg-black/70 z-40"
            onClick={handleCloseModal}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="relative pointer-events-auto">
              <button
                className="absolute -top-10 right-0 text-white bg-black/50 rounded-full p-2 hover:bg-black/70"
                onClick={handleCloseModal}
              >
                <X className="w-6 h-6" />
              </button>
              <Image
                src={selectedPhoto}
                alt="Enlarged photo"
                width={800}
                height={600}
                className="object-contain max-w-[90vw] max-h-[80vh] w-auto h-auto rounded"
                unoptimized
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};