import admin from 'firebase-admin';

let adminApp: admin.app.App | null = null;

/**
 * Firebase Admin SDKを初期化
 * サーバーサイドでのみ使用
 */
export function initializeFirebaseAdmin(): admin.app.App {
  if (adminApp) {
    return adminApp;
  }

  try {
    // 環境変数から認証情報を取得
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      const missingVars = [];
      if (!projectId) missingVars.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
      if (!clientEmail) missingVars.push('FIREBASE_CLIENT_EMAIL');
      if (!privateKey) missingVars.push('FIREBASE_PRIVATE_KEY');

      throw new Error(
        `Firebase Admin環境変数が設定されていません: ${missingVars.join(', ')}\n` +
        'これらの環境変数を .env.local に設定してください。\n' +
        'サービスアカウントキーは Firebase Console > Project Settings > Service Accounts から取得できます。'
      );
    }

    // Admin SDKを初期化
    adminApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('Firebase Admin SDK initialized successfully');
    }
    return adminApp;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Firebase Admin SDK initialization error:', error);
    }
    throw error;
  }
}

/**
 * Firebase Admin インスタンスを取得
 */
export function getFirebaseAdmin(): admin.app.App {
  if (!adminApp) {
    return initializeFirebaseAdmin();
  }
  return adminApp;
}

/**
 * IDトークンを検証してユーザーIDを取得
 * @param idToken - クライアントから送信されたIDトークン
 * @returns 検証済みのユーザーID、無効な場合はnull
 */
export async function verifyIdToken(idToken: string): Promise<string | null> {
  try {
    const admin = getFirebaseAdmin();
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken.uid;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Token verification failed:', error);
    }
    return null;
  }
}

/**
 * Admin Firestore インスタンスを取得
 */
export function getAdminFirestore(): admin.firestore.Firestore {
  const app = getFirebaseAdmin();
  return app.firestore()
}