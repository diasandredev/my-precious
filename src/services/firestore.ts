import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc,
    writeBatch,
    DocumentData,
    WithFieldValue
} from "firebase/firestore";
import { db } from "../lib/firebase";

export const addDocument = async (collectionName: string, data: WithFieldValue<DocumentData>) => {
    try {
        const docRef = await addDoc(collection(db, collectionName), data);
        return docRef.id;
    } catch (error) {
        console.error(`Error adding document to ${collectionName}:`, error);
        throw error;
    }
};

export const updateDocument = async (collectionName: string, id: string, data: WithFieldValue<DocumentData>) => {
    try {
        const docRef = doc(db, collectionName, id);
        await updateDoc(docRef, data);
    } catch (error) {
        console.error(`Error updating document ${id} in ${collectionName}:`, error);
        throw error;
    }
};

export const deleteDocument = async (collectionName: string, id: string) => {
    try {
        const docRef = doc(db, collectionName, id);
        await deleteDoc(docRef);
    } catch (error) {
        console.error(`Error deleting document ${id} from ${collectionName}:`, error);
        throw error;
    }
};

export const getCollection = async (collectionName: string) => {
    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error(`Error getting collection ${collectionName}:`, error);
        throw error;
    }
};

export const getDocument = async (collectionName: string, id: string) => {
    try {
        const docRef = doc(db, collectionName, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            return null;
        }
    } catch (error) {
        console.error(`Error getting document ${id} from ${collectionName}:`, error);
        throw error;
    }
};

// Batch Support
export type BatchAction =
    | { type: 'create'; collection: string; data: WithFieldValue<DocumentData> }
    | { type: 'update'; collection: string; id: string; data: WithFieldValue<DocumentData> }
    | { type: 'delete'; collection: string; id: string };

export const executeBatch = async (actions: BatchAction[]) => {
    if (actions.length === 0) return;

    const batch = writeBatch(db);

    actions.forEach(action => {
        if (action.type === 'create') {
            // IDEMPOTENCY FIX: Use existing ID from data if available, otherwise auto-gen
            const data = action.data as any;
            const docId = data.id;

            if (docId) {
                const docRef = doc(db, action.collection, docId);
                batch.set(docRef, action.data);
            } else {
                // Fallback only if no ID provided (unlikely in our app)
                const docRef = doc(collection(db, action.collection));
                batch.set(docRef, action.data);
            }
        } else if (action.type === 'update') {
            const docRef = doc(db, action.collection, action.id);
            batch.update(docRef, action.data);
        } else if (action.type === 'delete') {
            const docRef = doc(db, action.collection, action.id);
            batch.delete(docRef);
        }
    });

    try {
        await batch.commit();
        console.log(`Successfully executed batch of ${actions.length} actions.`);
    } catch (error) {
        console.error("Error executing batch:", error);
        throw error;
    }
};
