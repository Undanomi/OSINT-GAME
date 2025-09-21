/**
 * SNS デフォルトアカウント設定登録スクリプト
 * 新規ユーザー用のデフォルトアカウント設定をFirestoreに登録
 *
 * 使い方:
 * node scripts/seedDefaultAccounts.js <JSONファイルパス>
 *
 * 例:
 * node scripts/seedDefaultAccounts.js data/default-social-accounts.json
 */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// ES modulesで__dirnameを使うための設定
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .env.localを読み込む
dotenv.config({ path: '.env.local' });

// コマンドライン引数からJSONファイルパスを取得
const jsonFilePath = process.argv[2];

if (!jsonFilePath) {
  console.error('[-] エラー: JSONファイルパスを指定してください');
  console.log('\n使い方:');
  console.log('  node scripts/seedDefaultAccounts.js <JSONファイルパス>');
  console.log('\n例:');
  console.log('  node scripts/seedDefaultAccounts.js data/default-social-accounts.json');
  process.exit(1);
}

// Firebase Admin SDK初期化
try {
  // サービスアカウントキーファイルを使用してAdmin SDKを初期化
  const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

  if (fs.existsSync(serviceAccountPath)) {
    // サービスアカウントキーファイルが存在する場合
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
    console.log('[+] Firebase Admin SDK initialized with service account key');
  } else {
    // Firebase CLIの認証を使用（gcloud認証など）
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
    if (!projectId) {
      throw new Error('プロジェクトIDが設定されていません。NEXT_PUBLIC_FIREBASE_PROJECT_ID または FIREBASE_PROJECT_ID を設定してください。');
    }

    admin.initializeApp({
      projectId: projectId
    });
    console.log('[+] Firebase Admin SDK initialized with default credentials');
  }
} catch (error) {
  console.error('[-] Firebase Admin SDK の初期化に失敗しました:', error.message);
  process.exit(1);
}

const db = admin.firestore();

/**
 * デフォルトアカウントデータの検証
 */
function validateAccountData(account) {
  const requiredFields = ['id', 'account_id', 'name', 'avatar', 'bio', 'isActive', 'canDM'];

  for (const field of requiredFields) {
    if (account[field] === undefined || account[field] === null) {
      throw new Error(`必須フィールド '${field}' が不足しています`);
    }
  }

  // idはstable_idとして使用され、UUID形式であること
  if (typeof account.id !== 'string' || account.id.length < 10) {
    throw new Error(`id フィールドは stable_id として10文字以上である必要があります: ${account.id}`);
  }

  // account_idは表示用IDとして使用される
  if (typeof account.account_id !== 'string' || account.account_id.length === 0) {
    throw new Error(`account_id フィールドは表示用IDとして必須です: ${account.account_id}`);
  }

  // アバターは1文字のアルファベットである必要がある
  if (typeof account.avatar !== 'string' || account.avatar.length !== 1 || !/^[A-Za-z]$/.test(account.avatar)) {
    throw new Error(`avatar フィールドは A-Z の1文字である必要があります: ${account.avatar}`);
  }

  // 数値フィールドのデフォルト値設定
  account.followersCount = account.followersCount || 0;
  account.followingCount = account.followingCount || 0;

  // デフォルト値の設定
  if (!account.location) account.location = '';
  if (!account.company) account.company = '';
  if (!account.position) account.position = '';
  if (!account.education) account.education = '';

  return true;
}

/**
 * デフォルトアカウントをFirestoreに登録
 */
async function registerDefaultAccount(account) {
  try {
    validateAccountData(account);

    const docRef = db.collection('defaultSocialAccountSettings').doc(account.id);

    // 既存データの確認
    const existingDoc = await docRef.get();
    if (existingDoc.exists) {
      console.log(`[!] デフォルトアカウント ${account.id} は既に存在します - スキップ`);
      return { success: false, skipped: true };
    }

    // Firestoreに登録
    await docRef.set({
      ...account,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`[+] 登録成功: ${account.id} - ${account.name}`);
    return { success: true, skipped: false };
  } catch (error) {
    console.error(`[-] 登録失敗: ${account.id} - ${error.message}`);
    return { success: false, skipped: false, error: error.message };
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log('========================================');
  console.log('  SNS デフォルトアカウント設定登録スクリプト');
  console.log('========================================');

  try {
    // JSONファイルを読み込み
    console.log('\n[*] JSONファイルを読み込んでいます...');
    const absolutePath = path.resolve(jsonFilePath);
    console.log(`    ファイルパス: ${absolutePath}`);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`JSONファイルが見つかりません: ${absolutePath}`);
    }

    const jsonData = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));

    if (!Array.isArray(jsonData)) {
      throw new Error('JSONファイルは配列形式である必要があります');
    }

    console.log(`[+] ${jsonData.length} 件のデフォルトアカウント設定を読み込みました`);

    // データ検証
    console.log('\n[*] データを検証しています...');
    for (const account of jsonData) {
      validateAccountData(account);
    }
    console.log('[+] データ検証成功');

    // 登録するデータのリスト表示
    console.log('\n[i] 登録するデフォルトアカウント設定:');
    for (const account of jsonData) {
      console.log(`  - ${account.account_id}: ${account.name} (${account.position || 'ポジション不明'})`);
      console.log(`    stable_id: ${account.id}`);
    }

    // Firestoreへの登録
    console.log('\n[*] Firestore へのデータ登録を開始します...');
    console.log('');

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const account of jsonData) {
      const result = await registerDefaultAccount(account);
      if (result.success) {
        successCount++;
      } else if (result.skipped) {
        skipCount++;
      } else {
        errorCount++;
      }
    }

    // 結果表示
    console.log('');
    console.log('========================================');
    console.log('[!] デフォルトアカウント設定登録が完了しました！');
    console.log(`    成功: ${successCount} 件`);
    console.log(`    スキップ: ${skipCount} 件`);
    console.log(`    失敗: ${errorCount} 件`);
    console.log('========================================');

    if (successCount > 0) {
      console.log('\n[i] 登録されたデフォルトアカウント設定:');
      console.log('    - defaultSocialAccountSettings/{settingId}');
      console.log('\n[i] これらの設定は新規ユーザー登録時に自動的に使用されます');
    }

  } catch (error) {
    console.error(`\n[-] エラーが発生しました: ${error.message}`);
    process.exit(1);
  }
}

// スクリプト実行
main().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('予期しないエラー:', error);
  process.exit(1);
});