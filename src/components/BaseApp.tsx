import React, { ReactNode } from 'react';
import { AppProps } from '@/types/app';

interface BaseAppProps extends AppProps {
  children: ReactNode;
  toolbar?: ReactNode;
  statusBar?: ReactNode;
}

export const BaseApp: React.FC<BaseAppProps> = ({
  children,
  toolbar,
  statusBar,
  isActive,
  windowId
}) => {
  return (
    <div className="h-full flex flex-col bg-white">
      {toolbar && (
        <div className="border-b border-gray-200 bg-gray-50">
          {toolbar}
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {children}
      </div>

      {statusBar && (
        <div className="border-t border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-600">
          {statusBar}
        </div>
      )}
    </div>
  );
};