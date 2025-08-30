import { Globe, MessageCircle, Users, Settings, Package, Calculator, StickyNote } from 'lucide-react';
import { AppMetadata } from '@/store/appStore';

export const systemApps: AppMetadata[] = [
  {
    id: 'browser',
    name: 'ブラウザ',
    version: '1.0.0',
    description: 'インターネット検索とウェブページ閲覧を行うブラウザアプリケーション',
    category: 'productivity',
    keywords: ['インターネット', 'ウェブ', '検索', 'ブラウジング'],
    author: 'System',
    icon: Globe,
    defaultWidth: 900,
    defaultHeight: 700,
    minWidth: 400,
    minHeight: 300,
    isInstalled: true,
    isSystem: true,
    installDate: new Date('2024-01-01'),
    usageCount: 0
  },
  {
    id: 'social',
    name: 'SNS',
    version: '1.0.0',
    description: 'ソーシャルメディアプラットフォーム。ユーザーの投稿やプロフィールを確認できます',
    category: 'communication',
    keywords: ['SNS', 'ソーシャル', '投稿', 'プロフィール'],
    author: 'System',
    icon: Users,
    defaultWidth: 600,
    defaultHeight: 800,
    minWidth: 350,
    minHeight: 400,
    isInstalled: true,
    isSystem: true,
    installDate: new Date('2024-01-01'),
    usageCount: 0
  },
  {
    id: 'messenger',
    name: 'メッセージ',
    version: '1.0.0',
    description: 'リアルタイムメッセージングアプリケーション。チャット機能と自動応答システム',
    category: 'communication',
    keywords: ['チャット', 'メッセージ', 'コミュニケーション'],
    author: 'System',
    icon: MessageCircle,
    defaultWidth: 600,
    defaultHeight: 600,
    minWidth: 400,
    minHeight: 400,
    isInstalled: true,
    isSystem: true,
    installDate: new Date('2024-01-01'),
    usageCount: 0
  },
  {
    id: 'app-store',
    name: 'アプリストア',
    version: '1.0.0',
    description: '新しいアプリケーションの検索、インストール、管理を行います',
    category: 'system',
    keywords: ['アプリ', 'インストール', 'ストア'],
    author: 'System',
    icon: Package,
    defaultWidth: 800,
    defaultHeight: 600,
    minWidth: 600,
    minHeight: 400,
    isInstalled: true,
    isSystem: true,
    installDate: new Date('2024-01-01'),
    usageCount: 0
  }
];

export const availableApps: AppMetadata[] = [
  {
    id: 'calculator',
    name: '電卓',
    version: '1.0.0',
    description: '基本的な数学計算を行う電卓アプリケーション',
    category: 'utility',
    keywords: ['計算', '電卓', '数学'],
    author: 'Third Party',
    icon: Calculator,
    defaultWidth: 300,
    defaultHeight: 450,
    minWidth: 280,
    minHeight: 380,
    isInstalled: false,
    usageCount: 0
  },
  {
    id: 'notes',
    name: 'メモ',
    version: '1.0.0',
    description: 'メモの作成、編集、検索ができるシンプルなメモアプリケーション',
    category: 'productivity',
    keywords: ['メモ', 'ノート', '記録', 'テキスト'],
    author: 'System',
    icon: StickyNote,
    defaultWidth: 700,
    defaultHeight: 500,
    minWidth: 500,
    minHeight: 400,
    isInstalled: false,
    usageCount: 0
  },
  {
    id: 'settings',
    name: '設定',
    version: '1.0.0',
    description: 'システム設定とアプリケーション設定を管理します',
    category: 'system',
    keywords: ['設定', 'システム', '管理'],
    author: 'System',
    icon: Settings,
    defaultWidth: 700,
    defaultHeight: 500,
    minWidth: 500,
    minHeight: 400,
    isInstalled: false,
    usageCount: 0
  }
];

export const initializeAppRegistry = () => {
  return {
    installedApps: systemApps,
    availableApps: availableApps
  };
};