'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { useAuthContext } from '@/providers/AuthProvider';
import {
  getSocialAccounts,
  createSocialAccount,
  updateSocialAccount,
  deleteSocialAccount,
  switchActiveAccount,
  getAllDefaultSocialAccountSettings
} from '@/actions/social';
import {
  SocialAccount,
  SocialAccountContextType,
  createDefaultSocialAccount
} from '@/types/social';
import { handleServerAction } from '@/utils/handleServerAction';

const SocialAccountContext = createContext<SocialAccountContextType | null>(null);

/**
 * ソーシャルアカウント管理プロバイダー
 * 最大3アカウントまでの制限、アクティブアカウント管理
 */
export function SocialAccountProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();

  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [activeAccount, setActiveAccount] = useState<SocialAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreatingDefaults, setIsCreatingDefaults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * アカウント一覧を読み込み
   */
  const loadAccounts = useCallback(async () => {
    if (!user) {
      setAccounts([]);
      setActiveAccount(null);
      setLoading(false);
      return;
    }

    setError(null);
    const fetchedAccounts = await handleServerAction(
      () => getSocialAccounts(),
      (error) => {
        console.error('Failed to load social accounts:', error);
        setError("アカウントの処理に失敗しました。しばらく待ってから再試行してください。");
      }
    );

    setAccounts(fetchedAccounts);

    // アクティブアカウントを設定
    const active = fetchedAccounts.find(account => account.isActive) || fetchedAccounts[0] || null;
    setActiveAccount(active);

    setLoading(false);
  }, [user]);

  /**
   * アカウントを切り替え
   */
  const switchAccount = useCallback(async (accountId: string) => {
    if (!user) throw new Error('authError');

    setError(null);
    await handleServerAction(
      () => switchActiveAccount(accountId),
      (error) => {
        console.error('Failed to switch account:', error);
        setError("アカウントの処理に失敗しました。しばらく待ってから再試行してください。");
        throw error;
      }
    );

    // ローカル状態を更新
    setAccounts(prev => prev.map(account => ({
      ...account,
      isActive: account.id === accountId
    })));

    const newActiveAccount = accounts.find(account => account.id === accountId) || null;
    setActiveAccount(newActiveAccount);
  }, [user, accounts]);

  /**
   * 新しいアカウントを作成
   */
  const createAccount = useCallback(async (
    accountData: SocialAccount
  ): Promise<SocialAccount> => {
    if (!user) throw new Error('authError');

    setError(null);

    // アカウントデータをそのまま使用（重複チェックは呼び出し側で実行）
    const newAccount = await handleServerAction(
      () => createSocialAccount(accountData),
      (error) => {
        console.error('Failed to create account:', error);
        setError("アカウントの処理に失敗しました。しばらく待ってから再試行してください。");
        throw error;
      }
    );

    // ローカル状態を更新
    setAccounts(prev => {
      const updated = [...prev, newAccount];
      // 最初のアカウントの場合はアクティブに設定
      if (prev.length === 0) {
        setActiveAccount(newAccount);
      }
      return updated;
    });

    return newAccount;
  }, [user]);

  /**
   * アカウントを更新
   */
  const updateAccount = useCallback(async (
    accountId: string,
    updates: Partial<SocialAccount>
  ) => {
    if (!user) throw new Error('authError');

    setError(null);
    await handleServerAction(
      () => updateSocialAccount(accountId, updates),
      (error) => {
        console.error('Failed to update account:', error);
        if (error.message.includes('accountDuplicate')) {
          setError("そのIDは使用できません。別のIDを入力してください。");
        } else {
          setError("アカウントの処理に失敗しました。しばらく待ってから再試行してください。");
        }
        throw error;
      }
    );

    // ローカル状態を更新
    setAccounts(prev => prev.map(account =>
      account.id === accountId
        ? { ...account, ...updates }
        : account
    ));

    // アクティブアカウントも更新
    if (activeAccount?.id === accountId) {
      setActiveAccount(prev => prev ? { ...prev, ...updates } : null);
    }
  }, [user, activeAccount]);

  /**
   * アカウントを削除
   */
  const deleteAccount = useCallback(async (accountId: string) => {
    if (!user) throw new Error('authError');

    setError(null);
    await handleServerAction(
      () => deleteSocialAccount(accountId),
      (error) => {
        console.error('Failed to delete account:', error);
        setError("アカウントの処理に失敗しました。しばらく待ってから再試行してください。");
        throw error;
      }
    );

    // ローカル状態を更新
    const remainingAccounts = accounts.filter(account => account.id !== accountId);
    setAccounts(remainingAccounts);

    // 削除されたアカウントがアクティブだった場合、他のアカウントをアクティブに
    if (activeAccount?.id === accountId) {
      const newActiveAccount = remainingAccounts[0] || null;
      setActiveAccount(newActiveAccount);

      if (newActiveAccount) {
        await handleServerAction(
          () => switchActiveAccount(newActiveAccount.id),
          (error) => {
            console.error('Failed to switch account:', error);
            setError("アカウントの処理に失敗しました。しばらく待ってから再試行してください。");
            throw error;
          }
        );
      }
    }
  }, [user, accounts, activeAccount]);

  /**
   * アカウント一覧を再読み込み
   */
  const refreshAccounts = useCallback(async () => {
    await loadAccounts();
  }, [loadAccounts]);

  /**
   * 初回ログイン時のデフォルトアカウント作成
   */
  const createDefaultAccountIfNeeded = useCallback(async () => {
    if (!user || accounts.length > 0 || loading || isCreatingDefaults) return;

    setIsCreatingDefaults(true);
    console.log('Creating default accounts for user:', user.uid);

    // Firestoreから全てのデフォルト設定を取得
    const allDefaultSettings = await handleServerAction(
      () => getAllDefaultSocialAccountSettings(),
      (error) => {
        console.error('Failed to create default accounts:', error);
        // デフォルトアカウント作成エラーは重要ではないため、ログのみ
      }
    );

    if (allDefaultSettings.length === 0) {
      console.warn('No default account settings found in Firestore');
      setIsCreatingDefaults(false);
      return;
    }

    console.log(`Found ${allDefaultSettings.length} default settings`);

    // 各設定に基づいてアカウントを作成（1設定につき1アカウント）
    for (const settings of allDefaultSettings) {
      console.log('Creating account for setting:', settings.id, settings.name);
      const defaultAccountData = createDefaultSocialAccount(settings);
      await createAccount(defaultAccountData);
      console.log('Account created successfully');
    }

    setIsCreatingDefaults(false);
  }, [user, accounts.length, loading, isCreatingDefaults, createAccount]);

  // ユーザー変更時にアカウントを読み込み
  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // 初回ログイン時のデフォルトアカウント作成
  useEffect(() => {
    // ユーザーがいて、ローディングが完了し、アカウントが0個の場合のみ実行
    if (user && !loading && accounts.length === 0) {
      createDefaultAccountIfNeeded();
    }
  }, [user, loading, accounts.length, createDefaultAccountIfNeeded]);

  // エラーの自動クリア
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const contextValue: SocialAccountContextType = {
    accounts,
    activeAccount,
    loading,
    isCreatingDefaults,
    error,
    switchAccount,
    createAccount,
    updateAccount,
    deleteAccount,
    refreshAccounts,
  };

  return (
    <SocialAccountContext.Provider value={contextValue}>
      {children}
    </SocialAccountContext.Provider>
  );
}

/**
 * ソーシャルアカウント管理のコンテキストを取得するフック
 */
export function useSocialAccountContext() {
  const context = useContext(SocialAccountContext);
  if (!context) {
    throw new Error('useSocialAccountContext must be used within SocialAccountProvider');
  }
  return context;
}