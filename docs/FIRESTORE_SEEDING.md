# Firestore データ自動登録ガイド

## 概要

JSONファイルからFirestoreに大量のデータを自動登録するスクリプトです。
手動でFirebase Consoleから1つずつ入力する手間を省きます。

## セットアップ

### 1. Firebase Admin SDK のインストール

```bash
npm install firebase-admin
```

### 2. プロジェクトIDの設定

以下のいずれかの方法でプロジェクトIDを設定：

#### 方法A: .env.local を使用（推奨）

`.env.local` ファイルに追加：
```
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
```

#### 方法B: 実行時に指定

```bash
FIREBASE_PROJECT_ID=your-project-id node scripts/seedSerachResults.js data/sample-facelook.json
```

### 3. Firebase Admin の認証設定

以下のいずれかの方法で認証を設定：

#### 方法A: Firebase CLI を使用（推奨）

```bash
# Firebase CLIをインストール
npm install -g firebase-tools

# ログイン
firebase login

# デフォルトプロジェクトを設定
firebase use your-project-id
```

#### 方法B: 環境変数を設定

```bash
# Windows
set GOOGLE_APPLICATION_CREDENTIALS=path\to\serviceAccountKey.json

# Mac/Linux
export GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccountKey.json
```

#### 方法C: サービスアカウントキーを使用
1. プロジェクトの設定ページの「サービスアカウント」タブを選択します
2. 「新しい秘密鍵の生成」をクリックします
3. `scripts/serviceAccountKey.json` として保存する

サービスアカウントキーはFirebaseプロジェクトの全てを操作できるため、漏洩に注意する。

## 使い方
追加するデータの種類に応じて、スクリプトおよびJSONファイルを分けてください。
JSONファイルパスは必須パラメータです。

| データの種類                  | スクリプト                         |
| --------------------------- | -------------------------------- |
| ZのNPC設定データ              | `scripts/seedSocialNPCs.js`      |
| ZのNPC投稿データ              | `scripts/seedSocialPosts.js`     |
| Zのデフォルトアカウント設定データ | `scripts/seedDefaultAccounts.js` |
| サイトデータ                  | `scripts/seedSearchResults.js`   |
| メールデータ                  | `scripts/seedGogglesMail.js`     |
| BeaconのNPC設定データ         | `scripts/seedMessengerData.js`   |

`scripts/seedSearchResults.js`はテンプレートごと個別に登録することができる。

### 動作モード
- **通常モード**（デフォルト）: 既存のIDがある場合は警告を表示してスキップ
- **`--overwrite`**: 既存のドキュメントを上書き
- **`--skip-existing`**: 既存のドキュメントをスキップ

## 実行例

```bash
$ node scripts/seedSearchResults.js data/sample-facelook.json

========================================
  Firestore データ自動登録スクリプト
========================================

[*] JSONファイルを読み込んでいます...
    ファイルパス: ..\osint-game\data\sample-facelook.json

[+] 2 件のデータを読み込みました

[*] データを検証しています...
[+] データ検証成功

[i] 登録するデータ:
  - facelook_test_taro: テスト太郎 - Facelookプロフィール
  - facelook_test_hanako: テスト花子 - Facelookプロフィール

[*] Firestore へのデータ登録を開始します...

[+] 登録成功: facelook_test_taro - テスト太郎 - Facelookプロフィール
[+] 登録成功: facelook_test_hanako - テスト花子 - Facelookプロフィール

========================================
[!] データ登録が完了しました！
    成功: 2 件
    失敗: 0 件
========================================

[i] 登録されたデータは以下のURLでアクセスできます:
  - https://facelook.com/test.taro
  - https://facelook.com/test.hanako
```
