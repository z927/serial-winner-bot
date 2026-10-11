import { cert, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import serviceAccount from "../res/serviceAccountFirebase.json";

export const timestamp = FieldValue.serverTimestamp();

initializeApp({
  credential: cert(serviceAccount),
});

export const db = getFirestore();

export const getCurrentTimestamp = (): Timestamp => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return Timestamp.fromDate(now);
};
