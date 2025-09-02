'use server';

import { db } from '@/lib/firebase';
import {
  doc,
  setDoc,
  getDocs,
  collection,
  query,
  orderBy,
} from 'firebase/firestore';
import { requireAuth } from '@/lib/auth/server';
import type { MessengerContactDocument } from '@/types/messenger';

/**
 * ユーザーの全てのメッセンジャー連絡先を取得する
 */
export const getMessengerContacts = requireAuth(async (userId: string): Promise<MessengerContactDocument[]> => {
  try {
    const contactsRef = collection(db, 'users', userId, 'messenger_contacts');
    const q = query(contactsRef, orderBy('name', 'asc'));

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return [];
    }

    const contacts: MessengerContactDocument[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();

      if (!data || typeof data !== 'object') {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Invalid messenger contact document: ${doc.id}`);
        }
        return;
      }

      const contact: MessengerContactDocument = {
        id: doc.id,
        name: data.name || '',
        type: data.type || 'default'
      };

      contacts.push(contact);
    });

    return contacts;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching messenger contacts:', error);
    }
    throw new Error('メッセンジャー連絡先の取得に失敗しました');
  }
});

/**
 * ユーザーにメッセンジャー連絡先を追加する
 */
export const addMessengerContact = requireAuth(async (userId: string, contact: MessengerContactDocument): Promise<void> => {
  try {
    if (!contact || typeof contact !== 'object') {
      if (process.env.NODE_ENV === 'development') {
        console.error('Invalid messenger contact object provided to addMessengerContact');
      }
      throw new Error('無効なメッセンジャー連絡先データです');
    }

    const contactRef = doc(db, 'users', userId, 'messenger_contacts', contact.id);

    await setDoc(contactRef, {
      name: contact.name || '',
      type: contact.type || 'default'
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error adding messenger contact:', error);
    }

    if (error instanceof Error && error.message.includes('無効なメッセンジャー連絡先データです')) {
      throw error;
    }

    throw new Error('メッセンジャー連絡先の追加に失敗しました');
  }
});