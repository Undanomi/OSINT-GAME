'use client';

import React, { useEffect, useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, Calendar, MapPin, Tag, DollarSign, User } from 'lucide-react';
import { ProductReviewBlogContent } from '@/types/productReviewBlog';
import { UnifiedSearchResult } from '@/types/search';
import { validateProductReviewBlogContent } from '@/actions/productReviewBlogValidation';

interface ProductReviewBlogPageProps {
  documentId: string;
  initialData: UnifiedSearchResult;
}

export const ProductReviewBlogPage: React.FC<ProductReviewBlogPageProps> = ({ documentId, initialData }) => {
  const [reviewData, setReviewData] = useState<ProductReviewBlogContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviewData = async () => {
      try {
        const searchResult = initialData;

        if (searchResult.template !== 'ProductReviewBlogPage') {
          throw new Error('Invalid template');
        }

        const data = await validateProductReviewBlogContent(searchResult.content);
        setReviewData(data);
      } catch {
        setReviewData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchReviewData();
  }, [documentId, initialData]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-6 h-6 ${
              star <= rating ? 'text-orange-500 fill-orange-500' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-orange-50">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!reviewData) {
    return (
      <div className="flex items-center justify-center h-screen bg-orange-50">
        <div className="text-xl text-gray-600">レビューデータが見つかりません</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50">
      {/* ヘッダー */}
      <header className="bg-gradient-to-r from-orange-600 to-pink-600 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold mb-2">{reviewData.bloggerName}のレビューブログ</h1>
          <p className="text-orange-100">気になる商品を徹底レビュー！</p>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* ブロガープロフィール */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{reviewData.bloggerName}</h2>
              <p className="text-gray-600 text-sm">{reviewData.bloggerProfile}</p>
            </div>
          </div>
        </div>

        {/* 商品情報カード */}
        <article className="bg-white rounded-xl shadow-lg p-8 mb-8">
          {/* 投稿日 */}
          <div className="flex items-center text-sm text-gray-500 mb-6">
            <Calendar className="w-4 h-4 mr-2" />
            {reviewData.postDate}
          </div>

          {/* 商品タイトル */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{reviewData.productName}</h1>

          {/* 商品基本情報 */}
          <div className="flex flex-wrap gap-4 mb-6 text-sm">
            <div className="flex items-center text-gray-600">
              <Tag className="w-4 h-4 mr-2" />
              {reviewData.manufacturer}
            </div>
            <div className="flex items-center text-gray-600">
              <Tag className="w-4 h-4 mr-2" />
              {reviewData.category}
            </div>
            <div className="flex items-center text-gray-600">
              <DollarSign className="w-4 h-4 mr-2" />
              ¥{reviewData.price.toLocaleString()}
            </div>
          </div>

          {/* 評価 */}
          <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-lg p-6 mb-8 border border-orange-200">
            <div className="text-center mb-4">
              <div className="text-sm text-gray-600 mb-2">総合評価</div>
              <div className="flex justify-center mb-2">
                {renderStars(reviewData.rating)}
              </div>
              <div className="text-4xl font-bold text-orange-600">
                {reviewData.rating.toFixed(1)} / 5.0
              </div>
            </div>
            <div className="border-t border-orange-200 pt-4 mt-4">
              <div className="text-sm text-gray-600 text-center mb-2">おすすめ度</div>
              <div className="flex justify-center">
                {renderStars(reviewData.recommendationScore)}
              </div>
            </div>
          </div>

          {/* 購入情報 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-8">
            <h3 className="font-bold text-gray-900 mb-3">購入情報</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                購入日: {reviewData.purchaseDate}
              </div>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                購入場所: {reviewData.purchaseLocation}
              </div>
            </div>
          </div>

          {/* メリット・デメリット */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* メリット */}
            <div className="bg-green-50 rounded-lg p-6 border border-green-200">
              <div className="flex items-center mb-4">
                <ThumbsUp className="w-5 h-5 text-green-600 mr-2" />
                <h3 className="font-bold text-green-900">良い点</h3>
              </div>
              <ul className="space-y-2">
                {reviewData.pros.map((pro, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span className="text-gray-700 text-sm">{pro}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* デメリット */}
            <div className="bg-red-50 rounded-lg p-6 border border-red-200">
              <div className="flex items-center mb-4">
                <ThumbsDown className="w-5 h-5 text-red-600 mr-2" />
                <h3 className="font-bold text-red-900">気になる点</h3>
              </div>
              <ul className="space-y-2">
                {reviewData.cons.map((con, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-red-600 mr-2">✗</span>
                    <span className="text-gray-700 text-sm">{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* レビュー詳細セクション */}
          <div className="space-y-6 mb-8">
            {reviewData.reviewSections.map((section, index) => (
              <div key={index}>
                <h3 className="text-xl font-bold text-gray-900 mb-3 border-l-4 border-orange-500 pl-3">
                  {section.title}
                </h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {section.content}
                </p>
              </div>
            ))}
          </div>

          {/* 総評 */}
          <div className="bg-gradient-to-r from-orange-100 to-pink-100 rounded-lg p-6 border-2 border-orange-300">
            <h3 className="text-xl font-bold text-gray-900 mb-3">総評</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {reviewData.overallReview}
            </p>
          </div>
        </article>

        {/* 関連記事エリア */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">他のレビュー記事</h3>
          <p className="text-gray-600 text-sm">
            その他の商品レビューもぜひご覧ください！
          </p>
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-gray-800 text-white mt-16 py-8">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-sm">© 2025 {reviewData.bloggerName}のレビューブログ. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
};
