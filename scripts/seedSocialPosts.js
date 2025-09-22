/**
 * SNS NPC投稿データ登録スクリプト
 * NPC投稿データをFirestoreに登録（個別 + 統合コレクション）
 *
 * 使い方:
 * node scripts/seedSocialPosts.js <JSONファイルパス>
 *
 * 例:
 * node scripts/seedSocialPosts.js data/social-npc-posts.json
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
  console.log('  node scripts/seedSocialPosts.js <JSONファイルパス>');
  console.log('\n例:');
  console.log('  node scripts/seedSocialPosts.js data/social-npc-posts.json');
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
 * タイムスタンプベースのドキュメントIDを生成
 */
function generateTimestampId(timestamp) {
  const timeString = timestamp.toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${timeString}_${randomSuffix}`;
}

/**
 * 投稿データの検証
 */
function validatePostData(post) {
  const requiredFields = ['content', 'timestamp', 'likes', 'comments', 'shares'];

  for (const field of requiredFields) {
    if (post[field] === undefined || post[field] === null) {
      throw new Error(`必須フィールド '${field}' が不足しています`);
    }
  }

  // timestampをDateオブジェクトに変換
  let timestampDate;
  if (typeof post.timestamp === 'string') {
    timestampDate = new Date(post.timestamp);
  } else if (post.timestamp instanceof Date) {
    timestampDate = post.timestamp;
  } else if (post.timestamp && typeof post.timestamp.toDate === 'function') {
    // すでにFirestore Timestampの場合
    timestampDate = post.timestamp.toDate();
  } else {
    throw new Error('timestampはDateオブジェクト、文字列、またはFirestore Timestampである必要があります');
  }

  // タイムスタンプベースのIDを生成（既存のIDを上書き）
  post.id = generateTimestampId(timestampDate);
  post.timestamp = admin.firestore.Timestamp.fromDate(timestampDate);

  // 数値フィールドの確認
  post.likes = Number(post.likes) || 0;
  post.comments = Number(post.comments) || 0;
  post.shares = Number(post.shares) || 0;

  return true;
}

/**
 * NPCの存在確認
 */
async function checkNPCExists(npcId) {
  const npcDoc = await db.collection('socialNPCs').doc(npcId).get();
  return npcDoc.exists;
}

/**
 * NPC投稿をFirestoreに登録
 */
async function registerNPCPost(npcId, post) {
  try {
    validatePostData(post);

    // NPCの存在確認
    const npcExists = await checkNPCExists(npcId);
    if (!npcExists) {
      throw new Error(`NPC ${npcId} が見つかりません。先にNPCキャラクターを登録してください。`);
    }

    // 投稿データを準備（タイムスタンプベースIDを使用）
    const postData = {
      ...post,
      authorId: npcId,
      authorType: 'npc',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // 1. NPC個別投稿コレクションに登録
    const npcPostRef = db.collection('socialNPCs').doc(npcId).collection('posts').doc(post.id);
    const existingNPCPost = await npcPostRef.get();

    if (existingNPCPost.exists) {
      console.log(`[!] NPC投稿 ${npcId}/${post.id} は既に存在します - スキップ`);
      return { success: false, skipped: true };
    }

    await npcPostRef.set(postData);

    // 2. 統合投稿コレクションにもコピー（タイムスタンプベースIDで効率的な検索が可能）
    const centralPostRef = db.collection('socialNPCPosts').doc(post.id);
    await centralPostRef.set(postData);

    console.log(`[+] 投稿登録成功: ${npcId}/${post.id}`);
    return { success: true, skipped: false };

  } catch (error) {
    console.error(`[-] 投稿登録失敗: ${npcId}/${post.id} - ${error.message}`);
    return { success: false, skipped: false, error: error.message };
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log('========================================');
  console.log('  SNS NPC投稿データ登録スクリプト');
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

    // 投稿データの総数を計算
    let totalPosts = 0;
    for (const npcData of jsonData) {
      if (npcData.posts && Array.isArray(npcData.posts)) {
        totalPosts += npcData.posts.length;
      }
    }

    console.log(`[+] ${jsonData.length} 件のNPCデータ、計 ${totalPosts} 件の投稿を読み込みました`);

    // データ検証
    console.log('\n[*] データを検証しています...');
    for (const npcData of jsonData) {
      if (!npcData.npcId) {
        throw new Error('npcId フィールドが必要です');
      }
      if (!npcData.posts || !Array.isArray(npcData.posts)) {
        throw new Error(`NPC ${npcData.npcId} の posts フィールドが配列ではありません`);
      }
      for (const post of npcData.posts) {
        validatePostData(post);
      }
    }
    console.log('[+] データ検証成功');

    // 登録するデータのリスト表示
    console.log('\n[i] 登録する投稿データ:');
    for (const npcData of jsonData) {
      console.log(`  - ${npcData.npcId}: ${npcData.posts.length} 件の投稿`);
      for (const post of npcData.posts) {
        // 一時的にIDを生成して表示用に使用
        let tempTimestamp;
        if (typeof post.timestamp === 'string') {
          tempTimestamp = new Date(post.timestamp);
        } else if (post.timestamp instanceof Date) {
          tempTimestamp = post.timestamp;
        } else {
          tempTimestamp = new Date(); // フォールバック
        }
        const tempId = generateTimestampId(tempTimestamp);
        console.log(`    - ${tempId}: ${post.content.substring(0, 50)}...`);
      }
    }

    // Firestoreへの登録
    console.log('\n[*] Firestore へのデータ登録を開始します...');
    console.log('');

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const npcData of jsonData) {
      for (const post of npcData.posts) {
        const result = await registerNPCPost(npcData.npcId, post);
        if (result.success) {
          successCount++;
        } else if (result.skipped) {
          skipCount++;
        } else {
          errorCount++;
        }
      }
    }

    // 結果表示
    console.log('');
    console.log('========================================');
    console.log('[!] NPC投稿データ登録が完了しました！');
    console.log(`    成功: ${successCount} 件`);
    console.log(`    スキップ: ${skipCount} 件`);
    console.log(`    失敗: ${errorCount} 件`);
    console.log('========================================');

    if (successCount > 0) {
      console.log('\n[i] 登録された投稿データ:');
      console.log('    - socialNPCs/{npcId}/posts/{postId} - NPC個別投稿');
      console.log('    - socialNPCPosts/{postId} - 統合投稿コレクション');
      console.log('\n[i] これらの投稿はSNSアプリケーションのタイムラインに表示されます');
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