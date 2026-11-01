import { db } from './config';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import { MonthlyBill } from '../types/dairy';

/**
 * Sync or upsert a monthly bill to Firestore
 */
export async function syncBillToFirestore(bill: MonthlyBill): Promise<boolean> {
  try {
    const billRef = doc(db, 'bills', bill.id);
    await setDoc(billRef, {
      ...bill,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    console.log('🔥 Bill synced to Firestore:', bill.id);
    return true;
  } catch (err) {
    console.warn('Could not sync bill to Firestore:', err);
    return false;
  }
}

/**
 * Update bill status or edits in Firestore in real-time
 */
export async function updateBillInFirestore(billId: string, updates: Partial<MonthlyBill>): Promise<boolean> {
  try {
    const billRef = doc(db, 'bills', billId);
    await updateDoc(billRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    console.log('🔥 Bill updated in Firestore:', billId);
    return true;
  } catch (err) {
    console.warn('Could not update bill in Firestore:', err);
    return false;
  }
}

/**
 * Real-time listener for a single bill by ID
 */
export function subscribeToBill(
  billId: string,
  onUpdate: (bill: MonthlyBill | null) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const billRef = doc(db, 'bills', billId);
    return onSnapshot(
      billRef,
      (snapshot) => {
        if (snapshot.exists()) {
          onUpdate(snapshot.data() as MonthlyBill);
        } else {
          onUpdate(null);
        }
      },
      (err) => {
        console.warn('Firestore bill subscribe error:', err);
        if (onError) onError(err);
      }
    );
  } catch (err: unknown) {
    console.warn('Failed to subscribe to bill in Firestore:', err);
    return () => {};
  }
}

/**
 * Real-time listener for all bills of a customer
 */
export function subscribeToCustomerBills(
  customerId: string,
  onUpdate: (bills: MonthlyBill[]) => void
): () => void {
  try {
    const billsCol = collection(db, 'bills');
    return onSnapshot(
      billsCol,
      (snapshot) => {
        const list: MonthlyBill[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as MonthlyBill;
          if (data.customerId === customerId) {
            list.push(data);
          }
        });
        list.sort((a, b) => (b.month || '').localeCompare(a.month || ''));
        onUpdate(list);
      },
      (err) => {
        console.warn('Firestore customer bills subscribe error:', err);
      }
    );
  } catch (err: unknown) {
    console.warn('Failed to subscribe to customer bills in Firestore:', err);
    return () => {};
  }
}
