import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export type OrderStatus = 'pending' | 'accepted' | 'rejected' | 'cooking' | 'ready' | 'served' | 'cancelled';

export interface MenuItem {
  id: string;
  name: string;
  category: 'veg' | 'non-veg' | 'extra';
  subCategory?: 'starter' | 'main_course';
  price: number;
  isCookingRequired: boolean;
  image?: string;
  description?: string;
}

export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface Order {
  id: string;
  tableNumber: number;
  items: OrderItem[];
  status: OrderStatus;
  timestamp: Date;
}

export interface TableBill {
  tableNumber: number;
  items: OrderItem[];
  total: number;
  status: 'active' | 'paid';
}

interface RestaurantContextType {
  orders: Order[];
  tables: TableBill[];
  menuItems: MenuItem[];
  placeOrder: (tableNumber: number, items: OrderItem[]) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  acceptOrder: (orderId: string) => void;
  rejectOrder: (orderId: string) => void;
  addItemsToTable: (tableNumber: number, items: OrderItem[]) => void;
  generateBill: (tableNumber: number) => void;
  resetTable: (tableNumber: number) => void;
  cancelOrder: (orderId: string) => void;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

// Sample menu items
const MENU_ITEMS: MenuItem[] = [
  { id: '1', name: 'Paneer Tikka', category: 'veg', subCategory: 'starter', price: 280, isCookingRequired: true, image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&h=500&fit=crop', description: 'Grilled chunks of paneer marinated in spiced yogurt.' },
  { id: '2', name: 'Veg Thali', category: 'veg', subCategory: 'main_course', price: 350, isCookingRequired: true, image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&h=500&fit=crop', description: 'Includes: Paneer Sabzi, Dal Tadka, 3 Roti, Jeera Rice, Papad, Salad & Buttermilk.' },
  { id: '3', name: 'Dal Makhani', category: 'veg', subCategory: 'main_course', price: 220, isCookingRequired: true, image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&h=500&fit=crop', description: 'Creamy and buttery black lentils slow-cooked to perfection.' },
  { id: '4', name: 'Palak Paneer', category: 'veg', subCategory: 'main_course', price: 240, isCookingRequired: true, image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&h=500&fit=crop', description: 'Fresh spinach puree simmered with paneer cubes and mild spices.' },
  { id: '5', name: 'Veg Biryani', category: 'veg', subCategory: 'main_course', price: 280, isCookingRequired: true, image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&h=500&fit=crop', description: 'Aromatic basmati rice cooked with mixed vegetables and rich spices.' },
  { id: '6', name: 'Butter Roti', category: 'veg', subCategory: 'main_course', price: 30, isCookingRequired: false, image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&h=500&fit=crop', description: 'Soft whole wheat flatbread brushed with butter.' },
  { id: '7', name: 'Jeera Rice', category: 'veg', subCategory: 'main_course', price: 150, isCookingRequired: false, image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&h=500&fit=crop', description: 'Basmati rice cooked with cumin seeds and mild flavorings.' },
  { id: '8', name: 'Water Bottle', category: 'extra', price: 20, isCookingRequired: false, image: 'https://images.unsplash.com/photo-1623366302587-bcaad5451cb5?w=500&h=500&fit=crop' },
  { id: '9', name: 'Chicken Tikka', category: 'non-veg', subCategory: 'starter', price: 350, isCookingRequired: true, image: 'https://images.unsplash.com/photo-1565557612117-e2a2202bfe83?w=500&h=500&fit=crop', description: 'Juicy, charred chicken pieces marinated in tandoori spices.' },
  { id: '10', name: 'Chicken Thali', category: 'non-veg', subCategory: 'main_course', price: 400, isCookingRequired: true, image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&h=500&fit=crop', description: 'Includes: Chicken Curry, Sukka Chicken, 3 Bhakri/Roti, Rice, Sol Kadhi & Salad.' },
  { id: '11', name: 'Butter Chicken', category: 'non-veg', subCategory: 'main_course', price: 380, isCookingRequired: true, image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=500&h=500&fit=crop', description: 'Tender chicken simmered in a rich tomato-butter gravy.' },
  { id: '12', name: 'Chicken Biryani', category: 'non-veg', subCategory: 'main_course', price: 350, isCookingRequired: true, image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&h=500&fit=crop', description: 'Classic spiced rice layered with marinated chicken chunks.' },
  { id: '13', name: 'Mutton Curry', category: 'non-veg', subCategory: 'main_course', price: 450, isCookingRequired: true, image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&h=500&fit=crop', description: 'Slow-cooked mutton pieces in a robust, flavorful gravy.' },
  { id: '14', name: 'Fish Fry', category: 'non-veg', subCategory: 'starter', price: 320, isCookingRequired: true, image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=500&h=500&fit=crop', description: 'Crispy pan-fried fish seasoned with coastal spices.' },
  { id: '15', name: 'Prawn Curry', category: 'non-veg', subCategory: 'main_course', price: 420, isCookingRequired: true, image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=500&h=500&fit=crop', description: 'Fresh prawns cooked in a coconut-based curry.' },
  { id: '16', name: 'Beverages', category: 'extra', price: 50, isCookingRequired: false, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&h=500&fit=crop' },
  { id: '18', name: 'Gulab Jamun', category: 'extra', price: 80, isCookingRequired: false, image: 'https://images.unsplash.com/photo-1601050690117-94f5f6af8be2?w=500&h=500&fit=crop', description: 'Classic sweet milk-solid dumplings soaked in rosy syrup.' },
  { id: '19', name: 'Ice Cream', category: 'extra', price: 60, isCookingRequired: false, image: 'https://images.unsplash.com/photo-1563805042-7684c8a9e9ce?w=500&h=500&fit=crop' },
  { id: '20', name: 'Brownie with Ice Cream', category: 'extra', price: 150, isCookingRequired: false, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&h=500&fit=crop' },
];

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<TableBill[]>([]);

  // ── Firestore real-time listeners ──────────────────────────────────────────
  useEffect(() => {
    // Listen to orders from Firestore (real-time across all devices)
    const unsubOrders = onSnapshot(doc(db, 'restaurant', 'orders'), (snap) => {
      if (snap.exists()) {
        const raw: any[] = snap.data().list || [];
        const parsed: Order[] = raw.map(o => ({
          ...o,
          timestamp: o.timestamp ? new Date(o.timestamp) : new Date(),
        }));
        setOrders(prev => {
          const prevJson = JSON.stringify(prev);
          const newJson = JSON.stringify(parsed);
          return prevJson !== newJson ? parsed : prev;
        });
      } else {
        setOrders([]);
      }
    });

    // Listen to tables from Firestore (real-time across all devices)
    const unsubTables = onSnapshot(doc(db, 'restaurant', 'tables'), (snap) => {
      if (snap.exists()) {
        const parsed: TableBill[] = snap.data().list || [];
        setTables(prev => {
          const prevJson = JSON.stringify(prev);
          const newJson = JSON.stringify(parsed);
          return prevJson !== newJson ? parsed : prev;
        });
      } else {
        setTables([]);
      }
    });

    return () => {
      unsubOrders();
      unsubTables();
    };
  }, []);

  // ── Firestore save helpers ──────────────────────────────────────────────────
  const saveOrders = useCallback(async (updatedOrders: Order[]) => {
    const serializable = updatedOrders.map(o => ({
      ...o,
      timestamp: o.timestamp instanceof Date ? o.timestamp.toISOString() : o.timestamp,
    }));
    await setDoc(doc(db, 'restaurant', 'orders'), { list: serializable });
  }, []);

  const saveTables = useCallback(async (updatedTables: TableBill[]) => {
    await setDoc(doc(db, 'restaurant', 'tables'), { list: updatedTables });
  }, []);

  const placeOrder = (tableNumber: number, items: OrderItem[]) => {
    const newOrder: Order = {
      id: `order-${Date.now()}`,
      tableNumber,
      items,
      status: 'pending',
      timestamp: new Date(),
    };
    const updated = [...orders, newOrder];
    setOrders(updated);
    saveOrders(updated);
    playNotificationSound();
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    const updated = orders.map(order =>
      order.id === orderId ? { ...order, status } : order
    );
    setOrders(updated);
    saveOrders(updated);
  };

  const acceptOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || order.status !== 'pending') return;

    const hasCookingItems = order.items.some(item => item.menuItem.isCookingRequired);
    const nextStatus: OrderStatus = hasCookingItems ? 'accepted' : 'ready';

    // Update order status
    const updatedOrders = orders.map(o =>
      o.id === orderId ? { ...o, status: nextStatus } : o
    );
    setOrders(updatedOrders);
    saveOrders(updatedOrders);

    // Add items to table bill
    const existingTable = tables.find(t => t.tableNumber === order.tableNumber && t.status === 'active');
    let updatedTables: TableBill[];
    if (existingTable) {
      const updatedItems = [...existingTable.items];
      order.items.forEach(newItem => {
        const idx = updatedItems.findIndex(i => i.menuItem.id === newItem.menuItem.id);
        if (idx >= 0) updatedItems[idx].quantity += newItem.quantity;
        else updatedItems.push(newItem);
      });
      const total = updatedItems.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0);
      updatedTables = tables.map(t =>
        t.tableNumber === order.tableNumber && t.status === 'active'
          ? { ...t, items: updatedItems, total }
          : t
      );
    } else {
      const total = order.items.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0);
      updatedTables = [...tables, { tableNumber: order.tableNumber, items: order.items, total, status: 'active' }];
    }
    setTables(updatedTables);
    saveTables(updatedTables);
  };

  const rejectOrder = (orderId: string) => {
    updateOrderStatus(orderId, 'rejected');
  };

  const cancelOrder = (orderId: string) => {
    updateOrderStatus(orderId, 'cancelled');
  };

  const addItemsToTable = (tableNumber: number, newItems: OrderItem[]) => {
    const existingTable = tables.find(t => t.tableNumber === tableNumber && t.status === 'active');
    let updatedTables: TableBill[];
    if (existingTable) {
      const updatedItems = [...existingTable.items];
      newItems.forEach(newItem => {
        const idx = updatedItems.findIndex(i => i.menuItem.id === newItem.menuItem.id);
        if (idx >= 0) updatedItems[idx].quantity += newItem.quantity;
        else updatedItems.push(newItem);
      });
      const total = updatedItems.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0);
      updatedTables = tables.map(t =>
        t.tableNumber === tableNumber && t.status === 'active'
          ? { ...t, items: updatedItems, total }
          : t
      );
    } else {
      const total = newItems.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0);
      updatedTables = [...tables, { tableNumber, items: newItems, total, status: 'active' }];
    }
    setTables(updatedTables);
    saveTables(updatedTables);
  };

  const generateBill = (tableNumber: number) => {
    const updatedTables = tables.map(t =>
      t.tableNumber === tableNumber && t.status === 'active'
        ? { ...t, status: 'paid' as const }
        : t
    );
    setTables(updatedTables);
    saveTables(updatedTables);
  };

  const resetTable = (tableNumber: number) => {
    const updatedTables = tables.filter(t => t.tableNumber !== tableNumber);
    setTables(updatedTables);
    saveTables(updatedTables);
    // Keep order history as-is in Firestore for sales tracking
  };

  const playNotificationSound = () => {
    // Create audio context for notification
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  return (
    <RestaurantContext.Provider
      value={{
        orders,
        tables,
        menuItems: MENU_ITEMS,
        placeOrder,
        updateOrderStatus,
        acceptOrder,
        rejectOrder,
        addItemsToTable,
        generateBill,
        resetTable,
        cancelOrder,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within RestaurantProvider');
  }
  return context;
}
