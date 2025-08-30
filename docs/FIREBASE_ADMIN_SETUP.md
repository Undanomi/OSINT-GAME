# Firebase Admin SDK セットアップガイド

## 概要
NotesAppのセキュリティ強化のため、Firebase Admin SDKによる認証検証を実装しました。
以下の手順でサービスアカウントキーを取得し、環境変数を設定してください。

## セットアップ手順

### 1. Firebase コンソールでサービスアカウントキーを取得

1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. プロジェクトを選択
3. 左メニューの「プロジェクトの設定」（歯車アイコン）をクリック
4. 「サービスアカウント」タブを選択
5. 「新しい秘密鍵の生成」をクリック
6. JSONファイルがダウンロードされます

### 2. 環境変数の設定

ダウンロードしたJSONファイルから以下の値を`.env.local`に追加：

```env
# Firebase Admin SDK設定（サービスアカウントキーから取得）
FIREBASE_CLIENT_EMAIL=your-project@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**重要な注意事項：**
- `FIREBASE_PRIVATE_KEY`は改行文字（\n）を含む長い文字列です
- 値全体をダブルクォートで囲んでください
- GitHubなどにコミットしないよう`.gitignore`に`.env.local`が含まれていることを確認