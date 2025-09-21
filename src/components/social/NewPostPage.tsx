import React, { useState } from 'react';
import { SocialAccount, SocialNPC } from '@/types/social';
import { MAX_POST_LENGTH } from '@/lib/social/constants';

interface NewPostPageProps {
  activeAccount: SocialAccount | SocialNPC;
  onAddPost: (content: string) => void;
  onCancel: () => void;
}

/**
 * 新規投稿ページコンポーネント
 */
export const NewPostPage: React.FC<NewPostPageProps> = ({
  activeAccount,
  onAddPost,
  onCancel
}) => {
  const [content, setContent] = useState('');

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
        <button onClick={onCancel} className="text-blue-500 hover:text-blue-700">
          キャンセル
        </button>
        <button
          onClick={() => onAddPost(content)}
          disabled={!content.trim()}
          className="bg-blue-500 text-white font-bold py-2 px-4 rounded-full hover:bg-blue-600 disabled:bg-blue-300"
        >
          投稿
        </button>
      </div>

      <div className="flex-1 p-4 flex flex-col">
        <div className="flex space-x-3 flex-1">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 text-gray-600 font-bold">
            {activeAccount?.avatar || 'U'}
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.substring(0, MAX_POST_LENGTH))}
            placeholder="いまどうしてる？"
            className="flex-1 resize-none border-none focus:outline-none text-lg"
            maxLength={MAX_POST_LENGTH}
            rows={8}
          />
        </div>

        <div className="text-right text-sm text-gray-500 mt-4">
          {content.length}/{MAX_POST_LENGTH}
        </div>
      </div>
    </div>
  );
};