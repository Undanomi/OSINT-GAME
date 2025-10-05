'use client';

import React, { useState, useEffect } from 'react';
import { getExplanationVideoUrl } from '@/actions/scenario';
import { handleServerAction } from '@/utils/handleServerAction';

interface ExplanationVideoViewerProps {
  onClose: () => void;
}

/**
 * YouTube動画IDを抽出
 */
function extractYouTubeVideoId(url: string): string | null {
  // https://www.youtube.com/watch?v=VIDEO_ID
  // https://youtu.be/VIDEO_ID
  // https://www.youtube.com/embed/VIDEO_ID
  // https://youtube.com/shorts/VIDEO_ID
  // https://www.youtube.com/shorts/VIDEO_ID
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|www\.youtube\.com\/shorts\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

export const ExplanationVideoViewer: React.FC<ExplanationVideoViewerProps> = ({ onClose }) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVideoUrl = async () => {
      setIsLoading(true);
      const url = await handleServerAction(
        () => getExplanationVideoUrl(),
        (error) => {
          console.error('Failed to load video URL:', error);
          setError('解説動画の読み込みに失敗しました');
        }
      );

      if (url) {
        setVideoUrl(url);
      } else {
        setError('解説動画が見つかりません');
      }
      setIsLoading(false);
    };

    loadVideoUrl();
  }, []);

  // 動画IDを取得
  const videoId = videoUrl ? extractYouTubeVideoId(videoUrl) : null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 text-3xl bg-black/50 rounded-full w-10 h-10 flex items-center justify-center"
        >
          ✕
        </button>

        <div className="w-[70vw] h-[70vh] flex items-center justify-center">
          {isLoading ? (
            <div className="text-center">
              <svg className="animate-spin h-12 w-12 text-blue-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-400">解説動画を読み込み中...</p>
            </div>
          ) : error ? (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-8 text-center">
              <p className="text-red-300 text-lg">{error}</p>
            </div>
          ) : videoId ? (
            <iframe
              className="w-full h-full rounded-lg shadow-2xl"
              src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
              title="解説動画"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : (
            <div className="bg-gray-800 rounded-lg p-8 text-center">
              <p className="text-gray-400 text-lg">解説動画が設定されていません</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
