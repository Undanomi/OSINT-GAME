// import { ReactNode } from 'react'; // 現在未使用のためコメントアウト

export interface AppProps {
  windowId: string;
  isActive: boolean;
  onClose?: () => void;
  onMinimize?: () => void;
}

export interface AppMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  category: 'productivity' | 'communication' | 'entertainment' | 'utility';
  keywords: string[];
}

export interface AppComponent {
  metadata: AppMetadata;
  component: React.ComponentType<AppProps>;
}