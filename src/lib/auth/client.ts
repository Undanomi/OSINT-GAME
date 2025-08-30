import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { AUTH_TOKEN } from '@/lib/auth/constants';

// トークン更新タイマー - コンポーネントアンマウント時にクリア必須
let refreshTimerId: NodeJS.Timeout | null = null;

/**
 * Firebase IDトークンをHTTP-only Cookieに設定
 * 
 * Cookieフラグ:
 * - Secure: HTTPS環境でのみ設定 (localhost除く)
 * - SameSite=Strict: CSRF攻撃対策
 * - Max-Age: 3600秒 (1時間) - Firebaseトークンの有効期限に合わせる
 */
export async function setAuthCookie(user: User | null): Promise<void> {
  try {
    if (user) {
      const idToken = await user.getIdToken();
      
      // localhostではSecureフラグ不要、本番環境では必須
      const isSecure = window.location.protocol === 'https:';
      const secureFlag = isSecure ? '; Secure' : '';
      
      document.cookie = `${AUTH_TOKEN.COOKIE_NAME}=${idToken}; path=/; max-age=${AUTH_TOKEN.MAX_AGE_SECONDS}; SameSite=Strict${secureFlag}`;
      
      if (refreshTimerId) {
        clearTimeout(refreshTimerId);
      }
      
      // 55分後にトークン更新 (Firebaseトークンは60分で失効)
      const scheduleTokenRefresh = (retryCount = 0) => {
        refreshTimerId = setTimeout(async () => {
          try {
            const currentUser = auth.currentUser;
            if (currentUser) {
              await setAuthCookie(currentUser);
            }
          } catch (error) {
            console.error('Token refresh failed:', error);
            if (retryCount < 3) {
              // 指数バックオフ: 60秒 → 120秒 → 240秒
              const retryDelay = Math.min(60000 * Math.pow(2, retryCount), 240000);
              setTimeout(() => scheduleTokenRefresh(retryCount + 1), retryDelay);
            }
          }
        }, AUTH_TOKEN.REFRESH_INTERVAL_MS);
      };
      
      scheduleTokenRefresh();
    } else {
      // ログアウト処理
      if (refreshTimerId) {
        clearTimeout(refreshTimerId);
        refreshTimerId = null;
      }
      // Cookie削除時も同じSecureフラグが必要 (RFC6265準拠)
      const isSecure = window.location.protocol === 'https:';
      const secureFlag = isSecure ? '; Secure' : '';
      document.cookie = `${AUTH_TOKEN.COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict${secureFlag}`;
    }
  } catch (error) {
    console.error('Error setting auth cookie:', error);
  }
}

/**
 * Firebase Auth状態変更時にCookieを自動更新
 * AuthProviderコンポーネントの初期化時に1回呼ばれる
 */
export function initializeAuthCookie(): void {
  onAuthStateChanged(auth, async (user) => {
    await setAuthCookie(user);
  });
}

/**
 * 強制トークン更新 (エラー復旧用)
 */
export async function refreshAuthToken(): Promise<void> {
  const user = auth.currentUser;
  if (user) {
    await setAuthCookie(user);
  }
}