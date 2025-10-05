# Firestore データ構造ガイド

## 概要
このドキュメントでは、OSINT-GAMEプロジェクトで使用される6つのコンポーネントのFirestoreデータ構造について説明します：

1. ブラウザ
2. Z - SNSアプリ
3. Beacon - メッセージアプリ
4. メモ
5. システム
6. 解説ページ
---

## 1. ブラウザ

### 統一されたデータ構造
メールを除くサイトは、`search_results`コレクションに統一された形式で保存されます。
各サイトは1ページ完結型として扱われ、リンクや遷移はありません。

### コレクション: `search_results`
`search_results`に含まれる共通ドキュメント構造は`src/types/search.ts`に示されています。
以下はサンプルのドキュメントです。
サイトのテンプレートごとに`content`内の要素が変化します。

```json
{
  "id": "facelook_test_taro",  // 一意のドキュメントID（検索結果のIDと一致）
  "title": "テスト太郎 - Facelookプロフィール",
  "url": "https://facelook.com/test.taro",
  "description": "テストエンジニア at テスト株式会社. テスト大学卒。",
  "template": "FacelookProfilePage",  // 使用するReactコンポーネント名（アイコン判定にも使用）
  "domainStatus": "active",  // "active" | "expired" | "hidden" - ドメインの状態
  "archivedDate": "2024-03-15",  // アーカイブ日付（YYYY-MM-DD形式）

  "content": {  // サイト固有のデータ（テンプレート毎に異なる）
    // Facelookの場合の例
    "name": "テスト 太郎",
    "profileImage": "gs://...",  // Firebase Storage URL
    "coverImage": "gs://...",
    "job": "テストエンジニア",
    "company": "テスト株式会社",
    "location": "テスト市テスト区",
    "hometown": "サンプル県サンプル市",
    "education": "テスト大学",
    "relationshipStatus": "既婚",
    "bio": "テストデータ用のプロフィール説明文です。",
    "friendsCount": 523,
    "joined": "2015年3月",
    "website": "https://test-taro.example.com",
    "posts": [
      {
        "content": "テスト投稿です。これはサンプルデータです！",
        "image": "gs://...",  // Optional
        "timestamp": "2時間前",
        "likes": 42,
        "comments": 5,
        "shares": 2
      }
    ],
    "friends": [
      {
        "name": "サンプル 花子",
        "profileImage": "gs://..."
      }
    ],
    "photos": ["gs://...", "gs://..."]
  },
  "keywords": ["テスト太郎", "facelook", "テスト株式会社", "テストエンジニア", "テスト大学"]
}
```

`domainStatus`フィールドはサイトの表示を制御します。
- `domainStatus: "active"`
  - 通常表示
- `domainStatus: "expired"`
  - 検索結果に表示されない、URLを直接入力した場合は通常のエラーページを表示する
  - Playback Machineを使用した場合に表示される
- `domainStatus: "hidden"`
  - 検索結果に表示されない、URLを直接入力した場合に表示できる
  - Playback Machineを使用した場合に表示される

### テンプレート別の`content`構造
テンプレートごとの`content`構造は`src/types`以下に示されています。

<details>
<summary>ファイル名とテンプレート名の対応表</summary>

| ファイル名                | 対応テンプレート           |
|-------------------------|-------------------------|
| `bbs.ts`                | BBSThreadPage           |
| `chiita.ts`             | ChiitaPage              |
| `companyReview.ts`      | CompanyReviewPage       |
| `dictionary.ts`         | DictionaryPage          |
| `elementarySchool.ts`   | ElementarySchoolPage    |
| `facelook.ts`           | FacelookProfilePage     |
| `highSchool.ts`         | HighSchoolPage          |
| `juniorHighSchool.ts`   | JuniorHighSchoolPage    |
| `kyet.ts`               | KyetPage                |
| `nittaBlog.ts`          | NittaBlogPage           |
| `nyahooNews.ts`         | NyahooNewsPage          |
| `nyahooQuestion.ts`     | NyahooQuestionPage      |
| `osintrick.ts`          | OSINTricksHomePage      |
| `productReviewBlog.ts`  | ProductReviewBlogPage   |
| `rankedon.ts`           | RankedOnProfilePage     |
| `schoolReview.ts`       | SchoolReviewPage        |
| `surnameFortune.ts`     | SurnameFortunePage      |
| `university.ts`         | UniversityPage          |
| `usopedia.ts`           | UsopediaPage            |
| `yuhishinbun.ts`        | YuhiShinbunPage         |

</details>

### コレクション: `goggles_mail`
このコレクションには、ゲーム内に登場するメールサイト(Goggles Mail)で扱われるデータが保存されます。

```typescript
// src/types/email.ts
export interface EmailData {
  id: number; // 一意の識別子
  from: string; // 差出人
  to?: string; // 宛先
  subject: string; // メールの題名
  content: string; // メールの内容
  time: string; // 送信日時（タイムスタンプであることが必要）
  unread: boolean; // 未読であるかのフラグ
  starred: boolean; // スター付きのフラグ
  folder: 'inbox' | 'sent' | 'trash'; // メールが配置されるボックス名
  originalFolder?: 'inbox' | 'sent'; // メールが元々配置されていたボックス名
}
```

サンプルドキュメントは`data/sample-goggles-mail.json`に記載しています。

```json
{
  "id": 1,
  "from": "test@goggles.com",
  "subject": "【テスト】テストのお知らせ",
  "content": "テスト...",
  "unread": true,
  "folder": "inbox",
  "time": "2022-04-11T13:00:00",
  "originalFolder": "",
  "to": "sample@goggles.com",
  "starred": true
}
```


## Z

### 概要
Zでは、以下のような階層構造でデータを管理します：
```plaintext
├── users/
│   └── {userId}/
│       └── socialAccounts/
│           └── {accountId}/
│               ├── Contacts/
│               │   └── {npcId}/
│               │       └── history/
│               │           └── {messageId}
│               └── Relationship/
│                   └── {npcId}/
│                       └── history/
│                           └── {messageId}
│
├── socialNPCs/
│   └── {npcId}/
│       ├── posts/
│       │   └── {postId}
│       └── config/
│           └── errorMessages
│
├── socialNPCPosts/
│   └── {postId}
│
└── defaultSocialAccountSettings/
    └── {accountId}
```

### ユーザーデータ (`users/{userId}/socialAccounts/{accountId}`)
ユーザーが当該アカウントで行なったアクティビティに応じて自動で記録されます。

### NPC投稿データ (`socialNPCs/{npcId}/posts`、`socialNPCPosts`)
NPCの投稿データを管理するコレクションです。

`socialNPCs/{npcId}/posts`にNPCごとの投稿データが、`socialNPCPosts`にそれら全てをまとめた投稿データが記録されます。
投稿データの構造は以下のようにで定義されるます。

```typescript
interface SocialPost {
  id: string;                    // 投稿ID
  authorId: string;              // 投稿者ID
  authorType: 'user' | 'npc';    // 投稿者タイプ
  content: string;               // 投稿内容
  timestamp: Date;               // 投稿日時
  likes: number;                 // いいね数
  comments: number;              // コメント数
  shares: number;                // シェア数
  createdAt: Date;
  updatedAt: Date;
}
```

### NPC定義 (`socialNPCs/{npcId}`)
NPCキャラクターの基本情報です。

```typescript
interface SocialNPC {
  id: string;                    // UUID形式の内部識別子
  account_id: string;            // 表示・検索用ID
  name: string;                  // 表示名
  avatar: string;                // アバター文字
  bio: string;                   // 自己紹介
  location: string;              // 所在地
  company?: string;              // 会社名
  position?: string;             // 役職
  education?: string;            // 学歴
  birthday?: string;             // 誕生日
  followersCount: number;        // フォロワー数
  followingCount: number;        // フォロー数
  canDM: boolean;                // DM可能フラグ
  systemPrompt: string;          // AI応答用システムプロンプト
  isActive: boolean;             // アクティブフラグ
  isGameOverTarget: boolean;     // ゲームオーバー対象フラグ（信頼度・警戒度によるゲームオーバー判定の対象かどうか）
}
```

### NPCエラーメッセージ(`socialNPCs/{npcId}/config/errorMessages`)

NPCごとのエラーメッセージを管理するコレクションです。

```typescript
interface errorMessages {
  aiResponseError: string;
  aiServiceError: string;
  authError: string;
  dbError: string;
  general: string;
  networkError: string;
  rateLimit: string;
}
```

### デフォルトアカウント設定 (`defaultSocialAccountSettings/{accountId}`)

新規ユーザーのデフォルトアカウント設定です。

```typescript
interface SocialAccount {
  id: string;              // バックエンドでの一意識別子
  account_id: string;      // フロントエンド表示用ID
  name: string;            // 表示名
  avatar: string;          // アバター文字
  bio: string;             // 自己紹介
  location: string;        // 所在地
  company?: string;        // 会社名
  position?: string;       // 役職
  education?: string;      // 学歴
  birthday?: string;       // 誕生日
  isActive: boolean;       // アクティブアカウントフラグ
  createdAt: Date;         // 作成日時
  updatedAt: Date;         // 更新日時
  followersCount: number;  // フォロワー数
  followingCount: number;  // フォロー数
  canDM: boolean;          // DM可能フラグ
}
```

## Beacon

### 概要
```
messenger/
├── darkOrganization/
    └── config/          # 設定データサブコレクション
        ├── submissionQuestions    # 提出問題データ
        ├── errorMessages         # エラーメッセージデータ
        ├── systemPrompts         # システムプロンプト
        └── introductionMessage   # イントロダクションメッセージ
```
### submissionQuestions ドキュメント
ターゲットの認証情報窃取の送信フェーズにおける質問項目を記載します。
```json
{
  "questions": [
    {
      "id": "question_001",
      "text": "質問文\n\nA) 選択肢1\nB) 選択肢2\nC) 選択肢3\nD) 選択肢4",
      "correctAnswer": "a"  // 正解の選択肢（小文字）
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
  ]
}
```

### errorMessages ドキュメント
エラーメッセージを管理するドキュメントです。

```javascript
{
  "rateLimit": "監視を避けるため、通信頻度を下げる必要がある。少し間を空けてくれ。",
  "dbError": "組織のデータベースに一時的な障害が発生している。",
  "networkError": "システムの異常を検知した。安全な接続を再確立している。",
  "authError": "組織のセキュリティプロトコルにより、認証が無効化された。",
  "aiServiceError": "組織の知識処理システムが一時的に利用できない。しばらく待ってくれ。",
  "aiResponseError": "応答データの整合性チェックでエラーが検出された。",
  "general": "通信エラーが発生した。セキュリティプロトコルを確認中..."
}
```

#### systemPrompts ドキュメント
闇の組織の応答を生成するAIに与えるシステムプロンプトを記載するドキュメントです。
```javascript
{
  "prompt": "あなたは「闇の組織」のエージェントです。プレイヤーに対して冷静かつ簡潔に応答してください。\n\nプレイヤーが質問をした場合は、以下のJSON形式で応答してください：\n{\n  \"responseText\": \"実際の返答内容\"\n}\n\n応答は必ずJSON形式で返してください。"
}
```

#### introductionMessage ドキュメント
ゲーム開始時に表示されるメッセージを記載するドキュメントです。
```javascript
{
  "text": "こんにちは。何かご用件がありますか？",
  "fallbackText": "メッセージを受信しました。"
}
```

## メモ
### 概要
メモでは、以下のような階層構造でデータを管理します：
```plaintext
└── users/
    └── {userId}/
        └── notes/
            └── {noteId}/
```
### ノート(`users/{userId}/notes/{noteId}`)
メモではノートを単位としてコンテンツを記録します。
ユーザーが行なったアクティビティに応じて自動で記録されます。
```typescript
interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
}
```

## システム
### 概要
デフォルトでインストールされていないアプリのインストールの有無に関するデータを、以下のような階層構造で管理します
```plaintext
└── users/
    └── {userId}/
        └── installedApps/
            └── {appName}/
```
### インストールされたアプリ(`/users/{usrId}/installedApps/{appName}`)
インストールされたアプリはその名前のドキュメントが作成されます。。
当該ドキュメントの構成は以下の通りです：
```json
{
  "installDate": "2025年10月6日 3:32:50 UTC+9",
  "lastUsed": "2025年10月6日 3:32:51 UTC+9",
  "usageCount": 1
}

```
## 解説ページ
`/explanation/video`に解説ページで使用する動画のURLを記載します。
```json
{
  "url": "URL"
}
```