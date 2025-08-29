'use server'

import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { UnifiedSearchResult } from '@/types/search';

/**
 * Firebaseのsearch_resultsコレクションからデータを取得するServer Action
 */
export const getFirebaseDocuments = async (): Promise<UnifiedSearchResult[]> => {
	const searchResultsRef = collection(db, 'search_results');
	const querySnapshot = await getDocs(searchResultsRef);
	const firebaseResults: UnifiedSearchResult[] = [];
	querySnapshot.forEach((doc) => {
		const data = doc.data() as UnifiedSearchResult;
		firebaseResults.push({
			...data,
			id: doc.id,
		});
	});
	return firebaseResults;
};
