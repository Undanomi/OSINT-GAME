import React from 'react';

interface GenericPageProps {
  url: string;
}

export const GenericPage: React.FC<GenericPageProps> = ({ url }) => {
  return (
    <div className="p-8 h-full flex flex-col items-center justify-center text-center bg-gray-100">
      <h1 className="text-2xl font-bold text-gray-800">ページコンテンツ</h1>
      <p className="mt-2 text-gray-600">
        これは <code className="bg-gray-200 px-2 py-1 rounded">{url}</code> のシミュレーションページです。
      </p>
      <p className="mt-4 text-sm text-gray-500">
        （このサイトの個別のコンポーネントはまだ作成されていません）
      </p>
    </div>
  );
};