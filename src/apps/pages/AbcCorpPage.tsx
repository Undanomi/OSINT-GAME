import React from 'react';

export const AbcCorpPage: React.FC = () => {
  return (
    <div className="p-8 bg-gray-50 h-full font-sans">
      <header className="pb-4 border-b">
        <h1 className="text-3xl font-bold text-blue-800">ABC株式会社</h1>
        <p className="text-gray-600">イノベーションで未来を創造する</p>
      </header>
      <main className="mt-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">新クラウドサービス「ABC Cloud Pro」提供開始</h2>
        <p className="text-gray-700 leading-relaxed">
          業界最高レベルのセキュリティと柔軟性を誇る、新しいエンタープライズ向けクラウドプラットフォーム「ABC Cloud Pro」の提供を開始しました。
          当社の持つAI技術とIoTソリューションを組み合わせ、お客様のデジタルトランスフォーメーションを強力に支援します。
        </p>
        <div className="mt-6 p-4 bg-white border rounded-lg">
          <h3 className="font-bold mb-2">採用情報</h3>
          <p>現在、以下の職種で優秀な人材を募集しています。</p>
          <ul className="list-disc list-inside mt-2 text-sm text-blue-600">
            <li>フロントエンドエンジニア (React, TypeScript)</li>
            <li>バックエンドエンジニア (Go, Python, Kubernetes)</li>
          </ul>
        </div>
      </main>
    </div>
  );
};