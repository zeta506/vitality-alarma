import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  QueryConstraint,
  setDoc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export function getUserCollection(userId: string, collectionName: string) {
  return collection(db, 'users', userId, collectionName);
}

export function getUserDoc(userId: string, collectionName: string, docId: string) {
  return doc(db, 'users', userId, collectionName, docId);
}

export async function addDocument<T extends Record<string, unknown>>(
  userId: string,
  collectionName: string,
  data: T
) {
  console.log(`[Firestore] addDocument to ${collectionName}:`, JSON.stringify(data, null, 2));
  try {
    const col = getUserCollection(userId, collectionName);
    const docRef = await addDoc(col, {
      ...data,
      createdAt: Timestamp.now(),
    });
    console.log(`[Firestore] addDocument SUCCESS: ${docRef.id}`);
    return docRef.id;
  } catch (err) {
    console.error(`[Firestore] addDocument FAILED on ${collectionName}:`, err);
    throw err;
  }
}

export async function updateDocument(
  userId: string,
  collectionName: string,
  docId: string,
  data: Record<string, unknown>
) {
  const docRef = getUserDoc(userId, collectionName, docId);
  await updateDoc(docRef, data);
}

export async function deleteDocument(
  userId: string,
  collectionName: string,
  docId: string
) {
  const docRef = getUserDoc(userId, collectionName, docId);
  await deleteDoc(docRef);
}

export async function setDocument<T extends Record<string, unknown>>(
  userId: string,
  collectionName: string,
  docId: string,
  data: T
) {
  const docRef = getUserDoc(userId, collectionName, docId);
  await setDoc(docRef, data, { merge: true });
}

export async function getDocument(
  userId: string,
  collectionName: string,
  docId: string
) {
  const docRef = getUserDoc(userId, collectionName, docId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() };
  }
  return null;
}

export function subscribeToCollection<T>(
  userId: string,
  collectionName: string,
  callback: (items: T[]) => void,
  ...constraints: QueryConstraint[]
) {
  const col = getUserCollection(userId, collectionName);
  const q = query(col, orderBy('createdAt', 'desc'), ...constraints);

  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
    callback(items);
  });
}
