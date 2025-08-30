'use client';

import { useEffect, createContext, useContext } from 'react';
import { initializeAuthCookie } from '@/lib/auth-client';
import { useAuth } from '@/hooks/useAuth';
import { User } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

/**
 * 統一された認証状態管理プロバイダー
 * 認証状態とCookie管理を一元化
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  useEffect(() => {
    // 認証状態の変更を監視してCookieを自動更新
    initializeAuthCookie();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * 認証状態を取得するフック
 * useAuthの代わりにこちらを使用することで、状態の重複を防ぐ
 */
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}