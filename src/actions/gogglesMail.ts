'use server'

import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { EmailData } from '@/types/email';

/**
 * goggles_mailデータをFirebaseから取得
 * @returns Promise<EmailData[]>
 */
export async function getGogglesMail(): Promise<EmailData[]> {
  try {
    const collectionRef = collection(db, 'goggles_mail');
    const querySnapshot = await getDocs(collectionRef);

    const allEmails: EmailData[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data() as EmailData;
      allEmails.push(data);
    });

    return allEmails;
  } catch (error) {
    console.error('Error fetching all Goggles Mail data:', error);
    throw new Error('Failed to fetch all mail data from Firebase');
  }
}