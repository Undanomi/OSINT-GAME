import React, { useState, useMemo } from 'react';
import { BaseApp } from '@/components/BaseApp';
import { AppProps } from '@/types/app';
import { useAppStore, AppMetadata } from '@/store/appStore';
import { Search, Download, Trash2, Star, Package, Filter } from 'lucide-react';

/**
 * アプリストアアプリケーション - アプリの検索、インストール、管理機能を提供
 * 利用可能なアプリの一覧表示、カテゴリ別フィルター、検索機能、インストール・アンインストール機能を実装
 * タブベースのUI（利用可能/インストール済み）でアプリ管理を効率化
 * 
 * @param windowId - アプリケーションウィンドウの一意識別子
 * @param isActive - アプリケーションがアクティブかどうかのフラグ
 * @returns JSX.Element - アプリストアアプリケーションのレンダリング結果
 */
export const AppStoreApp: React.FC<AppProps> = ({ windowId, isActive }) => {
  // アプリストアの状態管理とメソッドをuseAppStoreフックから取得
  const { 
    installedApps,      // インストール済みアプリ一覧
    availableApps,      // 利用可能なアプリ一覧
    installApp,         // アプリインストール関数
    uninstallApp,       // アプリアンインストール関数
    searchApps,         // アプリ検索関数
    getAppsByCategory   // カテゴリ別アプリ取得関数
  } = useAppStore();

  // 検索クエリの状態管理
  const [searchQuery, setSearchQuery] = useState('');
  // 選択されたカテゴリフィルターの状態管理
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  // アクティブなタブ（利用可能/インストール済み）の状態管理
  const [activeTab, setActiveTab] = useState<'available' | 'installed'>('available');

  /**
   * アプリケーションカテゴリの定義
   * フィルター機能で使用される各カテゴリの表示名と識別子
   */
  const categories = [
    { id: 'all', name: 'すべて' },
    { id: 'productivity', name: '生産性' },
    { id: 'communication', name: 'コミュニケーション' },
    { id: 'entertainment', name: 'エンターテインメント' },
    { id: 'utility', name: 'ユーティリティ' },
    { id: 'system', name: 'システム' }
  ];

  /**
   * フィルター済みアプリ一覧の計算
   * アクティブタブ、検索クエリ、カテゴリフィルターを組み合わせて表示するアプリをフィルタリング
   * useMemoで依存関係が変更された時のみ再計算を行いパフォーマンスを最適化
   */
  const filteredApps = useMemo(() => {
    // 現在のタブに応じてベースとなるアプリリストを決定
    let apps = activeTab === 'available' ? availableApps : installedApps;
    
    // 検索クエリが入力されている場合、検索結果を適用
    if (searchQuery) {
      apps = searchApps(searchQuery).filter(app => 
        activeTab === 'available' ? !app.isInstalled : app.isInstalled
      );
    }
    
    // カテゴリフィルターが「すべて」以外の場合、カテゴリでフィルタリング
    if (selectedCategory !== 'all') {
      apps = apps.filter(app => app.category === selectedCategory);
    }
    
    return apps;
  }, [availableApps, installedApps, searchQuery, selectedCategory, activeTab, searchApps]);

  /**
   * アプリインストール処理
   * 指定されたアプリをインストールし、ストアの状態を更新
   * 
   * @param app - インストールするアプリのメタデータ
   */
  const handleInstall = (app: AppMetadata) => {
    installApp(app);
  };

  /**
   * アプリアンインストール処理
   * システムアプリでない場合のみアンインストールを実行
   * システムアプリは削除不可の制約を適用
   * 
   * @param appId - アンインストールするアプリのID
   */
  const handleUninstall = (appId: string) => {
    const app = installedApps.find(a => a.id === appId);
    if (app && !app.isSystem) {
      uninstallApp(appId);
    }
  };

  /**
   * ツールバーコンポーネントの定義
   * タブ切り替え、検索機能、カテゴリフィルターを含むUI要素
   * アプリストアの主要な操作インターフェースを提供
   */
  const toolbar = (
    <div className="p-4 space-y-3">
      {/* タブ切り替えセクション（利用可能/インストール済み） */}
      <div className="flex space-x-4">
        {/* 利用可能アプリタブ */}
        <button
          onClick={() => setActiveTab('available')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'available'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          利用可能 ({availableApps.length})
        </button>
        
        {/* インストール済みアプリタブ */}
        <button
          onClick={() => setActiveTab('installed')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'installed'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          インストール済み ({installedApps.length})
        </button>
      </div>

      {/* 検索とフィルター機能セクション */}
      <div className="flex space-x-3">
        {/* アプリ検索入力フィールド */}
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="アプリを検索..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* カテゴリフィルタードロップダウン */}
        <div className="relative">
          <Filter size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none"
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  // ステータスバーに表示する情報（フィルター結果の件数）
  const statusBar = `${filteredApps.length}個のアプリが見つかりました`;

  return (
    <BaseApp windowId={windowId} isActive={isActive} toolbar={toolbar} statusBar={statusBar}>
      <div className="h-full overflow-auto bg-gray-50">
        {filteredApps.length === 0 ? (
          // アプリが見つからない場合の空状態表示
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Package size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                アプリが見つかりません
              </h3>
              <p className="text-gray-600">
                {searchQuery ? '検索条件' : 'フィルター条件'}を変更してもう一度お試しください
              </p>
            </div>
          </div>
        ) : (
          // フィルター結果のアプリ一覧表示
          <div className="p-4">
            <div className="grid grid-cols-1 gap-4">
              {filteredApps.map((app) => (
                // 各アプリの詳細カード
                <div
                  key={app.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start space-x-4">
                    {/* アプリアイコン表示エリア */}
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <app.icon size={32} className="text-gray-600" />
                    </div>
                    
                    {/* アプリ詳細情報エリア */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        {/* アプリ基本情報 */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">
                            {app.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-1">
                            v{app.version} • {app.author}
                          </p>
                          
                          {/* カテゴリとシステムアプリ表示 */}
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                              {categories.find(c => c.id === app.category)?.name || app.category}
                            </span>
                            {app.isSystem && (
                              <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                                システム
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* アクションボタンと統計情報エリア */}
                        <div className="flex items-center space-x-2 ml-4">
                          {/* インストール済みタブの場合は使用統計を表示 */}
                          {activeTab === 'installed' && (
                            <div className="text-xs text-gray-500 text-right">
                              <div>使用回数: {app.usageCount}</div>
                              {app.lastUsed && (
                                <div>最後の使用: {app.lastUsed.toLocaleDateString()}</div>
                              )}
                            </div>
                          )}
                          
                          {/* タブに応じてインストール・削除ボタンを表示 */}
                          {activeTab === 'available' ? (
                            // インストールボタン（利用可能タブ用）
                            <button
                              onClick={() => handleInstall(app)}
                              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                              <Download size={16} />
                              <span>インストール</span>
                            </button>
                          ) : (
                            // 削除ボタン（インストール済みタブ用、システムアプリ以外のみ）
                            !app.isSystem && (
                              <button
                                onClick={() => handleUninstall(app.id)}
                                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                              >
                                <Trash2 size={16} />
                                <span>削除</span>
                              </button>
                            )
                          )}
                        </div>
                      </div>
                      
                      {/* アプリの説明文 */}
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {app.description}
                      </p>
                      
                      {/* キーワードタグ表示（キーワードが存在する場合のみ） */}
                      {app.keywords.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {app.keywords.map((keyword, index) => (
                            <span
                              key={index}
                              className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </BaseApp>
  );
};