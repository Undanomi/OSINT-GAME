import React from 'react';

interface NoArchivePageProps {
  url: string;
}

/**
 * アーカイブが存在しない時に表示されるページ
 * Wayback Machineのエラーページを模倣
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const NoArchivePage: React.FC<NoArchivePageProps> = ({ url }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-gray-50">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Hrm.</h1>
            <p className="text-lg text-gray-700">
              Playback Machine はこのURLをアーカイブしていません。
            </p>
          </div>

          <div className="mb-6 p-4 bg-gray-100 rounded">
            <p className="text-sm text-gray-600 mb-2">
              このページはアーカイブできません。サーバーからの応答:
            </p>
            <p className="text-sm font-mono text-red-600">
              ページが存在しません
            </p>
          </div>

          <div className="mt-6 pt-4 border-t">
            <div className="text-xs text-gray-500">
              <p className="font-semibold mb-2">考えられる理由:</p>
              <ul className="space-y-1 ml-4">
                <li>• URLが間違っている可能性があります</li>
                <li>• このページはまだアーカイブされていません</li>
                <li>• robots.txtによってアーカイブが制限されています</li>
                <li>• サイト所有者の要請により削除されました</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};