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
  SocialErrorType,
  createDefaultSocialAccount,
  getSocialErrorMessage
} from '@/types/social';
import { MAX_SOCIAL_ACCOUNTS_PER_USER } from '@/lib/social/constants';

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

    try {
      setError(null);
      const fetchedAccounts = await getSocialAccounts();
      setAccounts(fetchedAccounts);

      // アクティブアカウントを設定
      const active = fetchedAccounts.find(account => account.isActive) || fetchedAccounts[0] || null;
      setActiveAccount(active);
    } catch (error) {
      console.error('Failed to load social accounts:', error);
      const errorType = error instanceof Error ? error.message : 'general';
      setError(getSocialErrorMessage(errorType as SocialErrorType));
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * アカウントを切り替え
   */
  const switchAccount = useCallback(async (accountId: string) => {
    if (!user) throw new Error('authError');
    
    try {
      setError(null);
      await switchActiveAccount(accountId);
      
      // ローカル状態を更新
      setAccounts(prev => prev.map(account => ({
        ...account,
        isActive: account.id === accountId
      })));
      
      const newActiveAccount = accounts.find(account => account.id === accountId) || null;
      setActiveAccount(newActiveAccount);
    } catch (error) {
      console.error('Failed to switch account:', error);
      const errorType = error instanceof Error ? error.message : 'general';
      setError(getSocialErrorMessage(errorType as SocialErrorType));
      throw error;
    }
  }, [user, accounts]);

  /**
   * 新しいアカウントを作成
   */
  const createAccount = useCallback(async (
    accountData: SocialAccount
  ): Promise<SocialAccount> => {
    if (!user) throw new Error('authError');
    
    // アカウント数制限チェック
    if (accounts.length >= MAX_SOCIAL_ACCOUNTS_PER_USER) {
      const error = new Error('accountLimit');
      setError(getSocialErrorMessage('accountLimit'));
      throw error;
    }

    try {
      setError(null);
      
      // アカウントデータをそのまま使用（重複チェックは呼び出し側で実行）
      const newAccount = await createSocialAccount(accountData);
      
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
    } catch (error) {
      console.error('Failed to create account:', error);
      const errorType = error instanceof Error ? error.message : 'general';
      setError(getSocialErrorMessage(errorType as SocialErrorType));
      throw error;
    }
  }, [user, accounts]);

  /**
   * アカウントを更新
   */
  const updateAccount = useCallback(async (
    accountId: string, 
    updates: Partial<SocialAccount>
  ) => {
    if (!user) throw new Error('authError');
    
    try {
      setError(null);
      await updateSocialAccount(accountId, updates);
      
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
    } catch (error) {
      console.error('Failed to update account:', error);
      const errorType = error instanceof Error ? error.message : 'general';
      setError(getSocialErrorMessage(errorType as SocialErrorType));
      throw error;
    }
  }, [user, activeAccount]);

  /**
   * アカウントを削除
   */
  const deleteAccount = useCallback(async (accountId: string) => {
    if (!user) throw new Error('authError');
    
    try {
      setError(null);
      await deleteSocialAccount(accountId);
      
      // ローカル状態を更新
      const remainingAccounts = accounts.filter(account => account.id !== accountId);
      setAccounts(remainingAccounts);
      
      // 削除されたアカウントがアクティブだった場合、他のアカウントをアクティブに
      if (activeAccount?.id === accountId) {
        const newActiveAccount = remainingAccounts[0] || null;
        setActiveAccount(newActiveAccount);
        
        if (newActiveAccount) {
          await switchActiveAccount(newActiveAccount.id);
        }
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
      const errorType = error instanceof Error ? error.message : 'general';
      setError(getSocialErrorMessage(errorType as SocialErrorType));
      throw error;
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

    try {
      setIsCreatingDefaults(true);
      console.log('Creating default accounts for user:', user.uid);

      // Firestoreから全てのデフォルト設定を取得
      const allDefaultSettings = await getAllDefaultSocialAccountSettings();
      if (!allDefaultSettings || allDefaultSettings.length === 0) {
        console.warn('No default account settings found in Firestore');
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
    } catch (error) {
      console.error('Failed to create default accounts:', error);
      // デフォルトアカウント作成エラーは重要ではないため、ログのみ
    } finally {
      setIsCreatingDefaults(false);
    }
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