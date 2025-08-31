import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * エラーページのプロパティ定義
 * @interface ErrorPageProps
 * @property {string} url - アクセスしようとした無効なURL
 */
interface ErrorPageProps {
  url: string;
}

/**
 * ブラウザのエラーページコンポーネント
 * 
 * 無効なURLやアクセスできないページにアクセスした際に表示される
 * 
 * @component
 * @param {ErrorPageProps} props - コンポーネントのプロパティ
 * @param {string} props.url - アクセスしようとしたURL
 * @returns {JSX.Element} エラーページのUI
 * 
 */
export const ErrorPage: React.FC<ErrorPageProps> = ({ url }) => {
  /**
   * URLからドメイン部分を抽出する関数
   * 
   * @param {string} urlString - 解析対象のURL文字列
   * @returns {string} 抽出されたドメイン名
   * 
   */
  const getDomain = (urlString: string) => {
    try {
      const urlObj = new URL(urlString);
      return urlObj.hostname;
    } catch {
      // URLパースに失敗した場合は入力をそのまま返す
      return urlString.replace(/^https?:\/\//, '').split('/')[0];
    }
  };

  const domain = getDomain(url);

  return (
    <div className="h-full flex items-center justify-center bg-white">
      <div className="max-w-lg px-8">
        <div className="flex items-start space-x-3">
          <AlertCircle className="text-gray-500 mt-1" size={24} />
          <div>
            <h1 className="text-xl font-normal text-gray-900 mb-3">
              このサイトにアクセスできません
            </h1>
            <p className="text-gray-700 mb-4">
              <span className="font-medium">{domain}</span> にタイプミスがないか確認してください。
            </p>
            <div className="text-sm text-gray-600 space-y-2">
              <p>次の方法をお試しください:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>接続を確認する</li>
                <li>プロキシとファイアウォールを確認する</li>
              </ul>
            </div>
            <div className="mt-6">
              <span className="text-xs text-gray-500">ERR_NAME_NOT_RESOLVED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};