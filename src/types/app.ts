import { ReactNode } from 'react';

export interface AppProps {
  windowId: string;
  isActive: boolean;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
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