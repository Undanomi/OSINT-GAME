# Firestore データ構造ガイド

## 概要

このドキュメントでは、OSINT-GAMEプロジェクトで使用される2つの主要システムのFirestoreデータ構造について説明します：

1. **OSINT検索システム** - 偽サイトページの検索・表示システム
2. **SNSアプリケーション** - ソーシャルメディア機能

---

## 1. OSINT検索システム

### 統一されたデータ構造

すべての偽サイトページは、`search_results` コレクションに統一された形式で保存されます。
各ページは1ページ完結型として扱われ、リンクや遷移はありません。

### コレクション: `search_results`

#### ドキュメント構造

```javascript
{
  "id": "facelook_test_taro",  // 一意のID（検索結果のIDと一致）
  "title": "テスト太郎 - Facelookプロフィール",
  "url": "https://facelook.com/test.taro",
  "description": "テストエンジニア at テスト株式会社. テスト大学卒。",
  "template": "FacelookProfilePage",  // 使用するReactコンポーネント名（アイコン判定にも使用）
  "domainStatus": "active",  // "active" | "expired" - ドメインの状態
  "archivedDate": "2024-03-15",  // アーカイブ日付（YYYY-MM-DD形式）

  "content": {  // ページ固有のデータ（template毎に異なる）
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
        "profileImage": "gs://...",
        "mutualFriends": 12
      }
    ],
    "photos": ["gs://...", "gs://..."]
  },
  "keywords": ["テスト太郎", "facelook", "テスト株式会社", "テストエンジニア", "テスト大学"]
}
```

## テンプレート別のcontent構造

### FacelookProfilePage


```typescript
interface FacelookContent {
  name: string;
  profileImage: string;
  coverImage: string;
  job?: string;
  company?: string;
  location?: string;
  hometown?: string;
  education?: string;
  relationshipStatus?: string;
  bio?: string;
  friendsCount: number;
  joined: string;
  website?: string;
  posts: Array<{
    content: string;
    image?: string;
    timestamp: string;
    likes: number;
    comments: number;
    shares?: number;
  }>;
  friends: Array<{
    name: string;
    profileImage: string;
    mutualFriends: number;
  }>;
  photos: string[];
}
```

## Firestoreへのデータ追加例

Firebase Consoleから手動でデータを追加する場合：

1. **Firestore Database** → **データ** タブを開く
2. **+ コレクションを開始** をクリック
3. コレクションID: `search_results` を入力
4. ドキュメントIDを入力（例: `facelook_test_taro`）
5. フィールドを追加:
   - `id` (string): facelook_test_taro
   - `title` (string): テスト太郎 - Facelookプロフィール
   - `url` (string): https://facelook.com/test.taro
   - `description` (string): テストエンジニア at テスト株式会社
   - `template` (string): FacelookProfilePage
   - `domainStatus` (string): active または expired
   - `archivedDate` (string): 2024-03-15（YYYY-MM-DD形式）
   - `content` (map): 上記の構造に従ってデータを入力
   - `keywords` (array): 検索用キーワードを配列で入力

## Firebase Storage構造

1ページ完結型のため、各ページごとにフォルダを分けて管理：

```
/pages/
  /facelook_test_taro/        # ドキュメントIDと同じフォルダ名
    profile.jpg                # プロフィール画像
    cover.jpg                  # カバー画像
    post_001.jpg               # 投稿画像1
    post_002.jpg               # 投稿画像2
    friend_001.jpg             # 友達アイコン1
    friend_002.jpg             # 友達アイコン2
    photo_001.jpg              # フォトギャラリー1
    photo_002.jpg              # フォトギャラリー2

  /facelook_test_hanako/       # 別のユーザーページ
    profile.jpg
    cover.jpg
    ...

```

Storage URLの形式：
- `gs://[project-id].appspot.com/pages/facelook_test_taro/profile.jpg`
- `gs://[project-id].appspot.com/pages/facelook_test_taro/post_001.jpg`

## 実装の流れ

1. **Firestoreにデータを追加**
   - `search_results` コレクションにドキュメントを作成
   - 上記の統一された構造に従ってデータを入力

2. **BrowserAppで検索結果とマッピング(TODO, firestoreから動的にもってきて検索できるようにする)**
   - documentIdをpageComponentsに追加
   - 例: `<FacelookProfilePage documentId="facelook_test_taro" />`

3. **ページコンポーネントでデータ取得**
   - documentIdを使用してFirestoreからデータを取得
   - templateフィールドで適切なコンポーネントを判定
   - contentフィールドからページ固有のデータを展開

## Playback Machine機能

### 概要
Playback Machineは、アーカイブされたウェブページを閲覧できるウェブアプリケーションです。
ドメインが失効したサイトや、過去のスナップショットを表示できます。
実際のWayback Machineのようなインターフェースを提供し、ブラウザ内で動作します。

### 動作仕様

1. **BrowserAppでの表示**
   - `domainStatus: "active"` → 通常表示
   - `domainStatus: "expired"` → 検索結果に表示されない、URLを直接入力した場合は通常のエラーページ表示

2. **検索機能**
   - `domainStatus: "expired"` のサイトは検索結果から除外される
   - キーワード「playback」「archive」「アーカイブ」等でPlayback Machineが検索結果に表示される

3. **Playback Machineでの表示**
   - すべてのページを表示可能（domainStatusに関係なく）
   - 各ページの`archivedDate`を使用してアーカイブ日を表示

4. **URL形式**
   - Playback Machineホーム: `https://playback.archive/`
   - アーカイブページ: `https://playback.archive/web/20240315/https://facelook.com/test.taro`
   - 日付形式: YYYYMMDD（archivedDateフィールドから変換）
   - 日付部分は`archivedDate`フィールドから取得

### OSINTゲームでの活用シナリオ

1. **調査の流れ**
   - プレイヤーがブラウザで人物やサイトを検索
   - 一部のサイトは`domainStatus: "expired"`で検索結果に表示されない
   - 調査を進める中で、Playback Machineの存在に気づく
   - Playback Machineを使用して、失効したドメインのアーカイブページにアクセス
   - 隠された情報を発見し、調査を完了する

2. **実装のポイント**
   - 現実的なブラウザ体験を提供（expired = 検索できない、エラーページ表示）
   - Playback Machineは別途検索して発見する必要がある
   - アーカイブされた日付によって、異なる情報が見られる可能性（将来の拡張）

## 2. SNSアプリケーション

### データ構造概要

SNSアプリケーションでは、以下のような階層構造でデータを管理します：

```
users/
  {userId}/
    socialAccounts/
      {accountId}/
        posts/
          {postId}
    socialTimeline/
      {postId}
    socialContacts/
      {contactId}/
        history/
          {messageId}

socialNPCs/
  {npcId}/
    posts/
      {postId}
    config/
      errorMessages

socialNPCPosts/
  {postId}

defaultSocialAccountSettings/
  {settingId}
```

### コレクション詳細

#### 1. ユーザーアカウント (`users/{userId}/socialAccounts/{stableId}`)

各ユーザーは最大3つのソーシャルアカウントを持てます。

**デュアルIDシステム**：
- `id` (stable_id): UUID形式の内部識別子（不変、投稿やフォロー関係で使用）
- `account_id`: ユーザーが変更可能な表示用ID（検索や表示で使用）

```typescript
interface SocialAccount {
  id: string;                    // stable_id: UUID形式の内部識別子（不変）
  account_id: string;            // 表示用ID（ユーザーが変更可能、重複チェック有り）
  name: string;                  // 表示名
  avatar: string;                // アバター文字（A-Z）
  bio: string;                   // 自己紹介
  location: string;              // 所在地
  company?: string;              // 会社名
  position?: string;             // 役職
  education?: string;            // 学歴
  birthday?: string;             // 誕生日（YYYY-MM-DD）
  isActive: boolean;             // アクティブアカウントフラグ
  createdAt: Date;               // 作成日時
  updatedAt: Date;               // 更新日時
  followersCount: number;        // フォロワー数
  followingCount: number;        // フォロー数
  canDM: boolean;                // DM可能フラグ
}
```

#### 2. ユーザー投稿 (`users/{userId}/socialAccounts/{accountId}/posts/{postId}`)

各アカウントの投稿データです。

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
}
```

#### 3. ユーザータイムライン (`users/{userId}/socialTimeline/{postId}`)

ユーザー個別のタイムライン表示用投稿データです。自分の投稿とNPC投稿が混在します。

```typescript
interface TimelinePost extends SocialPost {
  // SocialPostと同じ構造
  // ユーザー投稿とNPC投稿の両方を含む
}
```

#### 4. NPC定義 (`socialNPCs/{stableId}`)

NPCキャラクターの基本情報です。

**デュアルIDシステム**：
- `id` (stable_id): UUID形式の内部識別子（不変、投稿やフォロー関係で使用）
- `account_id`: 表示・検索用ID（固定、NPCの場合は管理者が設定）

```typescript
interface SocialNPC {
  id: string;                    // stable_id: UUID形式の内部識別子（不変）
  account_id: string;            // 表示・検索用ID（固定）
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
}
```

#### 5. NPC投稿 (`socialNPCs/{stableId}/posts/{postId}`)

NPCの個別投稿データです。

```typescript
interface NPCPost extends SocialPost {
  // SocialPostと同じ構造
  // authorType は常に 'npc'
  // authorId は NPC の stable_id を使用
}
```

#### 6. NPC統合投稿 (`socialNPCPosts/{postId}`)

すべてのNPC投稿を統合したコレクションです。タイムライン表示の効率化に使用されます。

```typescript
interface NPCCentralPost extends SocialPost {
  // SocialPostと同じ構造
  // すべてのNPC投稿のコピー
}
```

#### 7. DM連絡先 (`users/{userId}/socialContacts/{contactId}`)

ユーザーのDM連絡先情報です。

```typescript
interface SocialContact {
  id: string;                    // 連絡先ID（NPCのID）
  name: string;                  // 表示名
  type: 'npc' | 'default';       // 連絡先タイプ
}
```

#### 8. DMメッセージ (`users/{userId}/socialContacts/{contactId}/history/{messageId}`)

DM会話履歴です。

```typescript
interface SocialDMMessage {
  id: string;                    // メッセージID
  sender: 'user' | 'npc';        // 送信者タイプ
  text: string;                  // メッセージ内容
  timestamp: Date;               // 送信日時
}
```

#### 9. デフォルトアカウント設定 (`defaultSocialAccountSettings/{stableId}`)

新規ユーザー用のデフォルトアカウント設定です。

**デュアルIDシステム**：
- `id` (stable_id): UUID形式の内部識別子（テンプレート用）
- `account_id`: 新規ユーザーのデフォルト表示ID

```typescript
interface DefaultSocialAccountSetting extends SocialAccount {
  // SocialAccountと同じ構造（デュアルIDシステム含む）
  // 新規ユーザー登録時に使用される
}
```

### データフロー

#### タイムライン表示ロジック

1. **ローカルキャッシュ (socialStore) をチェック**
   - 十分な投稿があれば表示

2. **ユーザータイムライン (`users/{userId}/socialTimeline`) をチェック**
   - 不足分を取得してキャッシュに追加

3. **NPC統合投稿 (`socialNPCPosts`) をチェック**
   - さらに不足分を取得
   - ユーザータイムラインとキャッシュの両方に保存

#### 投稿作成フロー

**ユーザー投稿の場合:**
1. `users/{userId}/socialAccounts/{stableId}/posts/{postId}` に保存
2. `users/{userId}/socialTimeline/{postId}` にもコピー保存
3. `authorId` には stable_id を使用

**NPC投稿の場合:**
1. `socialNPCs/{stableId}/posts/{postId}` に保存
2. `socialNPCPosts/{postId}` にもコピー保存
3. `authorId` には NPC の stable_id を使用

### キャッシュ戦略

- **ローカルストレージ**: ユーザー別・アカウント別にキャッシュを分離
- **キャッシュ切り替え**: ユーザー切り替え時は新しいキャッシュセットを使用
- **有効期限**: 5分間の新鮮度チェック、24時間で期限切れ

### ページング仕様

- **投稿取得**: 15件ずつページング
- **メッセージ取得**: 20件ずつページング
- **カーソル**: 最後の投稿/メッセージのIDを使用


## メッセンジャー提出システム

### 概要
メッセンジャーアプリ内で `/submit` コマンドを実行すると、3つの質問が順次表示され、全問正解すると解説シーンに遷移、不正解の場合は失敗シーンに遷移するシステムです。

### コレクション: `messenger`

#### ドキュメント構造

```
messenger/
├── {npcType}/           # NPCタイプ（例: darkOrganization）
    └── config/          # 設定データサブコレクション
        ├── submissionQuestions    # 提出問題データ
        ├── submissionExplanation  # 解説データ
        ├── errorMessages         # エラーメッセージデータ
        ├── systemPrompts         # システムプロンプト
        └── introductionMessage   # イントロダクションメッセージ
```

#### submissionQuestions ドキュメント

```javascript
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

#### submissionExplanation ドキュメント

```javascript
{
  "text": "解説文をここに記述\n\n複数行にわたる解説が可能\n最終的に成功シーンで表示される"
}
```

#### errorMessages ドキュメント

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

```javascript
{
  "prompt": "あなたは「闇の組織」のエージェントです。プレイヤーに対して冷静かつ簡潔に応答してください。\n\nプレイヤーが質問をした場合は、以下のJSON形式で応答してください：\n{\n  \"responseText\": \"実際の返答内容\"\n}\n\n応答は必ずJSON形式で返してください。"
}
```

#### introductionMessage ドキュメント

```javascript
{
  "text": "こんにちは。私はダークオーガニゼーションのエージェントです。何かご用件がありますか？",
  "fallbackText": "メッセージを受信しました。"
}
```

### フロー

1. **提出開始**: `/submit` コマンド → `submissionQuestions` から質問を取得
2. **質問進行**: 順次質問を表示、回答を `gameStore.submissionState` に蓄積
3. **最終検証**: 全回答完了後、サーバーサイドで `validateSubmission` 実行
4. **結果処理**:
   - 全問正解 → `gamePhase: 'submission-explanation'`
   - 不正解 → `gamePhase: 'submission-failure'`

### データ型定義

```typescript
interface SubmissionQuestion {
  id: string;
  text: string;
  correctAnswer: string;
}

interface SubmissionResult {
  success: boolean;
  correctAnswers: number;
  totalQuestions: number;
  explanationText?: string;
}
```