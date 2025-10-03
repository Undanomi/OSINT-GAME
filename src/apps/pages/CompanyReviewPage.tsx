'use client';

import React, { useEffect, useState } from 'react';
import {
  Star,
  MapPin,
  Building2,
  Users,
  ArrowUpRight,
  Sparkles,
  BadgeCheck,
  MessageCircle,
  X,
} from 'lucide-react';
import { CompanyReviewContent, CompanyReviewItem } from '@/types/companyReview';
import { UnifiedSearchResult } from '@/types/search';
import { validateCompanyReviewContent } from '@/actions/companyReviewValidation';

interface CompanyReviewPageProps {
  documentId: string;
  initialData: UnifiedSearchResult;
}

export const CompanyReviewPage: React.FC<CompanyReviewPageProps> = ({ documentId, initialData }) => {
  const [reviewData, setReviewData] = useState<CompanyReviewContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingReviewIndex, setReportingReviewIndex] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState('不適切な内容');
  const [showReportSuccess, setShowReportSuccess] = useState(false);
  const [showPostSuccess, setShowPostSuccess] = useState(false);
  const [newReview, setNewReview] = useState({
    title: '',
    category: '企業文化',
    rating: 5,
    content: '',
    reviewer: '匿名',
  });

  useEffect(() => {
    const fetchReviewData = async () => {
      try {
        const searchResult = initialData;

        if (searchResult.template !== 'CompanyReviewPage') {
          throw new Error('Invalid template');
        }

        const data = await validateCompanyReviewContent(searchResult.content);
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
          className={`h-4 w-4 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`}
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
            className={`h-6 w-6 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`}
          />
        </button>
      ))}
    </div>
  );

  const handleSubmitReview = () => {
    if (!reviewData || !newReview.title.trim() || !newReview.content.trim()) {
      return;
    }

    const review: CompanyReviewItem = {
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
      category: '企業文化',
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
      <div className="flex h-full items-center justify-center bg-slate-950">
        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-emerald-400" />
      </div>
    );
  }

  if (!reviewData) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="text-xl text-slate-400">口コミデータが見つかりません</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -left-40 top-[-10%] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.18),_transparent_60%)]" />
        <div className="absolute right-[-25%] top-1/4 h-[640px] w-[640px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.12),_transparent_65%)]" />
        <div className="absolute inset-x-0 bottom-[-20%] h-[420px] bg-[radial-gradient(circle_at_center,_rgba(217,249,157,0.12),_transparent_70%)]" />
      </div>

      <header className="border-b border-white/10 bg-transparent backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16 md:flex-row md:items-end md:justify-between">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
              <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
              insider review
            </div>
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
                {reviewData.companyName}
              </h1>
              <p className="mt-3 max-w-xl text-base text-slate-300">
                現役・退職社員が語るリアルな社内の空気、カルチャー、キャリアのストーリーを集約したプレミアムレポートです。
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-slate-200">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 font-semibold text-emerald-200">
                <Building2 className="h-4 w-4 text-emerald-300" />
                {reviewData.industry}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                <MapPin className="h-4 w-4 text-slate-300" />
                {reviewData.location}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                <Users className="h-4 w-4 text-slate-300" />
                {reviewData.employeeCount}
              </span>
            </div>
          </div>

          <div className="grid w-full max-w-sm grid-cols-3 gap-4 rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur">
            <div className="col-span-3 rounded-xl border border-white/10 bg-gradient-to-br from-emerald-400/20 to-sky-500/20 p-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">overall score</p>
              <p className="mt-4 text-5xl font-bold text-white">{reviewData.averageRating.toFixed(1)}</p>
              <div className="mt-2 flex justify-center">{renderStars(Math.round(reviewData.averageRating))}</div>
              <p className="mt-3 text-sm text-slate-300">{reviewData.totalReviews}件の社員レビュー</p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex max-w-6xl flex-col gap-14 px-6 py-14">
        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-emerald-500/5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">culture pulse</p>
            <p className="mt-3 text-lg text-slate-200">
              社員が語るカルチャーのリアルな熱量をスナップショットとして可視化。マネジメントの透明性や挑戦に対する姿勢を追体験できます。
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-sky-500/5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">career outlook</p>
            <p className="mt-3 text-lg text-slate-200">
              成長機会・評価制度・報酬レンジの実態を俯瞰して、キャリアの次の一手を描くヒントに。
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-amber-500/5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">workstyle facts</p>
            <p className="mt-3 text-lg text-slate-200">
              働き方やワークライフバランスに関する一次情報を整理し、転職検討時の不安を解消します。
            </p>
          </div>
        </section>

        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">社員レビュー</h2>
              <p className="mt-1 text-sm text-slate-400">カテゴリー別に最新の声をキュレーションしています。</p>
            </div>
            <button
              onClick={() => setShowPostModal(true)}
              className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/20"
            >
              口コミを投稿
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </button>
          </div>

          <div className="relative">
            <div className="absolute left-[14px] top-0 bottom-0 hidden w-px bg-gradient-to-b from-white/0 via-white/30 to-white/0 md:block" />
            <div className="space-y-6">
              {reviewData.reviews.map((review, index) => (
                <article
                  key={`${review.reviewer}-${index}`}
                  className="relative rounded-2xl border border-white/10 bg-black/30 p-6 shadow-[0_0_60px_-30px_rgba(0,0,0,0.8)] backdrop-blur"
                >
                  <div className="md:pl-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-sm font-semibold text-emerald-200">
                            {review.rating.toFixed(1)}
                          </span>
                          <div>
                            <h3 className="text-lg font-semibold text-white">{review.title}</h3>
                            <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                              <BadgeCheck className="h-3.5 w-3.5 text-emerald-300" />
                              {review.category}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                          <span className="inline-flex items-center gap-2">
                            <MessageCircle className="h-3.5 w-3.5" />
                            {review.reviewer}
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5" />
                            {review.date}
                          </span>
                        </div>
                      </div>
                      <div className="md:pr-4">{renderStars(review.rating)}</div>
                    </div>

                    <p className="mt-6 whitespace-pre-wrap text-base leading-relaxed text-slate-200">{review.content}</p>

                    <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-slate-400">
                      <button className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 transition hover:border-emerald-400/40 hover:text-emerald-200">
                        <Sparkles className="h-3.5 w-3.5" />
                        参考になった {review.helpful}
                      </button>
                      <button
                        onClick={() => handleOpenReport(index)}
                        className="rounded-full border border-white/10 px-3 py-1.5 hover:border-white/30 hover:text-white"
                      >
                        報告する
                      </button>
                    </div>
                  </div>

                  <div className="absolute left-0 top-6 hidden h-3 w-3 -translate-x-1/2 rounded-full border border-emerald-300 bg-emerald-300/70 md:block" />
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-400/20 via-cyan-500/10 to-slate-900 p-10 shadow-2xl">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.25),_transparent_65%)] opacity-60" />
          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-2xl font-semibold text-white">{reviewData.companyName}でのキャリアを検討していますか？</h3>
              <p className="mt-2 max-w-xl text-sm text-slate-100">
                実際に働くメンバーの声が、あなたの意思決定を後押しします。匿名で投稿できるので、率直なフィードバックを共有してください。
              </p>
            </div>
            <button
              onClick={() => setShowPostModal(true)}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              口コミを投稿する
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-black/40 py-10 text-xs text-slate-500">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 md:flex-row md:items-center md:justify-between">
          <p>© 2025 Insider Review Lab</p>
          <p className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" />
            社員の声はすべて編集部による検証済みです
          </p>
        </div>
      </footer>

      {/* 投稿モーダル */}
      {showPostModal && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/70 z-40"
            onClick={() => setShowPostModal(false)}
          />
          {/* Modal content */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-2xl max-h-[50vh] overflow-y-auto rounded-3xl border border-white/10 bg-slate-900 p-6 sm:p-8 shadow-2xl pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowPostModal(false)}
                className="absolute right-6 top-6 rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white z-10"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="text-2xl font-semibold text-white">口コミを投稿</h2>
              <p className="mt-2 text-sm text-slate-400">あなたの体験を共有して、次の世代をサポートしましょう</p>

              <div className="mt-6 space-y-6">
                {/* カテゴリー選択 */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">カテゴリー</label>
                  <select
                    value={newReview.category}
                    onChange={(e) => setNewReview({ ...newReview, category: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                  >
                    <option>企業文化</option>
                    <option>給与・待遇</option>
                    <option>働きがい</option>
                    <option>ワークライフバランス</option>
                    <option>成長機会</option>
                    <option>マネジメント</option>
                    <option>福利厚生</option>
                    <option>その他</option>
                  </select>
                </div>

                {/* 評価 */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">評価</label>
                  {renderInteractiveStars(newReview.rating, (rating) => setNewReview({ ...newReview, rating }))}
                </div>

                {/* タイトル */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">タイトル</label>
                  <input
                    type="text"
                    value={newReview.title}
                    onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                    placeholder="例：風通しが良く挑戦できる環境"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                  />
                </div>

                {/* 投稿者立場 */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">立場（任意）</label>
                  <input
                    type="text"
                    value={newReview.reviewer}
                    onChange={(e) => setNewReview({ ...newReview, reviewer: e.target.value })}
                    placeholder="例：現社員、元社員など"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                  />
                </div>

                {/* 内容 */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">口コミ内容</label>
                  <textarea
                    value={newReview.content}
                    onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                    placeholder="企業の良い点や気になる点などを詳しく教えてください"
                    rows={6}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                  />
                </div>

                {/* 送信ボタン */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowPostModal(false)}
                    className="rounded-full border border-white/10 px-6 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/5"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleSubmitReview}
                    disabled={!newReview.title.trim() || !newReview.content.trim()}
                    className="rounded-full bg-emerald-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="fixed inset-0 bg-black/70 z-40"
            onClick={() => setShowReportModal(false)}
          />
          {/* Modal content */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-md max-h-[50vh] overflow-y-auto rounded-3xl border border-white/10 bg-slate-900 p-6 sm:p-8 shadow-2xl pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowReportModal(false)}
                className="absolute right-6 top-6 rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white z-10"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="text-2xl font-semibold text-white">口コミを報告</h2>
              <p className="mt-2 text-sm text-slate-400">不適切な内容を報告してください</p>

              <div className="mt-6 space-y-4">
                {/* 報告理由選択 */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">報告理由</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
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
                  <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-slate-500">報告対象の口コミ</p>
                    <p className="mt-1 font-semibold text-white">
                      {reviewData.reviews[reportingReviewIndex]?.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      投稿者: {reviewData.reviews[reportingReviewIndex]?.reviewer}
                    </p>
                  </div>
                )}

                {/* 送信ボタン */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="rounded-full border border-white/10 px-6 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/5"
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
          <div className="flex items-center gap-3 rounded-2xl border border-sky-400/40 bg-slate-900 px-6 py-4 shadow-2xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-400/20">
              <Sparkles className="h-5 w-5 text-sky-400" />
            </div>
            <div>
              <p className="font-semibold text-white">口コミを投稿しました</p>
              <p className="text-sm text-slate-400">ご協力ありがとうございます</p>
            </div>
          </div>
        </div>
      )}

      {/* 報告成功トースト */}
      {showReportSuccess && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/40 bg-slate-900 px-6 py-4 shadow-2xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/20">
              <Sparkles className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-white">報告を受け付けました</p>
              <p className="text-sm text-slate-400">ご協力ありがとうございます</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
