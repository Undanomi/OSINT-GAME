# Firestore データ構造ガイド

## 統一されたデータ構造

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