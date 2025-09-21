/**
 * SNS NPC キャラクター登録スクリプト
 * NPCキャラクターのプロフィール情報をFirestoreに登録
 *
 * 使い方:
 * node scripts/seedSocialNPCs.js <JSONファイルパス>
 *
 * 例:
 * node scripts/seedSocialNPCs.js data/social-npcs.json
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
  console.log('  node scripts/seedSocialNPCs.js <JSONファイルパス>');
  console.log('\n例:');
  console.log('  node scripts/seedSocialNPCs.js data/social-npcs.json');
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
 * NPCデータの検証
 */
function validateNPCData(npc) {
  const requiredFields = ['id', 'account_id', 'name', 'avatar', 'bio', 'isActive', 'canDM', 'systemPrompt'];

  for (const field of requiredFields) {
    if (npc[field] === undefined || npc[field] === null) {
      throw new Error(`必須フィールド '${field}' が不足しています`);
    }
  }

  // idはstable_idとして使用され、UUID形式であること
  if (typeof npc.id !== 'string' || npc.id.length < 10) {
    throw new Error(`id フィールドは stable_id として10文字以上である必要があります: ${npc.id}`);
  }

  // account_idは表示用IDとして使用される
  if (typeof npc.account_id !== 'string' || npc.account_id.length === 0) {
    throw new Error(`account_id フィールドは表示用IDとして必須です: ${npc.account_id}`);
  }

  // アバターは1文字のアルファベットである必要がある
  if (typeof npc.avatar !== 'string' || npc.avatar.length !== 1 || !/^[A-Za-z]$/.test(npc.avatar)) {
    throw new Error(`avatar フィールドは A-Z の1文字である必要があります: ${npc.avatar}`);
  }

  // 数値フィールドのデフォルト値設定
  npc.followersCount = npc.followersCount || 0;
  npc.followingCount = npc.followingCount || 0;

  // デフォルト値の設定
  if (!npc.location) npc.location = '';
  if (!npc.company) npc.company = '';
  if (!npc.position) npc.position = '';
  if (!npc.education) npc.education = '';

  return true;
}

/**
 * NPCをFirestoreに登録
 */
async function registerNPC(npc) {
  try {
    validateNPCData(npc);

    const docRef = db.collection('socialNPCs').doc(npc.id);

    // 既存データの確認
    const existingDoc = await docRef.get();
    if (existingDoc.exists) {
      console.log(`[!] NPC ${npc.id} は既に存在します - スキップ`);
      return { success: false, skipped: true };
    }

    // Firestoreに登録
    await docRef.set({
      ...npc,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`[+] 登録成功: ${npc.id} - ${npc.name}`);
    return { success: true, skipped: false };
  } catch (error) {
    console.error(`[-] 登録失敗: ${npc.id} - ${error.message}`);
    return { success: false, skipped: false, error: error.message };
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log('========================================');
  console.log('  SNS NPCキャラクター登録スクリプト');
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

    console.log(`[+] ${jsonData.length} 件のNPCデータを読み込みました`);

    // データ検証
    console.log('\n[*] データを検証しています...');
    for (const npc of jsonData) {
      validateNPCData(npc);
    }
    console.log('[+] データ検証成功');

    // 登録するデータのリスト表示
    console.log('\n[i] 登録するNPCキャラクター:');
    for (const npc of jsonData) {
      console.log(`  - ${npc.id}: ${npc.name} (${npc.position || 'ポジション不明'})`);
    }

    // Firestoreへの登録
    console.log('\n[*] Firestore へのデータ登録を開始します...');
    console.log('');

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const npc of jsonData) {
      const result = await registerNPC(npc);
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
    console.log('[!] NPCキャラクター登録が完了しました！');
    console.log(`    成功: ${successCount} 件`);
    console.log(`    スキップ: ${skipCount} 件`);
    console.log(`    失敗: ${errorCount} 件`);
    console.log('========================================');

    if (successCount > 0) {
      console.log('\n[i] 登録されたNPCキャラクターはSNSアプリケーションで利用できます');
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