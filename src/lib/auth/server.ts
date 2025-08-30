import { cookies } from 'next/headers';
import { verifyIdToken } from '@/lib/auth/firebase-admin';

/**
 * リクエストからFirebase IDトークンを取得
 * 
 * 取得優先順位:
 * 1. firebase-auth-tokenクッキー (auth-client.tsで設定)
 * 2. authorizationクッキー (Bearer token形式)
 */
async function getIdTokenFromRequest(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    
    // auth-client.tsのsetAuthCookie()で設定されたトークン
    const tokenFromCookie = cookieStore.get('firebase-auth-token')?.value;
    if (tokenFromCookie) {
      return tokenFromCookie;
    }
    
    // Bearer token形式のフォールバック
    const authHeader = cookieStore.get('authorization')?.value;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    return null;
  } catch (error) {
    console.error('Error getting ID token from request:', error);
    return null;
  }
}

/**
 * Server Actionsで使用する認証済みユーザーID取得
 * 
 * @returns Firebase UID または null（未認証時）
 * @throws なし - エラー時はnullを返す
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  try {
    const idToken = await getIdTokenFromRequest();
    
    if (!idToken) {
      if (process.env.NODE_ENV === 'development') {
        console.log('No auth token found in request');
      }
      return null;
    }
    
    // firebase-admin.tsのverifyIdToken()でJWT検証
    const userId = await verifyIdToken(idToken);
    
    if (!userId) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Token verification failed');
      }
      return null;
    }
    
    return userId;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Authentication error:', error);
    }
    // トークン期限切れ、改竄、その他のエラーはすべてnullを返す
    return null;
  }
}

/**
 * 認証必須のServer Action用高階関数
 * 
 * 使用例:
 * const myAction = requireAuth(async (userId, data) => {
 *   // userIdが保証された処理
 * });
 */
export function requireAuth<T extends unknown[], R>(
  action: (userId: string, ...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      throw new Error('認証が必要です。ログインしてください。');
    }
    
    return action(userId, ...args);
  };
}

/**
 * @deprecated Server Actionsでは不要 - auth-client.tsでCookie管理
 */
export function setAuthHeaders(): void {
  // No-op: Cookie設定はクライアント側で実施
}