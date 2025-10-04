'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { RelationshipHistoryViewer } from './RelationshipHistoryViewer';
import { getSocialNPCs, getSocialAccounts } from '@/actions/social';
import { handleServerAction } from '@/utils/handleServerAction';
import { SocialNPC, SocialAccount } from '@/types/social';

interface MissionCompleteProps {
  onComplete: () => void;
}

export const MissionComplete: React.FC<MissionCompleteProps> = ({ onComplete }) => {
  const { setGamePhase } = useGameStore();
  const [targetNPC, setTargetNPC] = useState<SocialNPC | null>(null);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [showRelationshipHistory, setShowRelationshipHistory] = useState(false);

  // ゲームオーバーターゲットNPCとアカウント情報を取得
  useEffect(() => {
    const loadData = async () => {
      setIsHistoryLoading(true);
      const npcs = await handleServerAction(
        () => getSocialNPCs(),
        (error) => console.error('Failed to load NPCs:', error)
      );
      const target = npcs?.find(npc => npc.isGameOverTarget);
      setTargetNPC(target || null);

      const socialAccounts = await handleServerAction(
        () => getSocialAccounts(),
        (error) => console.error('Failed to load accounts:', error)
      );
      setAccounts(socialAccounts || []);
      setIsHistoryLoading(false);
    };
    loadData();
  }, []);

  const handleContinue = () => {
    setGamePhase('game');
    onComplete();
  };

  return (
    <div className="w-full h-screen flex items-center justify-center bg-black text-white overflow-hidden">
      <div className="max-w-7xl mx-auto p-8 text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-green-400">
            ミッション成功
          </h1>
          <p className="text-xl text-gray-300">
            情報の送信完了
          </p>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 mb-8 text-left">
          <div className="text-gray-300 leading-relaxed space-y-4">
            <p>
              送信したVPN情報は正しく、組織はターゲットネットワークへのアクセスに成功した。
            </p>
            <p>
              あなたの働きが、作戦を次の段階へと進めた。
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* 関係性履歴表示ボタン */}
          {
            <button
              onClick={() => setShowRelationshipHistory(true)}
              disabled={isHistoryLoading || !targetNPC}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-800 disabled:opacity-50 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors flex items-center justify-center mx-auto"
            >
              {isHistoryLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  履歴を準備中...
                </>
              ) : (
                'Beaconアプリでのターゲットの反応をみる'
              )}
            </button>
          }

          <button
            onClick={handleContinue}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors block mx-auto"
          >
            解説に移る
          </button>
        </div>

        {/* 関係性履歴モーダル */}
        {showRelationshipHistory && targetNPC && accounts.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg w-full max-w-7xl h-[90vh] flex flex-col border border-gray-700">
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-2xl font-bold text-white">{targetNPC.name}との関係性の推移</h2>
                <button
                  onClick={() => setShowRelationshipHistory(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-auto p-6">
                <RelationshipHistoryViewer
                  contactId={targetNPC.id}
                  contactName={targetNPC.name}
                  accounts={accounts}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};