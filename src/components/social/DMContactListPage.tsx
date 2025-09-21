import React from 'react';
import { SocialContact, SocialAccount, SocialNPC } from '@/types/social';
import { Search, User } from 'lucide-react';

interface DMContactListPageProps {
  contacts: SocialContact[];
  onSelectContact: (contact: SocialContact) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeAccount: SocialAccount | SocialNPC;
  onAccountClick: () => void;
}

/**
 * DM連絡先一覧ページ
 */
export const DMContactListPage: React.FC<DMContactListPageProps> = ({
  contacts,
  onSelectContact,
  searchQuery,
  onSearchChange,
  activeAccount,
  onAccountClick
}) => {
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full bg-white flex flex-col">
      {/* DM連絡先画面専用ヘッダー */}
      <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <button
            onClick={onAccountClick}
            className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg p-2 transition-colors"
          >
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-sm font-bold">
              {activeAccount?.avatar}
            </div>
          </button>
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="連絡先を検索"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredContacts.length > 0 ? (
          filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center space-x-3 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
              onClick={() => onSelectContact(contact)}
            >
              <div className="relative w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                <User size={20} className="text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 truncate">{contact.name}</h3>
                <p className="text-sm text-gray-500 truncate mt-1">タップしてメッセージを開始</p>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center">
            <p className="text-gray-500">
              {searchQuery ? `「${searchQuery}」に一致する連絡先は見つかりませんでした。` : "連絡先がありません。"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};