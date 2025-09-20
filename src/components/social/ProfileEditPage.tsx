import React, { useState } from 'react';
import { SocialAccount } from '@/types/social';
import { ArrowLeft } from 'lucide-react';

interface ProfileEditPageProps {
  account: SocialAccount;
  onSave: (updatedAccount: SocialAccount) => void;
  onCancel: () => void;
}

/**
 * プロフィール編集ページコンポーネント
 */
export const ProfileEditPage: React.FC<ProfileEditPageProps> = ({
  account,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState(account || {});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: SocialAccount) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center p-4 bg-white border-b flex-shrink-0">
        <button onClick={onCancel} className="mr-3 p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h2 className="text-xl font-bold">プロフィールを編集</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700">名前</label>
          <input
            type="text"
            name="name"
            value={formData.name || ''}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">自己紹介</label>
          <textarea
            name="bio"
            value={formData.bio || ''}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">誕生日</label>
          <input
            type="date"
            name="birthday"
            value={formData.birthday || ''}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">所在地</label>
          <input
            type="text"
            name="location"
            value={formData.location || ''}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">会社</label>
          <input
            type="text"
            name="company"
            value={formData.company || ''}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">役職</label>
          <input
            type="text"
            name="position"
            value={formData.position || ''}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">学歴</label>
          <input
            type="text"
            name="education"
            value={formData.education || ''}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="p-4 border-t bg-white">
        <button
          onClick={() => onSave(formData)}
          className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600"
        >
          保存
        </button>
      </div>
    </div>
  );
};