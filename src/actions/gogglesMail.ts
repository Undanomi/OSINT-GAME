'use server'

import { getAdminFirestore } from '@/lib/auth/firebase-admin';
import { EmailData } from '@/types/email';
import { ensureAuth } from '@/lib/auth/server';

/**
 * goggles_mailデータをFirebaseから取得
 * @returns Promise<EmailData[]>
 */
export const getGogglesMail = ensureAuth(async (): Promise<EmailData[]> => {
  const db = getAdminFirestore();
  try {
    const collectionRef = db.collection('goggles_mail');
    const querySnapshot = await collectionRef.get();

    const allEmails: EmailData[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data() as EmailData;
      allEmails.push(data);
    });

    return allEmails;
  } catch(error) {
    console.error('Error fetching all Goggles Mail data:', error);
    throw new Error('Failed to fetch all mail data from Firebase');
  }
});