
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// This check ensures we don't accidentally initialize the app more than once.
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Recursively copies a document and all of its subcollections within a batch.
 * @param sourceRef The source document reference.
 * @param destRef The destination document reference.
 * @param batch The Firestore write batch.
 */
async function recursiveCopy(
  sourceRef: admin.firestore.DocumentReference,
  destRef: admin.firestore.DocumentReference,
  batch: admin.firestore.WriteBatch
): Promise<void> {
  const docSnap = await sourceRef.get();
  if (docSnap.exists) {
    batch.set(destRef, docSnap.data()!);

    const collections = await sourceRef.listCollections();
    for (const collection of collections) {
      const docs = await collection.get();
      for (const doc of docs.docs) {
        // Important: Await the recursive call for each sub-document
        await recursiveCopy(doc.ref, destRef.collection(collection.id).doc(doc.id), batch);
      }
    }
  }
}

/**
 * Recursively deletes a document and all of its subcollections within a batch.
 * @param docRef The document reference to delete.
 * @param batch The Firestore write batch.
 */
async function recursiveDelete(
  docRef: admin.firestore.DocumentReference,
  batch: admin.firestore.WriteBatch
): Promise<void> {
  const collections = await docRef.listCollections();
  for (const collection of collections) {
    const docs = await collection.get();
    for (const doc of docs.docs) {
      // Important: Await the recursive call for each sub-document
      await recursiveDelete(doc.ref, batch);
    }
  }
  batch.delete(docRef);
}

/**
 * A callable function to move a card and its subcollections from one group to another.
 */
export const moveCard = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  // 1. **Security:** Authentication is now required.
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated to move cards."
    );
  }

  const { sourceGroupId, destGroupId, cardId, userId, entityId } = data;

  // 2. **Validation:** Ensure all required data is present.
  if (!sourceGroupId || !destGroupId || !cardId || !userId || !entityId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required data: sourceGroupId, destGroupId, cardId, userId, or entityId."
    );
  }

  functions.logger.info(`Request to move card ${cardId} from group ${sourceGroupId} to ${destGroupId} by user ${context.auth.uid}.`);

  const tenantPath = `users/${userId}/entities/${entityId}`;
  const sourceCardRef = db.collection(tenantPath + "/kanban-groups").doc(sourceGroupId).collection("cards").doc(cardId);
  const destCardRef = db.collection(tenantPath + "/kanban-groups").doc(destGroupId).collection("cards").doc(cardId);

  try {
    const batch = db.batch();

    // 3. **Execution:** Copy, then delete, within a single atomic batch.
    await recursiveCopy(sourceCardRef, destCardRef, batch);
    await recursiveDelete(sourceCardRef, batch);

    // 4. **Commit:** Execute all operations at once.
    await batch.commit();

    functions.logger.info(`Successfully moved card ${cardId}.`);
    return { success: true, message: "Card moved successfully." };
  } catch (error: any) {
    functions.logger.error(`Error moving card ${cardId}:`, error);
    throw new functions.https.HttpsError(
      "internal",
      "An error occurred while moving the card.",
      error.message
    );
  }
});
