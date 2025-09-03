'use client';

import { getContacts, addMessage, addContact } from '@/actions/messenger';
import { defaultMessengerContacts } from '@/types/messenger';
import { appNotifications } from '@/utils/notifications';
import { getIntroductionMessage } from '@/prompts/introductionMessages';
import type { ChatMessage } from '@/types/messenger';

async function initializeUserContacts(): Promise<void> {
  try {
    for (const contact of defaultMessengerContacts) {
      const { id, ...contactData } = contact;
      await addContact(contactData, id);
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error initializing user contacts:', error);
    }
    throw error;
  }
}

async function sendIntroductionMessage(): Promise<void> {
  try {
    const { text: introText } = getIntroductionMessage('darkOrganization');
    const contactId = 'dark_organization';

    const introMessage: ChatMessage = {
      id: `intro-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      sender: 'npc',
      text: introText,
      timestamp: new Date(),
    };

    await addMessage(contactId, introMessage);

    const previewText = introText.length > 50 ? `${introText.substring(0, 50)}...` : introText;
    appNotifications.fromApp(
      'messenger',
      '闇の組織からの新着メッセージ',
      previewText,
      'info',
      5000
    );
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in sendIntroductionMessage:', error);
    }
    throw error;
  }
}

export async function initializeMessengerIntroduction(): Promise<boolean> {
  try {
    const contacts = await getContacts();
    if (contacts.length > 0) {
      return false; // 既に初期化済み
    }

    // 1. デフォルト連絡先をDBに追加
    await initializeUserContacts();

    // 2. 少し遅れてからイントロメッセージを送信
    setTimeout(sendIntroductionMessage, 2000);

    return true;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Messenger initialization failed:', error);
    }
    return false;
  }
}