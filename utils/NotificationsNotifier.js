// utils/firebaseNotifier.js
import { db } from '../Firebase/FirebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const sendNotification = async ({ recipientId, title, message, type, productId }) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      recipientId,
      title,
      message,
      type, // e.g. 'order', 'delivery', 'inventory'
      productId: productId || null,
      createdAt: serverTimestamp(),
      seen: false,
    });
  } catch (err) {
    console.error('Failed to send notification:', err.message);
  }
};