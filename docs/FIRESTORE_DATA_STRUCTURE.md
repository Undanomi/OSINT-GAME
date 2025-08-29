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

### LinkedInProfilePage（今後実装時）

```typescript
interface LinkedInContent {
  name: string;
  headline: string;
  location: string;
  summary: string;
  profileImage: string;
  experience: Array<{
    title: string;
    company: string;
    period?: string;
    description?: string;
  }>;
  education: Array<{
    school: string;
    degree?: string;
    field?: string;
    period?: string;
  }>;
  skills: string[];
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
   - `content` (map): 上記の構造に従ってデータを入力
   - `keywords` (array): 検索用キーワードを配列で入力

## セキュリティルール

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // search_resultsコレクションは読み取り専用
    match /search_results/{document} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

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
  
  /linkedin_test_user/         # LinkedInページ（将来実装時）
    profile.jpg
    company_logo.jpg
    ...
```

Storage URLの形式：
- `gs://[project-id].appspot.com/pages/facelook_test_taro/profile.jpg`
- `gs://[project-id].appspot.com/pages/facelook_test_taro/post_001.jpg`

**メリット：**
- 各ページの画像が1つのフォルダにまとまる
- ページ削除時にフォルダごと削除できる
- ドキュメントIDと対応していて管理しやすい
- 異なるテンプレート間で画像が混在しない

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

## メリット

- **統一された検索実装**: すべてのページが同じ構造なので検索が簡単
- **拡張性**: 新しいテンプレートの追加が容易
- **メンテナンス性**: データ構造が明確で管理しやすい
- **パフォーマンス**: 単一コレクションからの取得で効率的
- **シンプルさ**: 1ページ完結型なのでID管理が不要