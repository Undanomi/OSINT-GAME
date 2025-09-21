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
FIREBASE_PROJECT_ID=your-project-id node scripts/seedFirestore.js data/sample-facelook.json
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

1. Firebase Console → プロジェクト設定 → サービスアカウント
2. 新しい秘密鍵を生成
3. `scripts/serviceAccountKey.json` として保存（.gitignoreに追加を忘れずに！）
4. `scripts/seedFirestore.js` を編集してサービスアカウントキーを使用

## 使い方

JSONファイルパスは必須パラメータです。

```bash
# 基本的な使い方
npm run seed data/sample.json

# 既存のドキュメントを上書きする
npm run seed:overwrite data/sample.json

# 既存のドキュメントをスキップする
npm run seed:skip data/sample.json
```

### 動作モード

- **通常モード**（デフォルト）: 既存のIDがある場合は警告を表示してスキップ
- **`--overwrite`**: 既存のドキュメントを上書き
- **`--skip-existing`**: 既存のドキュメントを静かにスキップ

### JSONファイルの形式

#### 単一ドキュメント

```json
{
  "id": "facelook_test_user",
  "title": "テスト太郎 - Facelookプロフィール",
  "url": "https://facelook.com/test.user",
  "description": "テストエンジニア at テスト株式会社",
  "template": "FacelookProfilePage",
  "domainStatus": "active",
  "archivedDate": "2024-03-15",
  "content": {
    "name": "テスト太郎",
    "profileImage": "https://example.com/profile.jpg",
    "coverImage": "https://example.com/cover.jpg",
    "friendsCount": 100,
    "joined": "2020年1月",
    "posts": [],
    "friends": [],
    "photos": []
  },
  "keywords": ["テスト太郎", "facelook", "テスト株式会社"]
}
```

#### 複数ドキュメント（配列）

```json
[
  {
    "id": "facelook_test_taro",
    "title": "テスト太郎 - Facelookプロフィール",
    "template": "FacelookProfilePage",
    "domainStatus": "expired",
    "archivedDate": "2024-03-15",
    ...
  },
  {
    "id": "facelook_test_hanako",
    "title": "テスト花子 - Facelookプロフィール",
    "template": "FacelookProfilePage",
    "domainStatus": "active",
    "archivedDate": "2024-05-20",
    ...
  }
]
```

## データ構造の詳細

### フィールド説明

- `id`: ドキュメントID（一意である必要があります）
- `title`: 検索結果に表示されるタイトル
- `url`: アクセスURL
- `description`: 検索結果に表示される説明文
- `template`: 使用するReactコンポーネント名（アイコン判定にも使用）
- `content`: ページ固有のコンテンツ（templateによって異なる）
- `keywords`: 検索用キーワードの配列
- `domainStatus`: "active" | "expired" - ドメインの状態（expiredの場合、検索結果に表示されない）
- `archivedDate`: "YYYY-MM-DD" - アーカイブ日付（Playback Machineで使用）

### Facelook用のcontent構造（1ページ完結型）

```json
{
  "name": "テスト太郎（必須）",
  "profileImage": "プロフィール画像URL（必須）",
  "coverImage": "カバー画像URL（必須）",
  "friendsCount": 123,
  "joined": "2020年1月（必須）",
  "job": "テストエンジニア（オプション）",
  "company": "テスト株式会社（オプション）",
  "location": "テスト市テスト区（オプション）",
  "hometown": "サンプル県サンプル市（オプション）",
  "education": "テスト大学（オプション）",
  "relationshipStatus": "テストステータス（オプション）",
  "bio": "テストデータ用の自己紹介（オプション）",
  "website": "https://test.example.com（オプション）",
  "posts": [
    {
      "content": "テスト投稿の内容",
      "timestamp": "2時間前",
      "likes": 42,
      "comments": 5,
      "shares": 2,
      "image": "画像URL（オプション）"
    }
  ],
  "friends": [  // 必須（空配列でも可）
    {
      "name": "サンプル花子",
      "profileImage": "プロフィール画像URL",
      "mutualFriends": 10
    }
  ],
  "photos": ["写真URL1", "写真URL2"]  // 必須（空配列でも可）
}
```

## Firebase Storage の画像を使用する場合

`gs://` 形式のURLも使用可能です。1ページ完結型のため、各ページごとにフォルダを分けて管理：

```json
{
  "profileImage": "gs://your-project-id.appspot.com/pages/facelook_test_taro/profile.jpg",
  "coverImage": "gs://your-project-id.appspot.com/pages/facelook_test_taro/cover.jpg",
  "posts": [
    {
      "image": "gs://your-project-id.appspot.com/pages/facelook_test_taro/post_001.jpg"
    }
  ],
  "friends": [
    {
      "profileImage": "gs://your-project-id.appspot.com/pages/facelook_test_taro/friend_001.jpg"
    }
  ],
  "photos": [
    "gs://your-project-id.appspot.com/pages/facelook_test_taro/photo_001.jpg",
    "gs://your-project-id.appspot.com/pages/facelook_test_taro/photo_002.jpg"
  ]
}
```

フォルダ構造：
```
/pages/
  /facelook_test_taro/     # ドキュメントIDと同じフォルダ名
    profile.jpg
    cover.jpg
    post_001.jpg
    friend_001.jpg
    photo_001.jpg
```

## 重要な注意事項

### domainStatusの設定
- `"active"`: ブラウザの検索結果に表示され、直接アクセス可能
- `"expired"`: ブラウザの検索結果に表示されず、直接URLを入力してもエラーページが表示される
- Playback MachineからはdomainStatusに関係なくすべてのページにアクセス可能

### Facelookテンプレート使用時の必須配列フィールド
FacelookProfilePageテンプレートを使用する場合、以下の配列フィールドが必須です：
- `posts`: 投稿の配列（空配列 `[]` でも可）
- `friends`: 友達の配列（空配列 `[]` でも可）
- `photos`: 写真URLの配列（空配列 `[]` でも可）

## 実行例

```bash
$ node scripts/seedFirestore.js data/sample-facelook.json

========================================
  Firestore データ自動登録スクリプト
========================================

[*] JSONファイルを読み込んでいます...
    ファイルパス: C:\Users\username\osint-game\data\sample-facelook.json

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

## メッセンジャー提出データの登録

### 概要

メッセンジャーアプリの提出問題システム用のデータを自動登録するスクリプトです。
`/submit` コマンドで表示される質問と解説データをFirestoreに登録します。

### 使い方

```bash
# 基本的な使い方
node scripts/seedSubmissionData.js data/submission-questions.json

# 既存のドキュメントを上書きする
node scripts/seedSubmissionData.js data/submission-questions.json --overwrite

# 既存のドキュメントをスキップする
node scripts/seedSubmissionData.js data/submission-questions.json --skip-existing
```

### JSONファイルの形式

#### 構造例

```json
{
  "darkOrganization": {
    "questions": [
      {
        "id": "question_001",
        "text": "質問文をここに記述\n\nA) 選択肢1\nB) 選択肢2\nC) 選択肢3\nD) 選択肢4",
        "correctAnswer": "a"
      },
      {
        "id": "question_002",
        "text": "質問文2...",
        "correctAnswer": "b"
      },
      {
        "id": "question_003",
        "text": "質問文3...",
        "correctAnswer": "c"
      }
    ],
    "explanation": {
      "text": "全問正解時の解説文をここに記述\n\n複数行での記述が可能"
    }
  }
}
```

#### フィールド説明

**NPCタイプレベル**:
- キー: NPCタイプ名（例: `darkOrganization`）

**questions配列**:
- `id`: 質問の一意識別子
- `text`: 質問文（改行 `\n` で複数行可能）
- `correctAnswer`: 正解の選択肢（小文字の a, b, c, d）

**explanation オブジェクト**:
- `text`: 全問正解時に表示される解説文

### 登録されるFirestore構造

```
messenger/
├── darkOrganization/
    └── config/
        ├── submissionQuestions     # 質問データ
        └── submissionExplanation   # 解説データ
```

### 実行例

```bash
$ node scripts/seedSubmissionData.js data/submission-questions.json

========================================
  メッセンジャー提出データ自動登録
========================================

[*] JSONファイルを読み込んでいます...
    ファイルパス: /path/to/data/submission-questions.json

[+] メッセンジャー提出データを読み込みました

[*] データを検証しています...
[+] データ検証成功

[i] 登録するNPCタイプ:
  - darkOrganization: 3個の質問

[*] Firestore へのデータ登録を開始します...

[+] 登録成功: darkOrganization/submissionQuestions (3個の質問)
[+] 登録成功: darkOrganization/submissionExplanation

========================================
[!] メッセンジャー提出データ登録が完了しました！
    成功: 2 件
    失敗: 0 件
========================================

[i] 登録されたデータの確認:
  Firebase Console → Firestore Database → messenger コレクション
  各NPCタイプ → config → submissionQuestions/submissionExplanation
```

### 重要な注意事項

#### 回答形式
- `correctAnswer` は必ず小文字で指定（a, b, c, d）
- プレイヤーの入力は大文字小文字を区別せずに比較されます

#### 質問文の形式
- 改行は `\n` で指定
- 選択肢は A), B), C), D) 形式を推奨
- 質問文は読みやすいように改行を活用

#### エラーハンドリング
- 既存データがある場合はデフォルトで警告表示
- `--overwrite` で強制上書き
- `--skip-existing` で既存データをスキップ

### NPCタイプの追加

新しいNPCタイプ（例: `government`, `corporation`）を追加する場合:

```json
{
  "darkOrganization": { ... },
  "government": {
    "questions": [ ... ],
    "explanation": { ... }
  },
  "corporation": {
    "questions": [ ... ],
    "explanation": { ... }
  }
}
```

各NPCタイプごとに独立したドキュメントが作成されます。