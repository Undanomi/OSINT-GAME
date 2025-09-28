import admin from "firebase-admin";
import { onDocumentDeleted } from "firebase-functions/v2/firestore";
import { setGlobalOptions } from "firebase-functions/v2";

admin.initializeApp();
const db = admin.firestore();

setGlobalOptions({
  region: "asia-northeast1",
  memory: "1GiB",
  timeoutSeconds: 540,
});

/**
 * 指定されたクエリに一致するドキュメントとその全サブコレクションを再帰的に削除する
 */
async function deleteQueryBatch(
  query: FirebaseFirestore.Query,
  resolve: () => void
): Promise<void> {
  const snapshot = await query.get();
  if (snapshot.size === 0) {
    resolve();
    return;
  }
  const batch = db.batch();
  const deletePromises: Promise<void>[] = [];
  for (const doc of snapshot.docs) {
    deletePromises.push(deleteSubcollections(doc.ref));
    batch.delete(doc.ref);
  }
  await Promise.all(deletePromises);
  await batch.commit();
  process.nextTick(() => {
    deleteQueryBatch(query, resolve);
  });
}

/**
 * 指定されたドキュメント参照配下の全サブコレクションを削除する
 */
async function deleteSubcollections(
  docRef: FirebaseFirestore.DocumentReference
) {
  const subcollections = await docRef.listCollections();
  const deletePromises: Promise<void>[] = [];
  for (const subcollection of subcollections) {
    const promise = new Promise<void>((resolve, reject) => {
      const query = subcollection.orderBy("__name__").limit(500);
      deleteQueryBatch(query, resolve).catch(reject);
    });
    deletePromises.push(promise);
  }
  await Promise.all(deletePromises);
}

//--- Cloud Function 本体 ---//
export const cleanupSubcollections = onDocumentDeleted(
  {
    document: "users/{docId}",
  },
  async (event) => {
    if (!event.data) {
      console.error("No data associated with the event. Exiting function.");
      return;
    }
    const docRef = event.data.ref;
    console.log(`Starting recursive delete for: ${docRef.path}`);
    await deleteSubcollections(docRef);
    console.log(`Finished recursive delete for: ${docRef.path}`);
  }
);