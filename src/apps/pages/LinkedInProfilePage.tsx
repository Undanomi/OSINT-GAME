import React from 'react';

export const LinkedInProfilePage: React.FC = () => {
  return (
    <div className="p-8 bg-white h-full">
      <div className="flex items-center space-x-6">
        <div className="w-24 h-24 bg-gray-300 rounded-full flex-shrink-0"></div>
        <div>
          <h1 className="text-2xl font-bold">田中 太郎</h1>
          <p className="text-lg text-gray-700">ABC株式会社 マーケティング部長</p>
          <p className="text-sm text-gray-500">東京都</p>
        </div>
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-semibold border-b pb-2 mb-3">職務経歴</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-bold">マーケティング部長</h3>
            <p className="text-sm text-gray-600">ABC株式会社</p>
          </div>
          <div>
            <h3 className="font-bold">デジタルマーケティング担当</h3>
            <p className="text-sm text-gray-600">XYZ Solutions</p>
          </div>
        </div>
        <h2 className="text-xl font-semibold border-b pb-2 mb-3 mt-8">学歴</h2>
        <div>
          <h3 className="font-bold">東京大学</h3>
          <p className="text-sm text-gray-600">経済学部</p>
        </div>
      </div>
    </div>
  );
};