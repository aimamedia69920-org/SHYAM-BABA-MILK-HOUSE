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
  where,
  orderBy
} from 'firebase/firestore';
import { DairyOrder, OrderStatus, DairyProduct } from '../types/dairy';

/**
 * Sync an order to Firestore
 */
export async function syncOrderToFirestore(order: DairyOrder): Promise<boolean> {
  try {
    const orderRef = doc(db, 'orders', order.id);
    await setDoc(orderRef, {
      ...order,
      pinCode: order.shippingAddress.pinCode,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    console.log('🔥 Order synced to Firestore:', order.id);
    return true;
  } catch (err) {
    console.warn('Could not sync order to Firestore (offline or rule restricted):', err);
    return false;
  }
}

/**
 * Update an order status in Firestore in real-time
 */
export async function updateOrderStatusInFirestore(orderId: string, status: OrderStatus): Promise<boolean> {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      orderStatus: status,
      updatedAt: new Date().toISOString(),
    });
    console.log('🔥 Order status updated in Firestore:', orderId, status);
    return true;
  } catch (err) {
    console.warn('Could not update order status in Firestore:', err);
    return false;
  }
}

/**
 * Real-time listener for a single order by ID
 */
export function subscribeToOrder(
  orderId: string,
  onUpdate: (order: DairyOrder | null) => void,
  onError?: (error: Error) => void
): () => void {
  try {
    const orderRef = doc(db, 'orders', orderId);
    return onSnapshot(
      orderRef,
      (snapshot) => {
        if (snapshot.exists()) {
          onUpdate(snapshot.data() as DairyOrder);
        } else {
          onUpdate(null);
        }
      },
      (err) => {
        console.warn('Firestore order subscribe error:', err);
        if (onError) onError(err);
      }
    );
  } catch (err: any) {
    console.warn('Failed to subscribe to Firestore order:', err);
    return () => {};
  }
}

/**
 * Real-time listener for all orders of a customer
 */
export function subscribeToCustomerOrders(
  customerId: string,
  mobile: string,
  onUpdate: (orders: DairyOrder[]) => void
): () => void {
  try {
    const ordersCol = collection(db, 'orders');
    // Listen to orders matching customerId or mobile
    return onSnapshot(
      ordersCol,
      (snapshot) => {
        const list: DairyOrder[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as DairyOrder;
          if (
            (customerId && data.customerId === customerId) ||
            (mobile && data.customerMobile === mobile) ||
            (mobile && data.shippingAddress?.mobile === mobile)
          ) {
            list.push(data);
          }
        });
        // Sort descending by placedAt
        list.sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
        onUpdate(list);
      },
      (err) => {
        console.warn('Firestore customer orders subscribe error:', err);
      }
    );
  } catch (err) {
    console.warn('Failed to subscribe to customer orders:', err);
    return () => {};
  }
}

/**
 * Sync product to Firestore catalog
 */
export async function syncProductToFirestore(product: DairyProduct): Promise<boolean> {
  try {
    const prodRef = doc(db, 'products', product.id);
    await setDoc(prodRef, {
      ...product,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn('Could not sync product to Firestore:', err);
    return false;
  }
}

/**
 * Delete product from Firestore catalog
 */
export async function deleteProductFromFirestore(productId: string): Promise<boolean> {
  try {
    const prodRef = doc(db, 'products', productId);
    await deleteDoc(prodRef);
    return true;
  } catch (err) {
    console.warn('Could not delete product from Firestore:', err);
    return false;
  }
}
