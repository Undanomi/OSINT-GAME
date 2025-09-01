/**
 * クライアントサイドメッセンジャー初期化サービス
 * デスクトップ表示後にイントロダクションメッセージを送信し、通知を行う
 */

import { getChatHistory, addMessage, ChatMessage } from '@/actions/messenger';
import { appNotifications } from '@/utils/notifications';
import { getIntroductionMessage } from '@/prompts/introductionMessages';

/**
 * メッセンジャーの初期化オプション
 */
export interface MessengerInitializationOptions {
  /** イントロダクションメッセージ送信までの遅延時間（ミリ秒、デフォルト: 3000） */
  delay?: number;
  /** 通知を送信するかどうか（デフォルト: true） */
  sendNotification?: boolean;
  /** 通知の表示時間（ミリ秒、デフォルト: 5000） */
  notificationDuration?: number;
}

/**
 * メッセンジャーのイントロダクション初期化を実行
 * クライアントサイドで実行され、Server Actions経由でデータを保存、通知もクライアントサイドで行う
 * 
 * @param options 初期化オプション
 * @returns Promise<boolean> 初期化が実行されたかどうか（既に初期化済みの場合はfalse）
 */
export async function initializeMessengerIntroduction(
  options: MessengerInitializationOptions = {}
): Promise<boolean> {
  const {
    delay = 3000,
    sendNotification = true,
    notificationDuration = 5000
  } = options;

  try {
    // 既存のチャット履歴を確認
    const history = await getChatHistory();
    
    // 既にメッセージがある場合は何もしない
    if (history && history.messages.length > 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Messenger already initialized');
      }
      return false;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Initializing messenger with introduction message, delay:', delay);
    }

    // 指定された遅延時間後にイントロダクションメッセージを送信
    setTimeout(async () => {
      try {
        await sendIntroductionMessage(sendNotification, notificationDuration);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to send introduction message:', error);
        }
      }
    }, delay);

    return true;

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Messenger initialization failed:', error);
    }
    throw error;
  }
}

/**
 * イントロダクションメッセージを送信する内部関数
 * 
 * @param sendNotification 通知を送信するかどうか
 * @param notificationDuration 通知の表示時間
 */
async function sendIntroductionMessage(
  sendNotification: boolean = true,
  notificationDuration: number = 5000
): Promise<void> {
  try {
    // イントロダクションメッセージを取得
    const { text: introText } = getIntroductionMessage('darkOrganization');
    
    // イントロダクションメッセージを作成
    const introMessage: ChatMessage = {
      id: `intro-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
      sender: 'npc',
      text: introText,
      timestamp: new Date()
    };

    // Server Action経由でFirestoreに保存
    await addMessage(introMessage);

    if (process.env.NODE_ENV === 'development') {
      console.log('Introduction message saved to Firestore:', introMessage.id);
    }

    // クライアントサイドで通知を送信
    if (sendNotification) {
      const previewText = introText.length > 50 
        ? introText.substring(0, 50) + '...' 
        : introText;
        
      appNotifications.fromApp(
        'messenger',
        '闇の組織からの新着メッセージ',
        previewText,
        'info',
        notificationDuration
      );

      if (process.env.NODE_ENV === 'development') {
        console.log('Introduction notification sent');
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Messenger introduction completed successfully');
    }

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in sendIntroductionMessage:', error);
    }
    throw error;
  }
}

/**
 * メッセンジャーが既に初期化済みかどうかを確認
 * 
 * @returns Promise<boolean> 初期化済みの場合はtrue
 */
export async function isMessengerInitialized(): Promise<boolean> {
  try {
    const history = await getChatHistory();
    return history ? history.messages.length > 0 : false;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error checking messenger initialization status:', error);
    }
    return false;
  }
}