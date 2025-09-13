'use client';

import React, { useState, useEffect } from 'react';
import { useGogglesMailAuthStore } from '@/store/gogglesAuthStore';
import { GogglesMailLoginPage } from './GogglesMailLoginPage';
import { GogglesMailPasswordEmailPage } from './GogglesMailPasswordEmailPage';
import { GogglesMailPasswordMethodPage } from './GogglesMailPasswordMethodPage';
import { GogglesMailPasswordSMSPage } from './GogglesMailPasswordSMSPage';
import { GogglesMailPasswordQuestionsPage } from './GogglesMailPasswordQuestionsPage';
import { GogglesMailPasswordResetPage } from './GogglesMailPasswordResetPage';
import { GogglesMailServicePage } from './GogglesMailServicePage';


const MAIL_URLS = {
  LOGIN: 'https://mail.goggles.com/login',
  MAIL_SERVICE: 'https://mail.goggles.com',
} as const;

interface GogglesMailProps {
  initialUrl: string;
}

type MailPhase = 
  | 'login'
  | 'forgot-email'
  | 'forgot-method'
  | 'forgot-sms'
  | 'forgot-questions'
  | 'password-reset'
  | 'mail-service';

// 各ページコンポーネントの共通プロパティ
export interface MailPageProps {
  onPhaseNavigate: (phase: MailPhase) => void;
}

export const GogglesMail: React.FC<GogglesMailProps> = ({ initialUrl }) => {
  const { isGogglesMailLoggedIn } = useGogglesMailAuthStore();
  const [mailPhase, setMailPhase] = useState<MailPhase>('login');

  // URL -> フェーズ
  const getPhaseFromUrl = (url: string): MailPhase => {
    const urlToPhaseMap: Record<string, MailPhase> = {
      [MAIL_URLS.LOGIN]: 'login',
      [MAIL_URLS.MAIL_SERVICE]: 'mail-service',
    };
    
    return urlToPhaseMap[url] || 'login';
  };

  // 初期フェーズの設定
  useEffect(() => {
    let targetPhase: MailPhase;
    
    if (initialUrl) {
      const urlPhase = getPhaseFromUrl(initialUrl);
      if (urlPhase === 'mail-service' && !isGogglesMailLoggedIn) {
        // 未ログインならメール画面に遷移しない
        targetPhase = 'login';
      } else {
        targetPhase = urlPhase;
      }
    } else if (isGogglesMailLoggedIn) {
      // ログイン済みならメール画面に遷移
      targetPhase = 'mail-service';
    } else {
      targetPhase = 'login';
    }
    
    setMailPhase(targetPhase);
  }, [initialUrl, isGogglesMailLoggedIn]);

  // フェーズの変更処理
  const handlePhaseNavigate = (phase: MailPhase) => {
    setMailPhase(phase);
  };

  // フェーズに応じて適切なコンポーネントを表示
  switch (mailPhase) {
    case 'login':
      return <GogglesMailLoginPage onPhaseNavigate={handlePhaseNavigate} />;

    case 'forgot-email':
      return <GogglesMailPasswordEmailPage onPhaseNavigate={handlePhaseNavigate} />;

    case 'forgot-method':
      return <GogglesMailPasswordMethodPage onPhaseNavigate={handlePhaseNavigate} />;

    case 'forgot-sms':
      return <GogglesMailPasswordSMSPage onPhaseNavigate={handlePhaseNavigate} />;

    case 'forgot-questions':
      return <GogglesMailPasswordQuestionsPage onPhaseNavigate={handlePhaseNavigate} />;

    case 'password-reset':
      return <GogglesMailPasswordResetPage onPhaseNavigate={handlePhaseNavigate} />;

    case 'mail-service':
      if (!isGogglesMailLoggedIn) {
        // 未ログインならログインページを表示する
        setMailPhase('login');
        return <GogglesMailLoginPage onPhaseNavigate={handlePhaseNavigate} />;
      }
      return <GogglesMailServicePage/>;

    default:
      return <GogglesMailLoginPage onPhaseNavigate={handlePhaseNavigate} />;
  }
};