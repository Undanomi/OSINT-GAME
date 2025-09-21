'use client';

import React from 'react';
import { useSocialAccountContext } from '@/providers/SocialAccountProvider';
import { getDisplayUserId } from '@/types/social';
import { Plus } from 'lucide-react';

interface AccountSwitcherProps {
  onClose: () => void;
  onNavigateToProfile?: () => void;
}

export const AccountSwitcher: React.FC<AccountSwitcherProps> = ({ onClose, onNavigateToProfile }) => {
  const {
    accounts,
    activeAccount,
    loading,
    error,
    switchAccount
  } = useSocialAccountContext();

  const handleSwitchAccount = async (accountId: string) => {
    try {
      await switchAccount(accountId);
      onClose();
    } catch {
      // エラーはProviderで管理されている
    }
  };

  const handleMainAccountClick = () => {
    if (onNavigateToProfile) {
      onNavigateToProfile();
      onClose();
    }
  };


  if (loading) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">アカウントを読み込み中...</p>
      </div>
    );
  }

  const inactiveAccounts = accounts.filter(account => account.id !== activeAccount?.id);

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* メインアカウント */}
      {activeAccount && (
        <div className="flex flex-col items-center space-y-3">
          <button
            onClick={handleMainAccountClick}
            className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-2xl font-bold hover:opacity-80 transition-opacity"
          >
            {activeAccount.avatar}
          </button>
          <div className="text-center">
            <p className="font-semibold text-lg">{activeAccount.name}</p>
            <p className="text-gray-500 text-sm">{getDisplayUserId(activeAccount.account_id)}</p>
          </div>
        </div>
      )}

      {/* 他のアカウントと新規作成 */}
      {(inactiveAccounts.length > 0 || true) && (
        <div className="flex justify-center gap-4 flex-wrap">
          {inactiveAccounts.map((account) => (
            <button
              key={account.id}
              onClick={() => handleSwitchAccount(account.id)}
              className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-bold cursor-pointer hover:opacity-80"
              title={`${account.name} (${getDisplayUserId(account.account_id)})`}
            >
              {account.avatar}
            </button>
          ))}

          <button
            disabled
            className="w-12 h-12 border-2 border-dashed border-gray-200 rounded-full flex items-center justify-center text-gray-300 cursor-not-allowed"
            title="アカウント作成は無効です"
          >
            <Plus size={20} />
          </button>
        </div>
      )}


    </div>
  );
};