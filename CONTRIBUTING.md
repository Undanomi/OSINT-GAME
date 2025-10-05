# プロジェクトへの貢献
このプロジェクトに興味を持っていただき、ありがとうございます！

コントリビューターの皆様を歓迎します。
バグ報告、機能提案、ドキュメントの改善、プルリクエストなど、あらゆる形の貢献がプロジェクトをより良くします。

このドキュメントは、貢献をスムーズに進めるためのガイドラインです。

## Issues
次のIssueを受けつけています。
- 使い方など本プロジェクトに関する質問
- エラーや問題の報告新しい機能などの提案

その他のIssueも歓迎しています。

## Pull Request
Pull Requestはいつでも歓迎しています。
次の種類のPull Requestを受け付けています。
### Issue立てずにPull Requestを送ってよいもの
- 誤字の修正
- 各ドキュメントの修正
### Issueを立てて相談が必要なもの
- バグ・不具合の修正
- 新しい機能の追加開発

## 開発を始める前に
コードの修正や機能追加を行う場合、以下の手順で開発環境をセットアップしてください。
### 開発環境を準備する
- Node.js (v11.6.1 以上を推奨)
- Git
- Firebaseプロジェクトとアプリ、サービスアカウントキー
- Google AI Studio で取得したGemini APIキー

#### Firebaseプロジェクトの作成
Firebaseコンソールからプロジェクトを作成します。

1. [Firebase Console](https://console.firebase.google.com/)にアクセスします
2. 「プロジェクトを追加」をクリックします
3. プロジェクト名を入力します
4. 「プロジェクトを作成」をクリックすると、数分でプロジェクトが準備されます

#### Firebaseアプリの作成
作成したプロジェクトにウェブアプリを追加します。

1. プロジェクトの設定ページ下部のアプリの追加をクリックし、ウェブアイコン (</>) をクリックします
2. アプリの管理をしやすくするためのニックネームを入力します
3. 「アプリを登録」をクリックします

表示されるJSONのapiKey、projectId、storageBucketは環境変数として利用するため記録しておきます。

#### Firebaseサービスアカウントの作成
1. プロジェクトの設定ページの「サービスアカウント」タブを選択します
2. 「新しい秘密鍵の生成」をクリックします

ダウンロードされたJSONファイルに記載されるclient_emailとprivate_keyは環境変数として利用するため記録しておきます。

#### Gemini APIキーの取得
1. [Google AI Studio](https://aistudio.google.com/app/apikey)にアクセスします
2. 「Get API key」をクリックします
3. APIキーを作成をクリックします
4. APIキーを保存するGoogle Cloudプロジェクトを選択します。
  - 新しいプロジェクトを作成する場合は「Create project」を選択すると、新しいプロジェクトが自動で作成され、その中にAPIキーが生成されます
  - 既存のプロジェクトを使用する場合はそれを選択してAPIキーを作成します
5. APIキーをコピーして保存します。

コピーしたAPIキーは環境変数として利用するため記録しておきます。

### FirestoreとStorageのデータ再現
アプリケーションを動作させるために必要なデータをFirebaseプロジェクトに登録します。
デモ環境を再現したい場合は、データを提供するためIssueにより連絡をお願いします。

#### Firestoreのデータ登録
FirestoreのAdmin SDKのセットアップ、データ構造、データ登録スクリプトの詳細はdocsディレクトリにある以下のガイドを参照してください。ガイドに従って、開発環境に必要なデータを登録してください。

[Firestore データ構造ガイド](./docs/FIRESTORE_DATA_STRUCTURE.md): 各コレクションの詳細なスキーマについて。

[Firestore データ自動登録ガイド](./docs/FIRESTORE_SEEDING.md): JSONファイルからFirestoreにデータを一括登録するスクリプトの実行方法について。

#### Firebase Storageのデータ登録
任意の形式でデータを登録した上で、そのパスをFirestoreに登録してください。


### リポジトリをフォークする
このリポジトリの右上にある "Fork" ボタンをクリックして、自分のアカウントにリポジトリをコピーします。

### ローカルにクローンする
フォークしたリポジトリを、ご自身のPCにクローンします。
```
git clone [https://github.com/YOUR_USERNAME/PROJECT_NAME.git](https://github.com/YOUR_USERNAME/PROJECT_NAME.git)
cd PROJECT_NAME
```

### パッケージをインストールする
プロジェクトルートで、以下のコマンドを実行します。
```
npm install
```
### 環境変数を設定する
`.env.local.sample`ファイルをコピーして`.env.local`という名前のファイルを作成します。
その後、ファイル内の各項目を自身のFirebaseプロジェクトとGemini APIキーの情報で埋めてください。
```
cp .env.sample .env.local
```
.env.local の内容例
```
# Gemini API Key
GEMINI_API_KEY=your-gemini-api-key-here

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com

FIREBASE_CLIENT_EMAIL=your-project@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
```

### 開発サーバーを起動する
以下のコマンドを実行し、ブラウザで http://localhost:3000 を開くと、開発中のアプリケーションが表示されます。
```
npm run dev
```
## 開発フロー
### 最新の状態に更新する
作業を始める前に、フォーク元のリポジトリの最新の変更を取り込みます。
```
# フォーク元を upstream としてリモートリポジトリに追加 (初回のみ)
git remote add upstream https://github.com/ORIGINAL_OWNER/PROJECT_NAME.git

# 最新の変更を取得
git fetch upstream
git checkout main
git merge upstream/main
```
### ブランチを作成する
mainブランチから、作業内容に合わせた名前のブランチを作成します。
```
# 新機能を追加する場合
git checkout -b feature/add-new-feature
# バグを修正する場合
git checkout -b fix/fix-login-bug
```

### コードを修正・追加する
エディタでコードを自由に変更してください。

### コミットする
変更内容をコミットします。
コミットメッセージは、変更内容が分かりやすいように記述してください。
Conventional Commits の形式を推奨します。

#### コミットメッセージの形式
`<type>: <subject>`

#### typeの種類
feat (新機能), fix (バグ修正), docs (ドキュメント), style (スタイル修正), refactor (リファクタリング), test (テスト追加・修正) など。

#### コミット方法
```
git add .
git commit -m "feat: ユーザープロフィール編集機能を追加"
```

### プッシュする
作成したブランチを、自身のリモートリポジトリ（フォーク）にプッシュします。
```
git push origin feature/add-new-feature
```
### プルリクエストを作成する
GitHub上で、フォークしたリポジトリからオリジナルのリポジトリへ向けてプルリクエストを作成します。
プルリクエストのテンプレートに従い、以下の情報を記述してください。
- 変更の目的: なぜこの変更が必要なのか。
- 変更内容の概要: 何をどのように変更したのか。
- 関連するIssue: Closes #123 のように、関連するIssue番号を記載。
- スクリーンショット: UIの変更が含まれる場合は、変更前後のスクリーンショットを添付。

## 最後に
貢献してくださるすべての方に感謝します。
あなたの協力が、このプロジェクトをより良いものにします。