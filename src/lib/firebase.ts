import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// Firebase設定（環境変数から読み込み）
// 最小限の設定のみ使用
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`, // 自動生成
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: '', // 今回は不要
  appId: '' // 今回は不要
};

// Firebaseアプリの初期化
const app = initializeApp(firebaseConfig);

// Firestoreインスタンス
export const db = getFirestore(app);

// Storageインスタンス
export const storage = getStorage(app);

// Authenticationインスタンス
export const auth = getAuth(app);

export default app;