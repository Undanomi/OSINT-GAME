import React from 'react';
import { UISocialPost, getDisplayUserId } from '@/types/social';
import { Heart, MessageCircle, Share, MoreHorizontal } from 'lucide-react';

interface PostComponentProps {
  post: UISocialPost;
  onUserSelect: (userId: string) => void;
}

/**
 * 個別の投稿を表示するコンポーネント
 */
export const PostComponent: React.FC<PostComponentProps> = ({ post, onUserSelect }) => {
  const handleAuthorClick = () => onUserSelect(post.authorId);

  return (
    <div className="bg-white p-6 border-b border-gray-200">
      <div className="flex items-start space-x-3">
        <div
          className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 text-gray-600 font-bold cursor-pointer hover:opacity-80"
          onClick={handleAuthorClick}
        >
          {post.author.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3
              className="font-semibold text-gray-900 cursor-pointer hover:underline"
              onClick={handleAuthorClick}
            >
              {post.author.name}
            </h3>
            <span className="text-gray-500 text-sm">{getDisplayUserId(post.author.account_id)}</span>
            <span className="text-gray-500 text-sm">•</span>
            <span className="text-gray-500 text-sm">{post.timeString}</span>
          </div>
          <p className="mt-2 text-gray-800 leading-relaxed break-words">{post.content}</p>
          <div className="flex items-center justify-between mt-4 max-w-md">
            <button className="flex items-center space-x-2 text-gray-500 hover:text-pink-600">
              <Heart size={18} />
              <span className="text-sm">{post.likes}</span>
            </button>
            <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-600">
              <MessageCircle size={18} />
              <span className="text-sm">{post.comments}</span>
            </button>
            <button className="flex items-center space-x-2 text-gray-500 hover:text-green-600">
              <Share size={18} />
              <span className="text-sm">{post.shares}</span>
            </button>
            <button className="text-gray-500 hover:text-gray-700">
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};