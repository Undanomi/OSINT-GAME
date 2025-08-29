/**
 * Firestore データ自動登録スクリプト
 * JSONファイルからデータを読み込んでFirestoreに登録
 * 
 * 使い方:
 * 1. データを data/seed.json に配置（またはパスを指定）
 * 2. npm install firebase-admin を実行
 * 3. node scripts/seedFirestore.js [JSONファイルパス] を実行
 * 
 * 例:
 * node scripts/seedFirestore.js                    # デフォルト: data/seed.json
 * node scripts/seedFirestore.js data/facelook.json # カスタムパス
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// .env.localを読み込む
require('dotenv').config({ path: '.env.local' });

// コマンドライン引数からJSONファイルパスを取得（デフォルト: data/seed.json）
const jsonFilePath = process.argv[2] || 'data/seed.json';
const absolutePath = path.resolve(jsonFilePath);

// オプション: --overwrite フラグで上書きを許可
const allowOverwrite = process.argv.includes('--overwrite');
const skipExisting = process.argv.includes('--skip-existing');

// Firebase Admin SDK の初期化
// プロジェクトIDは環境変数から取得
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;

if (!projectId) {
  console.error('[-] Firebase プロジェクトIDが設定されていません');
  console.log('[i] 以下のいずれかの方法で設定してください:');
  console.log('    1. .env.local に NEXT_PUBLIC_FIREBASE_PROJECT_ID を設定');
  console.log('    2. 環境変数 FIREBASE_PROJECT_ID を設定');
  console.log('    3. コマンド実行時に指定: FIREBASE_PROJECT_ID=your-project-id node scripts/seedFirestore.js');
  process.exit(1);
}

// サービスアカウントキーをチェック
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
if (fs.existsSync(serviceAccountPath)) {
  console.log('[i] サービスアカウントキーを使用して認証します');
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: projectId,
  });
} else {
  console.log('[i] デフォルト認証を使用します（サービスアカウントキーが見つかりません）');
  console.log('[i] scripts/serviceAccountKey.json を配置するか、Firebase CLIでログインしてください');
  admin.initializeApp({
    projectId: projectId,
  });
}

const db = admin.firestore();

// JSONファイルを読み込む関数
function loadJsonData(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`[-] ファイルが見つかりません: ${filePath}`);
      console.log('\n[i] JSONファイルの例:');
      console.log(JSON.stringify(sampleStructure, null, 2));
      process.exit(1);
    }

    const rawData = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(rawData);

    // 配列でもオブジェクトでも対応
    return Array.isArray(data) ? data : [data];
  } catch (error) {
    console.error(`[-] JSONファイルの読み込みに失敗しました: ${error.message}`);
    process.exit(1);
  }
}

// JSONファイルの構造例
const sampleStructure = [
  {
    id: 'facelook_test_user',
    title: 'テスト 太郎 - Facelookプロフィール',
    url: 'https://facelook.com/test.user',
    description: 'テストユーザーのプロフィール説明文',
    template: 'FacelookProfilePage',
    content: {
      name: 'テスト 太郎',
      profileImage: 'https://example.com/test-profile.jpg',
      coverImage: 'https://example.com/test-cover.jpg',
      job: 'テスト職',
      company: 'テスト株式会社',
      location: 'テスト市テスト区',
      hometown: 'サンプル県サンプル市',
      education: 'テスト大学',
      relationshipStatus: 'テストステータス',
      bio: 'これはテストデータです。実在の人物・団体とは関係ありません',
      friendsCount: 100,
      joined: '2020年1月',
      website: 'https://test.example.com',
      posts: [
        {
          content: 'テスト投稿の内容',
          image: 'https://example.com/test-post.jpg',
          timestamp: '2時間前',
          likes: 42,
          comments: 5,
          shares: 2
        }
      ],
      friends: [
        {
          name: 'サンプル 友人',
          profileImage: 'https://example.com/test-friend.jpg',
          mutualFriends: 10
        }
      ],
      photos: ['https://example.com/test-photo1.jpg']
    },
    keywords: ['テストキーワード1', 'テストキーワード2']
  }
];

// データ検証関数
function validateData(data) {
  const requiredFields = ['id', 'title', 'url', 'description', 'template', 'content'];
  const errors = [];

  data.forEach((item, index) => {
    requiredFields.forEach(field => {
      if (!item[field]) {
        errors.push(`Item ${index}: "${field}" フィールドが不足しています`);
      }
    });

    // template別の検証
    if (item.template === 'FacelookProfilePage' && item.content) {
      const contentRequiredFields = ['name', 'profileImage', 'coverImage', 'friendsCount', 'joined'];
      contentRequiredFields.forEach(field => {
        if (!item.content[field]) {
          errors.push(`Item ${index}: content."${field}" フィールドが不足しています`);
        }
      });

      // 配列フィールドの検証
      ['posts', 'friends', 'photos'].forEach(field => {
        if (!Array.isArray(item.content[field])) {
          errors.push(`Item ${index}: content.${field} は配列である必要があります`);
        }
      });
    }
  });

  if (errors.length > 0) {
    console.error('[-] データ検証エラー:');
    errors.forEach(error => console.error(`  - ${error}`));
    return false;
  }

  return true;
}

// データをFirestoreに登録する関数
async function seedData() {
  console.log('[*] JSONファイルを読み込んでいます...');
  console.log(`    ファイルパス: ${absolutePath}\n`);

  const data = loadJsonData(absolutePath);
  
  console.log(`[+] ${data.length} 件のデータを読み込みました\n`);
  
  // データ検証
  console.log('[*] データを検証しています...');
  if (!validateData(data)) {
    console.error('\n[-] データ検証に失敗しました。JSONファイルを修正してください。');
    process.exit(1);
  }
  console.log('[+] データ検証成功\n');

  // 登録確認
  console.log('[i] 登録するデータ:');
  data.forEach(item => {
    console.log(`  - ${item.id}: ${item.title}`);
  });
  console.log();

  // Firestoreへの登録
  console.log('[*] Firestore へのデータ登録を開始します...\n');

  let successCount = 0;
  let failCount = 0;

  for (const item of data) {
    try {
      const docRef = db.collection('search_results').doc(item.id);
      const doc = await docRef.get();
      
      if (doc.exists) {
        if (skipExisting) {
          console.log(`[*] スキップ（既存）: ${item.id} - ${item.title}`);
          continue;
        } else if (!allowOverwrite) {
          console.log(`[!] 警告: ${item.id} は既に存在します。上書きするには --overwrite オプションを使用してください`);
          failCount++;
          continue;
        } else {
          console.log(`[*] 上書き: ${item.id} - ${item.title}`);
        }
      }
      
      // ドキュメントを登録
      await docRef.set(item);
      console.log(`[+] 登録成功: ${item.id} - ${item.title}`);
      successCount++;
    } catch (error) {
      console.error(`[-] 登録失敗: ${item.id}`, error.message);
      failCount++;
    }
  }

  console.log('\n========================================');
  console.log('[!] データ登録が完了しました！');
  console.log(`    成功: ${successCount} 件`);
  console.log(`    失敗: ${failCount} 件`);
  console.log('========================================\n');

  if (successCount > 0) {
    console.log('[i] 登録されたデータは以下のURLでアクセスできます:');
    data.filter(item => item.url).forEach(item => {
      console.log(`  - ${item.url}`);
    });
  }

  process.exit(failCount > 0 ? 1 : 0);
}

// スクリプト実行
console.log('========================================');
console.log('  Firestore データ自動登録スクリプト');
console.log('========================================\n');

if (allowOverwrite) {
  console.log('[!] 上書きモード: 既存のドキュメントを上書きします\n');
} else if (skipExisting) {
  console.log('[!] スキップモード: 既存のドキュメントをスキップします\n');
} else {
  console.log('[i] 通常モード: 既存のドキュメントがある場合は警告を表示します\n');
}

seedData().catch(error => {
  console.error('[E] エラーが発生しました:', error);
  process.exit(1);
});