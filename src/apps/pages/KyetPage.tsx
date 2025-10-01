'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import {
  MapPin,
  Phone,
  Mail,
  Calendar,
  Users,
  Star,
  Clock,
  DollarSign,
  Menu,
  X,
} from 'lucide-react';

import type { KyetEvent, KyetStaff, KyetTour, KyetContent } from '@/types/kyet';
import type { UnifiedSearchResult } from '@/types/search';
import { validateKyetContent } from '@/actions/kyetValidation';

type Achievement = KyetContent['achievements'][number];
interface KyetPageProps {
  documentId: string;
  initialData: UnifiedSearchResult;
}

// スクロールアニメーション用のカスタムフック
const useScrollAnimation = () => {
  const elementRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const refCurrent = elementRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    if (refCurrent) {
      observer.observe(refCurrent);
    }
    return () => {
      if (refCurrent) {
        observer.unobserve(refCurrent);
      }
    };
  }, []);

  return { elementRef, isVisible };
};

// ローリング画像コンポーネント
const RollingImages: React.FC<{ images: string[] }> = ({ images }) => {
  return (
    <div className="relative overflow-hidden py-16 bg-gradient-to-r from-green-100/30 to-emerald-100/30 backdrop-blur-sm">
      <div className="absolute inset-0 flex items-center">
        <div className="flex animate-scroll space-x-6">
          {/* 最初のセット */}
          {images.map((src, index) => (
            <div key={`first-${index}`} className="flex-shrink-0 w-72 h-48 relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <Image
                src={src}
                alt={`Rolling image ${index + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 300px"
                className="object-cover"
              />
            </div>
          ))}
          {/* 重複したセット（無限スクロール効果用） */}
          {images.map((src, index) => (
            <div key={`second-${index}`} className="flex-shrink-0 w-72 h-48 relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <Image
                src={src}
                alt={`Rolling image ${index + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 300px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>
      <div className="relative z-10 text-center">
        <div className="bg-green-900/70 backdrop-blur-md inline-block px-8 py-4 rounded-2xl border border-green-300/20">
          <h3 className="text-2xl font-bold text-white mb-2">素晴らしい体験の数々</h3>
          <p className="text-white opacity-90">自然との触れ合いで心に残る思い出を</p>
        </div>
      </div>
    </div>
  );
};

// スクロールアニメーション付きAchievementsセクション
const AchievementsSection: React.FC<{ achievements: Achievement[] }> = ({
  achievements,
}) => {
  const { elementRef, isVisible } = useScrollAnimation();

  if (achievements.length === 0) return null;

  return (
    <section ref={elementRef} className="py-20 bg-gradient-to-br from-green-50/50 via-white/80 to-emerald-50/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">実績・成果</h2>
          <p className="text-xl text-gray-600">私たち KYET の活動</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {achievements.map((achievement, index) => (
            <div
              key={index}
              className={`text-center transform transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              style={{ transitionDelay: `${index * 200}ms` }}
            >
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 group h-full flex flex-col">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">{achievement.icon}</div>
                <h3 className="text-1xl font-bold text-green-700 mb-3">{achievement.title}</h3>
                <p className="text-gray-600 leading-relaxed flex-grow">{achievement.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// スクロールアニメーション付きEventsセクション
const EventsSection: React.FC<{
  events: KyetEvent[];
  getEventTypeText: (type: string) => string;
}> = ({ events, getEventTypeText }) => {
  const { elementRef, isVisible } = useScrollAnimation();

  if (events.length === 0) return null;

  return (
    <section ref={elementRef} id="events" className="py-20 bg-gradient-to-br from-green-100/40 via-white/70 to-emerald-100/40 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">開催予定イベント</h2>
          <p className="text-xl text-gray-600">スキルアップやチームビルディングにご活用ください</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {events.map((event, index) => (
            <div
              key={event.id}
              className={`bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-700 transform hover:scale-105 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className="relative h-56 overflow-hidden">
                <Image
                  src={event.images[0] || 'https://picsum.photos/400/300?random=2'}
                  alt={event.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
                  className="object-cover transition-transform duration-700 hover:scale-110"
                />
                <div className="absolute top-4 right-4">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {getEventTypeText(event.eventType)}
                  </span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>

              <div className="p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-3 hover:text-blue-600 transition-colors">{event.title}</h3>
                <p className="text-gray-600 mb-6 leading-relaxed line-clamp-3">{event.description}</p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-3 text-blue-600" />
                    <span>{event.date} {event.time}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="w-4 h-4 mr-3 text-blue-600" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <DollarSign className="w-4 h-4 mr-3 text-blue-600" />
                    <span className="font-semibold text-lg text-gray-900">¥{event.price.toLocaleString()}</span>
                  </div>
                  {event.maxParticipants && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="w-4 h-4 mr-3 text-blue-600" />
                      <span>{event.currentParticipants || 0} / {event.maxParticipants}名</span>
                    </div>
                  )}
                </div>

                <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-6 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                  参加申し込み
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// スクロールアニメーション付きStaffセクション
const StaffSection: React.FC<{ staff: KyetStaff[] }> = ({ staff }) => {
  const { elementRef, isVisible } = useScrollAnimation();

  if (staff.length === 0) return null;

  return (
    <section ref={elementRef} className="py-20 bg-gradient-to-br from-white/90 via-green-50/30 to-white/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">スタッフ紹介</h2>
          <p className="text-xl text-gray-600">経験豊富なスタッフがサポートします</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {staff.map((staffMember, index) => (
            <div
              key={index}
              className={`text-center transform transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group h-full flex flex-col">
                <div className="relative w-48 h-48 mx-auto mb-6">
                  <Image
                    src={staffMember.image}
                    alt={staffMember.name}
                    fill
                    sizes="200px"
                    className="object-cover rounded-full transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-t from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">{staffMember.name}</h3>
                <p className="text-green-600 font-medium mb-4 text-sm">{staffMember.role}</p>
                <p className="text-gray-600 leading-relaxed flex-grow">{staffMember.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// スクロールアニメーション付きFeaturedToursセクション
const FeaturedToursSection: React.FC<{
  tours: KyetTour[];
  getDifficultyColor: (difficulty: string) => string;
  getDifficultyText: (difficulty: string) => string;
}> = ({ tours, getDifficultyColor, getDifficultyText }) => {
  const { elementRef, isVisible } = useScrollAnimation();

  if (tours.length === 0) return null;

  return (
    <section ref={elementRef} id="tours" className="py-20 bg-gradient-to-br from-emerald-50/60 via-white/80 to-green-50/60 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">おすすめツアー</h2>
          <p className="text-xl text-gray-600">自然の中で特別な体験をお楽しみください</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tours.map((tour, index) => (
            <div
              key={tour.id}
              className={`bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:scale-105 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className="relative h-56 overflow-hidden">
                <Image
                  src={tour.images[0] || 'https://picsum.photos/400/300?random=1'}
                  alt={tour.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
                  className="object-cover transition-transform duration-700 hover:scale-110"
                />
                <div className="absolute top-4 right-4">
                  <span className={`px-4 py-2 rounded-full text-sm font-medium shadow-lg ${getDifficultyColor(tour.difficulty)}`}>
                    {getDifficultyText(tour.difficulty)}
                  </span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>

              <div className="p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-3 hover:text-green-600 transition-colors">{tour.title}</h3>
                <p className="text-gray-600 mb-6 line-clamp-3 leading-relaxed">{tour.description}</p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-3 text-green-600" />
                    <span>{tour.duration}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="w-4 h-4 mr-3 text-green-600" />
                    <span>{tour.location}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <DollarSign className="w-4 h-4 mr-3 text-green-600" />
                    <span className="font-semibold text-lg text-gray-900">¥{tour.price.toLocaleString()}</span>
                  </div>
                  {tour.maxParticipants && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="w-4 h-4 mr-3 text-green-600" />
                      <span>{tour.currentParticipants || 0} / {tour.maxParticipants}名</span>
                    </div>
                  )}
                </div>

                <button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 px-6 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                  詳細を見る
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const KyetPage: React.FC<KyetPageProps> = ({ documentId, initialData }) => {
  const [kyetData, setKyetData] = useState<KyetContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [heroAnimationComplete, setHeroAnimationComplete] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const fetchKyetData = async () => {
      try {
        console.log('Using provided initial data for document ID:', documentId);
        const searchResult = initialData;

        if (searchResult.template !== 'KyetPage') {
          console.error('Invalid template for Kyet:', searchResult.template);
          throw new Error('Invalid template');
        }

        const data = await validateKyetContent(searchResult.content);
        console.log('Validated data from Firestore:', data);

        // gs:// URLをHTTPS URLに並列変換
        const urlConversionPromises: Promise<void>[] = [];

        // ヒーロー画像
        if (data.heroImage?.startsWith('gs://')) {
          console.log('Converting hero image:', data.heroImage);
          urlConversionPromises.push(
            getDownloadURL(ref(storage, data.heroImage)).then(url => {
              data.heroImage = url;
              console.log('Converted hero image to:', url);
            })
          );
        }

        // ローリング画像の変換（並列）
        data.rollingImages.forEach((image, index) => {
          if (image?.startsWith('gs://')) {
            console.log('Converting rolling image:', image);
            urlConversionPromises.push(
              getDownloadURL(ref(storage, image)).then(url => {
                data.rollingImages[index] = url;
                console.log(`Converted rolling image ${index} to:`, url);
              })
            );
          }
        });

        // ツアー画像の変換（並列）
        data.featuredTours.forEach((tour) => {
          tour.images.forEach((image, imageIndex) => {
            if (image?.startsWith('gs://')) {
              console.log('Converting tour image:', image);
              urlConversionPromises.push(
                getDownloadURL(ref(storage, image)).then(url => {
                  tour.images[imageIndex] = url;
                  console.log(`Converted tour image to:`, url);
                })
              );
            }
          });
        });

        // イベント画像の変換（並列）
        data.upcomingEvents.forEach((event) => {
          event.images.forEach((image, imageIndex) => {
            if (image?.startsWith('gs://')) {
              console.log('Converting event image:', image);
              urlConversionPromises.push(
                getDownloadURL(ref(storage, image)).then(url => {
                  event.images[imageIndex] = url;
                  console.log(`Converted event image to:`, url);
                })
              );
            }
          });
        });

        // スタッフ画像の変換（並列）
        data.staff.forEach((staff) => {
          if (staff.image?.startsWith('gs://')) {
            console.log('Converting staff image:', staff.image);
            urlConversionPromises.push(
              getDownloadURL(ref(storage, staff.image)).then(url => {
                staff.image = url;
                console.log('Converted staff image to:', url);
              })
            );
          }
        });

        // すべてのURL変換を並列実行
        console.log(`Starting parallel conversion of ${urlConversionPromises.length} images...`);
        await Promise.all(urlConversionPromises);
        console.log('All URL conversions completed');

        console.log('Final data after URL conversion:', data);
        setKyetData(data);
      } catch (error) {
        console.error('Error fetching Kyet data:', error);
        setKyetData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchKyetData();
  }, [documentId, initialData]);

  // ヒーローアニメーション制御
  useEffect(() => {
    const timer = setTimeout(() => {
      setHeroAnimationComplete(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '初心者向け';
      case 'intermediate': return '中級者向け';
      case 'advanced': return '上級者向け';
      default: return difficulty;
    }
  };

  const getEventTypeText = (type: string) => {
    switch (type) {
      case 'workshop': return 'ワークショップ';
      case 'seminar': return 'セミナー';
      case 'outdoor_activity': return 'アウトドア活動';
      case 'team_building': return 'チームビルディング';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (!kyetData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-xl text-gray-600">データが見つかりません</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-25 to-emerald-50 font-['Noto_Sans_JP',sans-serif]">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;600;700;800;900&display=swap');
        @keyframes animate-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-scroll {
          animation: animate-scroll 30s linear infinite;
        }

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        @keyframes naturalFall {
          to {
            top: 120%;
          }
        }

        @keyframes naturalSway1 {
          from {
            transform: translateX(0px) rotate(0deg);
          }
          to {
            transform: translateX(100px) rotate(-25deg);
          }
        }

        @keyframes naturalSway2 {
          from {
            transform: translateX(100px) rotate(-25deg);
          }
          to {
            transform: translateX(0px) rotate(0deg);
          }
        }

        .natural-leaf {
          position: absolute;
          list-style: none;
          top: -50px;
          border-radius: 0% 70%;
          pointer-events: none;
        }

        .natural-leaf:nth-child(1) {
          left: 0%;
          top: -60px;
          width: 24px;
          height: 15px;
          background-color: #10b981;
          animation: naturalFall 10s linear infinite, naturalSway1 3s ease-in-out infinite alternate;
          animation-delay: 2s;
        }

        .natural-leaf:nth-child(2) {
          left: 5%;
          top: -70px;
          width: 13px;
          height: 9px;
          background-color: #059669;
          animation: naturalFall 15s linear infinite, naturalSway1 2s ease-in-out infinite alternate;
          animation-delay: 8s;
        }

        .natural-leaf:nth-child(3) {
          left: 15%;
          top: -50px;
          width: 16px;
          height: 10px;
          background-color: #34d399;
          animation: naturalFall 9s linear infinite, naturalSway1 3.5s ease-in-out infinite alternate;
          animation-delay: 13s;
        }

        .natural-leaf:nth-child(4) {
          left: 30%;
          top: -70px;
          width: 16px;
          height: 10px;
          background-color: #6ee7b7;
          animation: naturalFall 8s linear infinite, naturalSway2 4s ease-in-out infinite alternate;
          animation-delay: 7s;
        }

        .natural-leaf:nth-child(5) {
          left: 40%;
          top: -60px;
          width: 16px;
          height: 10px;
          background-color: #10b981;
          animation: naturalFall 10s linear infinite, naturalSway1 4s ease-in-out infinite alternate;
          animation-delay: 0s;
        }

        .natural-leaf:nth-child(6) {
          left: 55%;
          top: -50px;
          width: 24px;
          height: 15px;
          background-color: #059669;
          animation: naturalFall 11s linear infinite, naturalSway2 3s ease-in-out infinite alternate;
          animation-delay: 3s;
        }

        .natural-leaf:nth-child(7) {
          left: 65%;
          top: -40px;
          width: 16px;
          height: 10px;
          background-color: #34d399;
          animation: naturalFall 7s linear infinite, naturalSway2 3.5s ease-in-out infinite alternate;
          animation-delay: 7s;
        }

        .natural-leaf:nth-child(8) {
          left: 50%;
          top: -60px;
          width: 13px;
          height: 9px;
          background-color: #6ee7b7;
          animation: naturalFall 7s linear infinite, naturalSway1 3s ease-in-out infinite alternate;
          animation-delay: 3s;
        }

        .natural-leaf:nth-child(9) {
          left: 80%;
          top: -70px;
          width: 16px;
          height: 10px;
          background-color: #10b981;
          animation: naturalFall 10s linear infinite, naturalSway2 4s ease-in-out infinite alternate;
          animation-delay: 4s;
        }

        .natural-leaf:nth-child(10) {
          left: 75%;
          top: -55px;
          width: 18px;
          height: 12px;
          background-color: #059669;
          animation: naturalFall 12s linear infinite, naturalSway1 3.5s ease-in-out infinite alternate;
          animation-delay: 9s;
        }

        .natural-leaf:nth-child(11) {
          left: 20%;
          top: -65px;
          width: 14px;
          height: 8px;
          background-color: #34d399;
          animation: naturalFall 8s linear infinite, naturalSway2 2.5s ease-in-out infinite alternate;
          animation-delay: 5s;
        }

        .natural-leaf:nth-child(12) {
          left: 90%;
          top: -45px;
          width: 20px;
          height: 13px;
          background-color: #6ee7b7;
          animation: naturalFall 14s linear infinite, naturalSway1 4.5s ease-in-out infinite alternate;
          animation-delay: 1s;
        }

        /* Hero Section Animations */
        @keyframes heroFadeIn {
          from { opacity: 0; transform: scale(1.1); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes diagonalReveal {
          from {
            opacity: 0;
            transform: translateX(-50px) translateY(30px) rotateX(45deg) rotateY(-10deg);
            filter: blur(3px);
          }
          to {
            opacity: 1;
            transform: translateX(0) translateY(0) rotateX(0deg) rotateY(0deg);
            filter: blur(0px);
          }
        }

        @keyframes textSlideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes buttonSlideIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .hero-bg-animated {
          animation: heroFadeIn 2s ease-out;
        }

        .hero-title {
          perspective: 1000px;
        }

        .diagonal-char {
          display: inline-block;
          animation: diagonalReveal 1s ease-out both;
        }

        .hero-subtitle {
          animation: textSlideUp 1s ease-out 0.8s both;
        }

        .hero-buttons {
          animation: buttonSlideIn 0.8s ease-out 1.3s both;
        }
      `}</style>
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-green-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            <div className="flex items-center space-x-3">
              {/* Logo/Icon */}
              <div className="w-10 h-10 relative rounded-2xl overflow-hidden shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <Image
                  src={kyetData.rollingImages[6] || kyetData.heroImage}
                  alt="KYET Company Logo"
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 via-green-700 to-green-800 bg-clip-text text-transparent whitespace-nowrap">
                  {kyetData.companyInfo.name}
                </h1>
                <p className="text-xs text-gray-500 font-medium tracking-wide whitespace-nowrap">Adventure & Nature Experience</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-0.5">
              <button onClick={() => scrollToSection('home')} className="relative text-gray-700 hover:text-green-600 font-medium py-2 px-3 rounded-md text-xs transition-all duration-300 hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 group">
                <span className="relative z-10">ホーム</span>
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 rounded-md opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300 group-hover:w-2"></span>
              </button>
              <button onClick={() => scrollToSection('tours')} className="relative text-gray-700 hover:text-green-600 font-medium py-2 px-3 rounded-md text-xs transition-all duration-300 hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 group">
                <span className="relative z-10">ツアー</span>
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 rounded-md opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300 group-hover:w-2"></span>
              </button>
              <button onClick={() => scrollToSection('events')} className="relative text-gray-700 hover:text-green-600 font-medium py-2 px-3 rounded-md text-xs transition-all duration-300 hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 group">
                <span className="relative z-10">イベント</span>
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 rounded-md opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300 group-hover:w-2"></span>
              </button>
              <button onClick={() => scrollToSection('about')} className="relative text-gray-700 hover:text-green-600 font-medium py-2 px-3 rounded-md text-xs transition-all duration-300 hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 group">
                <span className="relative z-10">会社概要</span>
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 rounded-md opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300 group-hover:w-2"></span>
              </button>
            </nav>

            {/* CTA Area & Mobile menu */}
            <div className="flex items-center justify-end space-x-3">
              <button onClick={() => scrollToSection('contact')} className="hidden md:block bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-3 rounded-xl font-semibold text-base transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                申し込み
              </button>

              {/* Mobile menu button */}
              <div className="lg:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="text-gray-700 hover:text-green-600 p-2 rounded-xl hover:bg-green-50 transition-colors"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-6 border-t border-gray-100 bg-white/98 backdrop-blur-md">
              <div className="flex flex-col space-y-3">
                <button onClick={() => scrollToSection('home')} className="text-gray-700 hover:text-green-600 py-3 px-4 rounded-xl hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 transition-all duration-300 font-medium text-left">ホーム</button>
                <button onClick={() => scrollToSection('tours')} className="text-gray-700 hover:text-green-600 py-3 px-4 rounded-xl hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 transition-all duration-300 font-medium text-left">ツアー</button>
                <button onClick={() => scrollToSection('events')} className="text-gray-700 hover:text-green-600 py-3 px-4 rounded-xl hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 transition-all duration-300 font-medium text-left">イベント</button>
                <button onClick={() => scrollToSection('about')} className="text-gray-700 hover:text-green-600 py-3 px-4 rounded-xl hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 transition-all duration-300 font-medium text-left">会社概要</button>
                <button onClick={() => scrollToSection('contact')} className="mt-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg">
                  無料相談
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="relative h-[100vh] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={kyetData.heroImage}
            alt="Hero"
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div className={`absolute inset-0 bg-gradient-to-br from-black/60 via-black/30 to-black/60 hero-bg-animated ${heroAnimationComplete ? 'opacity-100' : 'opacity-0'}`}>
          <div className="absolute inset-0 bg-gradient-to-t from-green-900/30 via-transparent to-green-800/10"></div>
        </div>

        <div className="relative h-full flex items-center justify-center pt-16">
          <div className="text-center text-white max-w-7xl px-4">
            {/* メインタイトル */}
            <div className="mb-8 hero-title">
              {(() => {
                // 改行したい箇所で\nを挿入
                const title = "自然と人をつなぎ\n心豊かな体験を提供する";
                let charIndex = 0;
                return title.split('\n').map((line, lineIdx) => {
                  const chars = line.split('').map((char) => {
                    const el = char === ' ' ? (
                      <span key={charIndex} className="inline-block w-4"></span>
                    ) : (
                      <span
                        key={charIndex}
                        className="diagonal-char text-4xl md:text-6xl font-bold bg-gradient-to-r from-white via-green-200 to-green-100 bg-clip-text text-transparent"
                        style={{ animationDelay: `${0.5 + charIndex * 0.08}s` }}
                      >
                        {char}
                      </span>
                    );
                    charIndex++;
                    return el;
                  });
                  return (
                    <React.Fragment key={lineIdx}>
                      {chars}
                      {lineIdx !== title.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  );
                });
              })()}
            </div>

            {/* サブタイトル */}
            <div className="hero-subtitle mb-12">
              <div className="text-lg md:text-2xl max-w-5xl mx-auto leading-relaxed space-y-6 font-bold" style={{ color: '#f5f5f5' }}>
                <div className="block">「日本の絶景へ、最高のエスコートを。」</div>
                <div className="block">「自然が、あなたを待っている。KYETと見つける、新しい自分。」</div>
                <div className="block">「ただの体験で終わらせない。一生モノの感動を、アウトドアで。」</div>
              </div>
              <div className="mt-8 text-base md:text-lg font-bold tracking-wider" style={{ color: '#c86a43' }}>
                <b style={{ textShadow: '2px 2px 8px #00000055, 0 1px 0 #fff' }}>CREATE YOUR ADVENTURE</b>
              </div>
            </div>

            {/* CTAボタン */}
            <div className="hero-buttons">
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <button onClick={() => scrollToSection('tours')} className="group bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-3 rounded-2xl font-bold text-base transition-all duration-500 transform hover:scale-110 shadow-xl">
                  ツアーを探す
                  <svg className="inline w-5 h-5 ml-2 transition-transform group-hover:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>

                <button onClick={() => scrollToSection('contact')} className="group border-2 border-white/80 text-white hover:bg-white hover:text-green-600 px-8 py-3 rounded-2xl font-bold text-base transition-all duration-500 transform hover:scale-110 backdrop-blur-md">
                  無料相談
                  <svg className="inline w-5 h-5 ml-2 transition-transform group-hover:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </button>
              </div>

              {/* スクロールインジケーター */}
              <div className="mt-12 flex flex-col items-center animate-bounce">
                <p className="text-white/70 text-sm mb-2 uppercase tracking-wide">Scroll Down</p>
                <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
                  <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ローリング画像セクション */}
      <RollingImages images={kyetData.rollingImages} />

      {/* Achievements Section */}
      <AchievementsSection achievements={kyetData.achievements} />

      {/* Featured Tours Section */}
      <FeaturedToursSection tours={kyetData.featuredTours} getDifficultyColor={getDifficultyColor} getDifficultyText={getDifficultyText} />

      {/* Upcoming Events Section */}
      {kyetData.upcomingEvents.length > 0 && (
        <EventsSection events={kyetData.upcomingEvents} getEventTypeText={getEventTypeText} />
      )}

      {/* Staff Section */}
      {kyetData.staff.length > 0 && (
        <StaffSection staff={kyetData.staff} />
      )}

      {/* Reviews Section */}
      {kyetData.reviews.length > 0 && (
        <section className="py-16 bg-gradient-to-br from-green-50/60 via-white/80 to-emerald-50/60 backdrop-blur-sm overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">お客様の声</h2>
              <p className="text-xl text-gray-600">実際にご参加いただいた方々からの感想</p>
            </div>

            <div className="overflow-x-auto">
              <div className="flex space-x-6 pb-4" style={{ width: 'max-content' }}>
                {kyetData.reviews.map((review, index) => (
                  <div key={index} className="flex-shrink-0 w-80 bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center mb-4">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-5 h-5 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-600">({review.rating}/5)</span>
                    </div>
                    <p className="text-gray-700 mb-4 line-clamp-4">&quot;{review.comment}&quot;</p>
                    <div className="border-t pt-4">
                      <p className="font-medium text-gray-900">{review.customerName}</p>
                      <p className="text-sm text-gray-500 truncate">{review.tourOrEventTitle}</p>
                      <p className="text-sm text-gray-500">{review.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* About Section */}
      <section id="about" className="relative py-16 bg-gradient-to-br from-green-50 via-white to-green-100 overflow-hidden">
        {/* 舞い落ちる葉っぱのアニメーション背景 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="natural-leaf"></div>
          <div className="natural-leaf"></div>
          <div className="natural-leaf"></div>
          <div className="natural-leaf"></div>
          <div className="natural-leaf"></div>
          <div className="natural-leaf"></div>
          <div className="natural-leaf"></div>
          <div className="natural-leaf"></div>
          <div className="natural-leaf"></div>
          <div className="natural-leaf"></div>
          <div className="natural-leaf"></div>
          <div className="natural-leaf"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-green-100">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">会社概要</h2>
              <h3 className="text-xl font-semibold text-green-600 mb-4">{kyetData.companyInfo.mission}</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">{kyetData.aboutText}</p>

              <div className="space-y-4">
                <div className="flex items-center bg-green-50/50 p-3 rounded-lg">
                  <Calendar className="w-5 h-5 text-green-600 mr-3" />
                  <span className="font-medium">設立年: {kyetData.companyInfo.foundedYear}年</span>
                </div>
                <div className="flex items-center bg-green-50/50 p-3 rounded-lg">
                  <MapPin className="w-5 h-5 text-green-600 mr-3" />
                  <span className="font-medium">所在地: {kyetData.companyInfo.location}</span>
                </div>
              </div>
            </div>

            <div className="relative h-96">
              <div className="absolute inset-0 bg-gradient-to-br from-green-200/30 to-blue-200/30 rounded-2xl"></div>
              <Image
                src={kyetData.rollingImages[6] || kyetData.heroImage}
                alt="About"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover rounded-2xl shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-gradient-to-br from-green-100/50 via-green-50/70 to-emerald-100/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">お問い合わせ</h2>
            <p className="text-xl text-gray-600">ご質問やお申し込みはお気軽にどうぞ</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-lg p-8 h-fit">
              <h3 className="text-xl font-bold text-gray-900 mb-6">お問い合わせ先</h3>

              <div className="space-y-3">
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-green-600 mr-3" />
                  <span>{kyetData.companyInfo.contactInfo.phone}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-green-600 mr-3" />
                  <span>{kyetData.companyInfo.contactInfo.email}</span>
                </div>
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-green-600 mr-3 mt-1" />
                  <span>{kyetData.companyInfo.contactInfo.address}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">お問い合わせフォーム</h3>

              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">お名前</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">メールアドレス</label>
                  <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">お問い合わせ内容</label>
                  <textarea rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"></textarea>
                </div>
                <button type="button" className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                  送信する
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-green-900 via-emerald-800 to-green-950 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-8">
              <h3 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white via-green-200 to-white bg-clip-text text-transparent">
                {kyetData.companyInfo.name}
              </h3>
              <p className="text-xl text-gray-300 mb-6 max-w-2xl mx-auto leading-relaxed">
                {kyetData.companyInfo.vision}
              </p>
            </div>

            {/* Social Links */}
            <div className="flex justify-center space-x-6 mb-8">
              <div className="text-gray-400 hover:text-pink-400 transition-colors duration-300 transform hover:scale-110 cursor-default flex flex-col items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">K</span>
                </div>
                <span className="text-xs mt-1">Kirogram</span>
              </div>
              <div className="text-gray-400 hover:text-blue-400 transition-colors duration-300 transform hover:scale-110 cursor-default flex flex-col items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">F</span>
                </div>
                <span className="text-xs mt-1">Facelook</span>
              </div>
              <div className="text-gray-400 hover:text-blue-300 transition-colors duration-300 transform hover:scale-110 cursor-default flex flex-col items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-gray-800 to-black rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">Z</span>
                </div>
                <span className="text-xs mt-1">Z</span>
              </div>
              <div className="text-gray-400 hover:text-red-400 transition-colors duration-300 transform hover:scale-110 cursor-default flex flex-col items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
                <span className="text-xs mt-1">MeTube</span>
              </div>
            </div>

            <div className="border-t border-gray-700 pt-8">
              <p className="text-sm text-gray-400">
                © {new Date().getFullYear()} {kyetData.companyInfo.name}. All rights reserved. |
                <span className="ml-2">Made with ❤️ for nature lovers</span>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};