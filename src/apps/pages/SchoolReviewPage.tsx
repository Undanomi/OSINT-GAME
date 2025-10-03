'use client';

import React, { useEffect, useState } from 'react';
import { Star, MapPin, School, Sparkles, Feather, Quote, ArrowUpRight, X } from 'lucide-react';
import { SchoolReviewContent, SchoolReviewItem } from '@/types/schoolReview';
import { UnifiedSearchResult } from '@/types/search';
import { validateSchoolReviewContent } from '@/actions/schoolReviewValidation';

interface SchoolReviewPageProps {
  documentId: string;
  initialData: UnifiedSearchResult;
}

export const SchoolReviewPage: React.FC<SchoolReviewPageProps> = ({ documentId, initialData }) => {
  const [reviewData, setReviewData] = useState<SchoolReviewContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingReviewIndex, setReportingReviewIndex] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState('不適切な内容');
  const [showReportSuccess, setShowReportSuccess] = useState(false);
  const [showPostSuccess, setShowPostSuccess] = useState(false);
  const [newReview, setNewReview] = useState({
    title: '',
    category: '教育・授業',
    rating: 5,
    content: '',
    reviewer: '匿名',
  });

  useEffect(() => {
    const fetchReviewData = async () => {
      try {
        const searchResult = initialData;

        if (searchResult.template !== 'SchoolReviewPage') {
          throw new Error('Invalid template');
        }

        const data = await validateSchoolReviewContent(searchResult.content);
        setReviewData(data);
      } catch {
        setReviewData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchReviewData();
  }, [documentId, initialData]);

  const renderStars = (rating: number) => (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-slate-300'}`}
        />
      ))}
    </div>
  );

  const renderInteractiveStars = (rating: number, onChange: (rating: number) => void) => (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`h-6 w-6 ${star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-slate-300'}`}
          />
        </button>
      ))}
    </div>
  );

  const handleSubmitReview = () => {
    if (!reviewData || !newReview.title.trim() || !newReview.content.trim()) {
      return;
    }

    const review: SchoolReviewItem = {
      reviewer: newReview.reviewer,
      date: new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }),
      rating: newReview.rating,
      category: newReview.category,
      title: newReview.title,
      content: newReview.content,
      helpful: 0,
    };

    setReviewData({
      ...reviewData,
      reviews: [review, ...reviewData.reviews],
      totalReviews: reviewData.totalReviews + 1,
      averageRating: ((reviewData.averageRating * reviewData.totalReviews) + newReview.rating) / (reviewData.totalReviews + 1),
    });

    setNewReview({
      title: '',
      category: '教育・授業',
      rating: 5,
      content: '',
      reviewer: '匿名',
    });
    setShowPostModal(false);
    setShowPostSuccess(true);

    // 3秒後に成功メッセージを非表示
    setTimeout(() => {
      setShowPostSuccess(false);
    }, 3000);
  };

  const handleOpenReport = (index: number) => {
    setReportingReviewIndex(index);
    setReportReason('不適切な内容');
    setShowReportModal(true);
  };

  const handleSubmitReport = () => {
    // 報告完了メッセージを表示して閉じる
    setShowReportModal(false);
    setReportingReviewIndex(null);
    setShowReportSuccess(true);

    // 3秒後に成功メッセージを非表示
    setTimeout(() => {
      setShowReportSuccess(false);
    }, 3000);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-sky-100 via-white to-emerald-50">
        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-sky-500" />
      </div>
    );
  }

  if (!reviewData) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-sky-100 via-white to-emerald-50">
        <p className="text-lg text-slate-500">口コミデータが見つかりません</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-sky-50 to-emerald-50">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-20%] top-[-15%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.25),_transparent_65%)]" />
        <div className="absolute right-[-10%] top-1/3 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(74,222,128,0.2),_transparent_65%)]" />
        <div className="absolute inset-x-0 bottom-[-20%] h-[320px] w-full bg-[radial-gradient(circle_at_center,_rgba(14,165,233,0.18),_transparent_70%)]" />
      </div>

      <header className="relative border-b border-white/70 bg-white/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-16 md:flex-row md:items-end md:justify-between">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">
              <Sparkles className="h-3.5 w-3.5 text-sky-500" />
              school reviews
            </div>
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
                {reviewData.schoolName}
              </h1>
              <p className="mt-3 max-w-xl text-base text-slate-600">
                在校生と保護者のリアルな体験談を、読みやすくキュレーションしたプレミアムレビュー。学校選びの羅針盤としてご活用ください。
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-100 px-4 py-2 font-semibold text-sky-700">
                <School className="h-4 w-4" />
                {reviewData.schoolType}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2">
                <MapPin className="h-4 w-4" />
                {reviewData.location}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-100 px-4 py-2">
                <Feather className="h-4 w-4 text-emerald-600" />
                保護者レビュー特集
              </span>
            </div>
          </div>

          <div className="grid w-full max-w-sm gap-4 rounded-3xl border border-white/80 bg-white/70 p-6 shadow-xl shadow-sky-200/40 backdrop-blur">
            <div className="rounded-2xl bg-gradient-to-br from-sky-500/10 to-emerald-400/10 p-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">overall rating</p>
              <p className="mt-3 text-5xl font-bold text-slate-900">{reviewData.averageRating.toFixed(1)}</p>
              <div className="mt-2 flex justify-center">{renderStars(Math.round(reviewData.averageRating))}</div>
              <p className="mt-3 text-sm text-slate-500">{reviewData.totalReviews}件のレビューを収録</p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex max-w-6xl flex-col gap-16 px-6 py-14">
        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-xl shadow-sky-200/40 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">learning climate</p>
            <p className="mt-3 text-lg leading-relaxed text-slate-600">
              授業・先生・進学実績に関する一次情報を整理し、教育水準の肌感を伝えます。
            </p>
          </div>
          <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-xl shadow-sky-200/40 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">campus experience</p>
            <p className="mt-3 text-lg leading-relaxed text-slate-600">
              校風・いじめ・部活動など、学校生活全体の満足度を俯瞰してチェックできます。
            </p>
          </div>
          <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-xl shadow-sky-200/40 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">family insight</p>
            <p className="mt-3 text-lg leading-relaxed text-slate-600">
              保護者ならではの視点やサポート体制に関する声をピックアップ。
            </p>
          </div>
        </section>

        <section className="space-y-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">リアルレビュー</h2>
              <p className="text-sm text-slate-500">
                カテゴリー軸で読みやすく再構成。読み込みながら学校の空気感を感じてください。
              </p>
            </div>
            <button
              onClick={() => setShowPostModal(true)}
              className="group inline-flex items-center gap-2 rounded-full border border-sky-300 bg-white px-4 py-2 text-sm font-semibold text-sky-700 transition hover:border-sky-400 hover:bg-sky-50"
            >
              口コミを投稿
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {reviewData.reviews.map((review, index) => (
              <article
                key={`${review.reviewer}-${index}`}
                className="relative flex h-full flex-col gap-5 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-xl shadow-sky-200/40 backdrop-blur"
              >
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-sky-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">
                    {review.category}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900">{review.title}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        {renderStars(review.rating)}
                        <span className="font-semibold text-slate-600">{review.rating.toFixed(1)}</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Feather className="h-3.5 w-3.5 text-emerald-500" />
                        {review.reviewer}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {review.date}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="flex-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{review.content}</p>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                  <button className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-100 px-3 py-1.5 font-medium text-sky-600 transition hover:border-sky-300 hover:bg-sky-50">
                    <Sparkles className="h-3.5 w-3.5" />
                    参考になった {review.helpful}
                  </button>
                  <button
                    onClick={() => handleOpenReport(index)}
                    className="rounded-full border border-transparent px-3 py-1.5 font-medium text-slate-500 transition hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700"
                  >
                    報告する
                  </button>
                </div>

                <Quote className="absolute right-6 top-6 h-10 w-10 text-sky-100 -z-10" />
              </article>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-r from-sky-500/10 via-emerald-400/10 to-blue-500/10 p-10 shadow-2xl shadow-sky-200/40 backdrop-blur">
          <div className="absolute inset-y-0 left-0 w-1/2 bg-[radial-gradient(circle_at_center,_rgba(125,211,252,0.35),_transparent_70%)]" />
          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-2xl font-semibold text-slate-900">{reviewData.schoolName}について語りませんか？</h3>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                あなたの声が次の保護者の安心につながります。匿名で投稿できるので正直な気づきをぜひ共有してください。
              </p>
            </div>
            <button
              onClick={() => setShowPostModal(true)}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              口コミを投稿する
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </button>
          </div>
        </section>
      </main>

      <footer className="relative border-t border-white/60 bg-white/70 py-10 text-xs text-slate-500 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 md:flex-row md:items-center md:justify-between">
          <p>© 2025 Bright School Reviews</p>
          <p className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-sky-500" />
            投稿は独自のレビューポリシーに基づき審査しています
          </p>
        </div>
      </footer>

      {/* 投稿モーダル */}
      {showPostModal && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowPostModal(false)}
          />
          {/* Modal content */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-2xl max-h-[50vh] overflow-y-auto rounded-3xl border border-white/60 bg-white p-6 sm:p-8 shadow-2xl pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowPostModal(false)}
                className="absolute right-6 top-6 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 z-10"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="text-2xl font-semibold text-slate-900">口コミを投稿</h2>
              <p className="mt-2 text-sm text-slate-600">あなたの体験を共有して、他の保護者をサポートしましょう</p>

              <div className="mt-6 space-y-6">
                {/* カテゴリー選択 */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">カテゴリー</label>
                  <select
                    value={newReview.category}
                    onChange={(e) => setNewReview({ ...newReview, category: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  >
                    <option>教育・授業</option>
                    <option>校風・環境</option>
                    <option>いじめ対策</option>
                    <option>部活動</option>
                    <option>施設・設備</option>
                    <option>先生・職員</option>
                    <option>進学実績</option>
                    <option>保護者サポート</option>
                    <option>その他</option>
                  </select>
                </div>

                {/* 評価 */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">評価</label>
                  {renderInteractiveStars(newReview.rating, (rating) => setNewReview({ ...newReview, rating }))}
                </div>

                {/* タイトル */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">タイトル</label>
                  <input
                    type="text"
                    value={newReview.title}
                    onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                    placeholder="例：充実した教育プログラム"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  />
                </div>

                {/* 投稿者名 */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">投稿者名（任意）</label>
                  <input
                    type="text"
                    value={newReview.reviewer}
                    onChange={(e) => setNewReview({ ...newReview, reviewer: e.target.value })}
                    placeholder="匿名"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  />
                </div>

                {/* 内容 */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">口コミ内容</label>
                  <textarea
                    value={newReview.content}
                    onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                    placeholder="学校の良い点や気になる点などを詳しく教えてください"
                    rows={6}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  />
                </div>

                {/* 送信ボタン */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowPostModal(false)}
                    className="rounded-full border border-slate-300 px-6 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleSubmitReview}
                    disabled={!newReview.title.trim() || !newReview.content.trim()}
                    className="rounded-full bg-sky-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    投稿する
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 報告モーダル */}
      {showReportModal && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowReportModal(false)}
          />
          {/* Modal content */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-md max-h-[50vh] overflow-y-auto rounded-3xl border border-white/60 bg-white p-6 sm:p-8 shadow-2xl pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowReportModal(false)}
                className="absolute right-6 top-6 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 z-10"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="text-2xl font-semibold text-slate-900">口コミを報告</h2>
              <p className="mt-2 text-sm text-slate-600">不適切な内容を報告してください</p>

              <div className="mt-6 space-y-4">
                {/* 報告理由選択 */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">報告理由</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  >
                    <option>不適切な内容</option>
                    <option>虚偽の情報</option>
                    <option>誹謗中傷</option>
                    <option>個人情報の掲載</option>
                    <option>スパム</option>
                    <option>その他</option>
                  </select>
                </div>

                {/* 報告対象の口コミ情報 */}
                {reportingReviewIndex !== null && reviewData && (
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">報告対象の口コミ</p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {reviewData.reviews[reportingReviewIndex]?.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      投稿者: {reviewData.reviews[reportingReviewIndex]?.reviewer}
                    </p>
                  </div>
                )}

                {/* 送信ボタン */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="rounded-full border border-slate-300 px-6 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleSubmitReport}
                    className="rounded-full bg-red-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                  >
                    報告する
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 投稿成功トースト */}
      {showPostSuccess && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className="flex items-center gap-3 rounded-2xl border border-sky-200 bg-white px-6 py-4 shadow-2xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100">
              <Sparkles className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">口コミを投稿しました</p>
              <p className="text-sm text-slate-600">ご協力ありがとうございます</p>
            </div>
          </div>
        </div>
      )}

      {/* 報告成功トースト */}
      {showReportSuccess && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white px-6 py-4 shadow-2xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
              <Sparkles className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">報告を受け付けました</p>
              <p className="text-sm text-slate-600">ご協力ありがとうございます</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
