import React, { useState } from 'react';
import { SocialAccount } from '@/types/social';
import { ArrowLeft, AlertCircle } from 'lucide-react';

interface ProfileEditPageProps {
  account: SocialAccount;
  error?: string;
  onSave: (updatedAccount: SocialAccount) => void;
  onCancel: () => void;
}

/**
 * プロフィール編集ページコンポーネント
 */
export const ProfileEditPage: React.FC<ProfileEditPageProps> = ({
  account,
  error,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState(account || {});
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: SocialAccount) => ({ ...prev, [name]: value }));

    // クライアントサイドでの基本バリデーションのみ
    if (name === 'account_id' || name === 'name') {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSave = () => {
    // 基本的なクライアントサイドバリデーション
    const newErrors: {[key: string]: string} = {};

    if (!formData.account_id?.trim()) {
      newErrors.account_id = 'ユーザーIDは必須です';
    }

    if (!formData.name?.trim()) {
      newErrors.name = '名前は必須です';
    }

    setErrors(newErrors);

    // エラーがなければ保存（サーバーサイドで重複チェック）
    if (Object.keys(newErrors).length === 0) {
      onSave(formData);
    }
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
        {/* サーバーエラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex items-center text-red-600 text-sm">
              <AlertCircle size={16} className="mr-2" />
              {error}
            </div>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-gray-700">ユーザーID</label>
          <input
            type="text"
            name="account_id"
            value={formData.account_id || ''}
            onChange={handleChange}
            placeholder="例: john_doe"
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 ${
              errors.account_id ? 'border-red-500' : ''
            }`}
          />
          {errors.account_id && (
            <div className="mt-1 flex items-center text-red-600 text-sm">
              <AlertCircle size={16} className="mr-1" />
              {errors.account_id}
            </div>
          )}
          <p className="mt-1 text-xs text-gray-500">
            プロフィールページや検索で表示されるIDです。変更できます。
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">名前</label>
          <input
            type="text"
            name="name"
            value={formData.name || ''}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 ${
              errors.name ? 'border-red-500' : ''
            }`}
          />
          {errors.name && (
            <div className="mt-1 flex items-center text-red-600 text-sm">
              <AlertCircle size={16} className="mr-1" />
              {errors.name}
            </div>
          )}
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
          onClick={handleSave}
          disabled={Object.values(errors).some(error => !!error)}
          className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          保存
        </button>
      </div>
    </div>
  );
};