/**
 * メッセンジャー提出問題データ自動登録スクリプト
 * JSONファイルからメッセンジャーの提出問題データをFirestoreに登録
 *
 * 使い方:
 * node scripts/seedSubmissionData.js <JSONファイルパス> [オプション]
 *
 * 例:
 * node scripts/seedSubmissionData.js data/submission-questions.json
 * node scripts/seedSubmissionData.js data/submission-questions.json --overwrite
 * node scripts/seedSubmissionData.js data/submission-questions.json --skip-existing
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

// オプション: --overwrite フラグで上書きを許可
const allowOverwrite = process.argv.includes('--overwrite');
const skipExisting = process.argv.includes('--skip-existing');

// コマンドライン引数からJSONファイルパスを取得（必須）
const args = process.argv.slice(2).filter(arg => !arg.startsWith('--'));
const jsonFilePath = args[0];

// ファイルパスが指定されていない場合はエラー
if (!jsonFilePath) {
  console.error('[-] エラー: JSONファイルパスを指定してください');
  console.log('\n使い方:');
  console.log('  node scripts/seedSubmissionData.js <JSONファイルパス> [オプション]');
  console.log('\n例:');
  console.log('  node scripts/seedSubmissionData.js data/submission-questions.json');
  console.log('  node scripts/seedSubmissionData.js data/submission-questions.json --overwrite');
  console.log('  node scripts/seedSubmissionData.js data/submission-questions.json --skip-existing');
  console.log('\nまたはnpmスクリプトを使用:');
  console.log('  npm run seed:submission data/submission-questions.json');
  console.log('  npm run seed:submission:overwrite data/submission-questions.json');
  console.log('  npm run seed:submission:skip data/submission-questions.json');
  process.exit(1);
}
const absolutePath = path.resolve(jsonFilePath);

// Firebase Admin SDK の初期化
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;

if (!projectId) {
  console.error('[-] Firebase プロジェクトIDが設定されていません');
  console.log('[i] 以下のいずれかの方法で設定してください:');
  console.log('    1. .env.local に NEXT_PUBLIC_FIREBASE_PROJECT_ID を設定');
  console.log('    2. 環境変数 FIREBASE_PROJECT_ID を設定');
  console.log('    3. コマンド実行時に指定: FIREBASE_PROJECT_ID=your-project-id node scripts/seedSubmissionData.js');
  process.exit(1);
}

// サービスアカウントキーをチェック
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
if (fs.existsSync(serviceAccountPath)) {
  console.log('[i] サービスアカウントキーを使用して認証します');
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
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

    return data;
  } catch (error) {
    console.error(`[-] JSONファイルの読み込みに失敗しました: ${error.message}`);
    process.exit(1);
  }
}

// JSONファイルの構造例
const sampleStructure = {
  "darkOrganization": {
    "questions": [
      {
        "id": "question_001",
        "text": "質問文をここに記述\n\nA) 選択肢1\nB) 選択肢2\nC) 選択肢3\nD) 選択肢4",
        "correctAnswer": "a"
      }
    ],
    "explanation": {
      "text": "解説文をここに記述"
    }
  }
};

// データ検証関数
function validateData(data) {
  const errors = [];

  // ルートレベルの検証
  if (typeof data !== 'object' || data === null) {
    errors.push('データはオブジェクトである必要があります');
    return false;
  }

  // NPCタイプごとの検証
  Object.keys(data).forEach(npcType => {
    const npcData = data[npcType];

    if (!npcData || typeof npcData !== 'object') {
      errors.push(`${npcType}: NPCデータはオブジェクトである必要があります`);
      return;
    }

    // 必須フィールドの検証
    if (!npcData.questions || !Array.isArray(npcData.questions)) {
      errors.push(`${npcType}: questions フィールドが不足しているか、配列ではありません`);
    } else {
      // 質問データの検証
      npcData.questions.forEach((question, index) => {
        if (!question.id) {
          errors.push(`${npcType}: question ${index} の id フィールドが不足しています`);
        }
        if (!question.text) {
          errors.push(`${npcType}: question ${index} の text フィールドが不足しています`);
        }
        if (!question.correctAnswer) {
          errors.push(`${npcType}: question ${index} の correctAnswer フィールドが不足しています`);
        }
      });
    }

    if (!npcData.explanation || typeof npcData.explanation !== 'object') {
      errors.push(`${npcType}: explanation フィールドが不足しているか、オブジェクトではありません`);
    } else if (!npcData.explanation.text) {
      errors.push(`${npcType}: explanation.text フィールドが不足しています`);
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
async function seedSubmissionData() {
  console.log('[*] JSONファイルを読み込んでいます...');
  console.log(`    ファイルパス: ${absolutePath}\n`);

  const data = loadJsonData(absolutePath);

  console.log(`[+] メッセンジャー提出データを読み込みました\n`);

  // データ検証
  console.log('[*] データを検証しています...');
  if (!validateData(data)) {
    console.error('\n[-] データ検証に失敗しました。JSONファイルを修正してください。');
    process.exit(1);
  }
  console.log('[+] データ検証成功\n');

  // 登録確認
  console.log('[i] 登録するNPCタイプ:');
  Object.keys(data).forEach(npcType => {
    const questionCount = data[npcType].questions?.length || 0;
    console.log(`  - ${npcType}: ${questionCount}個の質問`);
  });
  console.log();

  // Firestoreへの登録
  console.log('[*] Firestore へのデータ登録を開始します...\n');

  let successCount = 0;
  let failCount = 0;

  for (const [npcType, npcData] of Object.entries(data)) {
    try {
      // 質問データの登録
      const questionsDocRef = db.collection('messenger').doc(npcType).collection('config').doc('submissionQuestions');
      const questionsDoc = await questionsDocRef.get();

      if (questionsDoc.exists) {
        if (skipExisting) {
          console.log(`[*] スキップ（既存）: ${npcType}/submissionQuestions`);
          continue;
        } else if (!allowOverwrite) {
          console.log(`[!] 警告: ${npcType}/submissionQuestions は既に存在します。上書きするには --overwrite オプションを使用してください`);
          failCount++;
          continue;
        } else {
          console.log(`[*] 上書き: ${npcType}/submissionQuestions`);
        }
      }

      // 質問データを登録
      await questionsDocRef.set({ questions: npcData.questions });
      console.log(`[+] 登録成功: ${npcType}/submissionQuestions (${npcData.questions.length}個の質問)`);
      successCount++;

      // 解説データの登録
      const explanationDocRef = db.collection('messenger').doc(npcType).collection('config').doc('submissionExplanation');
      const explanationDoc = await explanationDocRef.get();

      if (explanationDoc.exists && !allowOverwrite && !skipExisting) {
        console.log(`[!] 警告: ${npcType}/submissionExplanation は既に存在します。上書きするには --overwrite オプションを使用してください`);
        failCount++;
        continue;
      }

      if (explanationDoc.exists && skipExisting) {
        console.log(`[*] スキップ（既存）: ${npcType}/submissionExplanation`);
        continue;
      }

      if (explanationDoc.exists && allowOverwrite) {
        console.log(`[*] 上書き: ${npcType}/submissionExplanation`);
      }

      // 解説データを登録
      await explanationDocRef.set(npcData.explanation);
      console.log(`[+] 登録成功: ${npcType}/submissionExplanation`);
      successCount++;

    } catch (error) {
      console.error(`[-] 登録失敗: ${npcType}`, error.message);
      failCount++;
    }
  }

  console.log('\n========================================');
  console.log('[!] メッセンジャー提出データ登録が完了しました！');
  console.log(`    成功: ${successCount} 件`);
  console.log(`    失敗: ${failCount} 件`);
  console.log('========================================\n');

  if (successCount > 0) {
    console.log('[i] 登録されたデータの確認:');
    console.log('  Firebase Console → Firestore Database → messenger コレクション');
    console.log('  各NPCタイプ → config → submissionQuestions/submissionExplanation');
  }

  process.exit(failCount > 0 ? 1 : 0);
}

// スクリプト実行
console.log('========================================');
console.log('  メッセンジャー提出データ自動登録');
console.log('========================================\n');

if (allowOverwrite) {
  console.log('[!] 上書きモード: 既存のドキュメントを上書きします\n');
} else if (skipExisting) {
  console.log('[!] スキップモード: 既存のドキュメントをスキップします\n');
} else {
  console.log('[i] 通常モード: 既存のドキュメントがある場合は警告を表示します\n');
}

seedSubmissionData().catch(error => {
  console.error('[E] エラーが発生しました:', error);
  process.exit(1);
});