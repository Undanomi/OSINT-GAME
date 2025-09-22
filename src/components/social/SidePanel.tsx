import React from 'react';
import { AccountSwitcher } from '@/components/AccountSwitcher';

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToProfile: () => void;
}

/**
 * サイドパネルコンポーネント
 */
export const SidePanel: React.FC<SidePanelProps> = ({
  isOpen,
  onClose,
  onNavigateToProfile
}) => {
  return (
    <div className={`absolute top-0 left-0 bottom-0 bg-white border-r border-gray-200 shadow-lg z-40 w-80 transition-transform duration-300 ease-in-out ${
      isOpen ? 'transform translate-x-0' : 'transform -translate-x-full'
    }`}>
      <div className="p-6 h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">アカウント</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
          >
            ✕
          </button>
        </div>
        <AccountSwitcher onClose={onClose} onNavigateToProfile={onNavigateToProfile} />
      </div>
    </div>
  );
};