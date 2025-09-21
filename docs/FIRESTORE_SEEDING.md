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

---

## SNSアプリケーション用データ登録

### 概要

SNSアプリケーションでは、以下のデータを登録する必要があります：

1. **NPCキャラクター** (`socialNPCs/{npcId}`)
2. **NPC投稿データ** (`socialNPCs/{npcId}/posts/{postId}` および `socialNPCPosts/{postId}`)
3. **デフォルトアカウント設定** (`defaultSocialAccountSettings/{settingId}`)

### データファイル

SNSアプリケーション用のデータファイルが `data/` ディレクトリに用意されています：

- `data/social-npcs.json` - NPCキャラクターのプロフィール情報
- `data/social-npc-posts.json` - NPCの投稿データ
- `data/default-social-accounts.json` - 新規ユーザー用デフォルトアカウント設定

### 実行手順

#### 1. NPCキャラクターを登録

```bash
node scripts/seedSocialNPCs.js data/social-npcs.json
```

この操作で `socialNPCs/{npcId}` コレクションにNPCのプロフィール情報が登録されます。

#### 2. NPC投稿データを登録

```bash
node scripts/seedSocialPosts.js data/social-npc-posts.json
```

この操作で以下のデータが登録されます：
- `socialNPCs/{npcId}/posts/{postId}` - NPC個別の投稿
- `socialNPCPosts/{postId}` - 統合投稿コレクション

#### 3. デフォルトアカウント設定を登録

```bash
node scripts/seedDefaultAccounts.js data/default-social-accounts.json
```

この操作で `defaultSocialAccountSettings/{settingId}` にデフォルトアカウント設定が登録されます。

### 全データの一括登録

すべてのSNSデータを一度に登録する場合：

```bash
npm run seed:social
```

または手動で順次実行：

```bash
node scripts/seedSocialNPCs.js data/social-npcs.json
node scripts/seedSocialPosts.js data/social-npc-posts.json
node scripts/seedDefaultAccounts.js data/default-social-accounts.json
```

### データ構造の詳細

#### NPCキャラクター (`social-npcs.json`)

```json
{
  "id": "ai_researcher",
  "name": "ミラベル・テクノス",
  "avatar": "M",
  "bio": "AI研究者として新しい可能性を探求しています...",
  "location": "ネオトーキョー・シリコン区",
  "company": "フューチャーマインド研究所",
  "position": "主任研究員",
  "education": "カイゼン工科大学 情報融合学院",
  "birthday": "1988-04-15",
  "followersCount": 2847,
  "followingCount": 1923,
  "canDM": true,
  "systemPrompt": "あなたはAI研究者の...",
  "isActive": true
}
```

#### NPC投稿データ (`social-npc-posts.json`)

```json
{
  "npcId": "ai_researcher",
  "posts": [
    {
      "id": "ai_post_001",
      "content": "量子機械学習の新しい研究成果が...",
      "timestamp": "2024-01-15T10:30:00Z",
      "likes": 156,
      "comments": 23,
      "shares": 45
    }
  ]
}
```

#### デフォルトアカウント (`default-social-accounts.json`) - デュアルIDシステム対応

```json
{
  "id": "a7f3d8e2-4b9c-4d6f-8e2a-1f5b3c7d9e4a",   // stable_id（UUID形式、テンプレート用）
  "account_id": "detective_01",                   // ユーザーのデフォルト表示ID
  "name": "探偵 ケン",
  "avatar": "K",
  "bio": "情報収集と分析が得意な探偵です...",
  "location": "インベスティゲート・シティ",
  "company": "フリーランス",
  "position": "プライベート・インベスティゲーター",
  "education": "クリムゾン大学 法学部",
  "birthday": "1990-05-15",
  "isActive": true,
  "followersCount": 150,
  "followingCount": 200,
  "canDM": true
}
```

**重要**: デフォルトアカウントでもデュアルIDシステムを使用し、新規ユーザーにコピーされる際に新しいstable_idが生成されます。

### 注意事項

- **データの整合性**: NPCの投稿データを登録する前に、対応するNPCキャラクターが `socialNPCs` コレクションに存在している必要があります
- **デュアルIDシステム**: すべてのNPCとデフォルトアカウントはUUID形式のstable_idと表示用のaccount_idを持ちます
- **タイムスタンプ**: 投稿の `timestamp` は ISO 8601 形式で記載してください
- **ID の一意性**: 各データのstable_idとaccount_idはそれぞれ一意である必要があります
- **UUID形式**: stable_idはUUID形式（例: d1e2f3g4-5h6i-7j8k-9l0m-n1o2p3q4r5s6）で記載してください
- **アバター文字**: アバターは A-Z の1文字で指定してください

### トラブルシューティング

#### エラー: NPC not found
NPCの投稿データを登録する際に「NPC not found」エラーが発生する場合は、先にNPCキャラクター(`social-npcs.json`)を登録してください。

#### エラー: Invalid timestamp format
タイムスタンプが無効な場合は、ISO 8601形式（例: `2024-01-15T10:30:00Z`）で記載されているか確認してください。

#### エラー: Duplicate ID
IDが重複している場合は、各データファイル内でIDが一意になるよう修正してください。