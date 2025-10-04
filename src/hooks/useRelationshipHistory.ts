'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSocialStore } from '@/store/socialStore';
import { getRelationshipHistoryWithMessages } from '@/actions/social';
import { handleServerAction } from '@/utils/handleServerAction';
import { RelationshipHistoryWithMessage } from '@/types/social';

interface UseRelationshipHistoryResult {
  history: RelationshipHistoryWithMessage[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * 関係性履歴を取得・管理するカスタムフック（キャッシュ付き）
 */
export const useRelationshipHistory = (
  accountId: string,
  contactId: string,
  limit: number = 50
): UseRelationshipHistoryResult => {
  const store = useSocialStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // キャッシュキー
  const cacheKey = `${accountId}_${contactId}`;

  // キャッシュからデータを取得
  const cachedData = useMemo(() => {
    return store.relationshipHistories[cacheKey];
  }, [store.relationshipHistories, cacheKey]);

  // データ取得関数
  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await handleServerAction(
        () => getRelationshipHistoryWithMessages(accountId, contactId, limit),
        (err) => {
          console.error('Failed to load relationship history:', err);
          setError('履歴の読み込みに失敗しました');
        }
      );

      if (data) {
        // ストアにキャッシュ
        store.setRelationshipHistory(accountId, contactId, data);
      }
    } finally {
      setLoading(false);
    }
  }, [accountId, contactId, limit, store]);

  // 初回読み込み（キャッシュがない場合のみ）
  useEffect(() => {
    if (!cachedData) {
      fetchHistory();
    } else {
      setLoading(false);
    }
  }, [cachedData, fetchHistory]);

  return {
    history: cachedData?.history || [],
    loading,
    error,
    refetch: fetchHistory,
  };
};
