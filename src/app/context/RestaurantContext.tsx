import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ref, set, onValue, off } from 'firebase/database';
import { db } from '../firebase';

export type OrderStatus = 'pending' | 'accepted' | 'rejected' | 'cooking' | 'ready' | 'served' | 'cancelled';

export interface MenuItem {
  id: string;
  name: string;
  category: 'veg' | 'non-veg' | 'extra';
  subCategory?: 'starter' | 'main_course';
  halfPrice: number;
  fullPrice: number;
  isCookingRequired: boolean;
  image?: string;
  description?: string;
}

export type PortionSize = 'half' | 'full';

export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  portionSize: PortionSize;
}

export interface Order {
  id: string;
  tableNumber: number;
  items: OrderItem[];
  status: OrderStatus;
  timestamp: Date;
  isParcel?: boolean;
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
  placeOrder: (tableNumber: number, items: OrderItem[], isParcel?: boolean) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  acceptOrder: (orderId: string) => void;
  rejectOrder: (orderId: string) => void;
  addItemsToTable: (tableNumber: number, items: OrderItem[]) => void;
  generateBill: (tableNumber: number) => void;
  resetTable: (tableNumber: number) => void;
  cancelOrder: (orderId: string) => void;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

// Sample menu items from Pawan's Chinese Fast Food Center
const MENU_ITEMS: MenuItem[] = [
  // Veg Soups
  { id: '1', name: 'Veg Sweet Corn Soup', category: 'veg', halfPrice: 100, fullPrice: 100, isCookingRequired: true },
  { id: '2', name: 'Veg Tomato Soup', category: 'veg', halfPrice: 45, fullPrice: 90, isCookingRequired: true },
  { id: '3', name: 'Veg Noodles Soup', category: 'veg', halfPrice: 45, fullPrice: 90, isCookingRequired: true },
  { id: '4', name: 'Veg Manchaaw Soup', category: 'veg', halfPrice: 45, fullPrice: 90, isCookingRequired: true },
  { id: '5', name: 'Veg Royal Soup', category: 'veg', halfPrice: 45, fullPrice: 90, isCookingRequired: true },
  { id: '6', name: 'Veg Clear Soup', category: 'veg', halfPrice: 45, fullPrice: 90, isCookingRequired: true },
  { id: '7', name: 'Veg Mushroom Soup', category: 'veg', halfPrice: 100, fullPrice: 100, isCookingRequired: true },
  { id: '8', name: 'Veg Manchurian Soup', category: 'veg', halfPrice: 45, fullPrice: 90, isCookingRequired: true },
  { id: '9', name: 'Veg Hot N Sour Soup', category: 'veg', halfPrice: 45, fullPrice: 90, isCookingRequired: true },
  
  // Veg Noodles
  { id: '10', name: 'Veg Hakka Noodles', category: 'veg', halfPrice: 65, fullPrice: 130, isCookingRequired: true },
  { id: '11', name: 'Veg Singapur Noodles', category: 'veg', halfPrice: 75, fullPrice: 150, isCookingRequired: true },
  { id: '12', name: 'Veg Triple Noodles', category: 'veg', halfPrice: 85, fullPrice: 170, isCookingRequired: true },
  { id: '13', name: 'Veg Hongkong Noodles', category: 'veg', halfPrice: 75, fullPrice: 150, isCookingRequired: true },
  { id: '14', name: 'Veg Sezwan Noodles', category: 'veg', halfPrice: 70, fullPrice: 140, isCookingRequired: true },
  { id: '15', name: 'Veg Manchuriyan Noodles', category: 'veg', halfPrice: 85, fullPrice: 170, isCookingRequired: true },
  { id: '16', name: 'Veg Pannir Noodles', category: 'veg', halfPrice: 75, fullPrice: 150, isCookingRequired: true },
  { id: '17', name: 'Veg Chaoumin Noodles', category: 'veg', halfPrice: 65, fullPrice: 130, isCookingRequired: true },
  { id: '18', name: 'Veg Chilli Noodles', category: 'veg', halfPrice: 65, fullPrice: 130, isCookingRequired: true },
  { id: '19', name: 'Veg Mashroom Noodles', category: 'veg', halfPrice: 75, fullPrice: 150, isCookingRequired: true },
  { id: '20', name: 'Veg Garlic Noodles', category: 'veg', halfPrice: 65, fullPrice: 130, isCookingRequired: true },
  { id: '21', name: 'Veg Krisspi Noodles', category: 'veg', halfPrice: 65, fullPrice: 130, isCookingRequired: true },
  { id: '22', name: 'Veg Chilli Garlic Noodles', category: 'veg', halfPrice: 65, fullPrice: 130, isCookingRequired: true },
  
  // Veg Rice
  { id: '23', name: 'Veg Fried Rice', category: 'veg', halfPrice: 65, fullPrice: 130, isCookingRequired: true },
  { id: '24', name: 'Veg Singapur Rice', category: 'veg', halfPrice: 75, fullPrice: 150, isCookingRequired: true },
  { id: '25', name: 'Veg Hongkong Rice', category: 'veg', halfPrice: 75, fullPrice: 150, isCookingRequired: true },
  { id: '26', name: 'Veg Manchuriyan Rice', category: 'veg', halfPrice: 85, fullPrice: 170, isCookingRequired: true },
  { id: '27', name: 'Veg Triple Rice', category: 'veg', halfPrice: 85, fullPrice: 170, isCookingRequired: true },
  { id: '28', name: 'Veg Jinjar Rice', category: 'veg', halfPrice: 65, fullPrice: 130, isCookingRequired: true },
  { id: '29', name: 'Veg Mushroom Fried Rice', category: 'veg', halfPrice: 75, fullPrice: 150, isCookingRequired: true },
  { id: '30', name: 'Veg Pannir Fried Rice', category: 'veg', halfPrice: 75, fullPrice: 150, isCookingRequired: true },
  { id: '31', name: 'Veg Garlic Rice', category: 'veg', halfPrice: 65, fullPrice: 130, isCookingRequired: true },
  { id: '32', name: 'Veg Sezwan Rice', category: 'veg', halfPrice: 70, fullPrice: 140, isCookingRequired: true },
  { id: '33', name: 'Veg Combination Rice', category: 'veg', halfPrice: 65, fullPrice: 130, isCookingRequired: true },
  { id: '34', name: 'Veg Jira Fried Rice', category: 'veg', halfPrice: 65, fullPrice: 130, isCookingRequired: true },
  { id: '35', name: 'Veg Thaouzand Rice', category: 'veg', halfPrice: 190, fullPrice: 190, isCookingRequired: true },
  { id: '36', name: 'Veg Krisspi Rice', category: 'veg', halfPrice: 65, fullPrice: 130, isCookingRequired: true },
  { id: '37', name: 'Veg Maleshiya Ric', category: 'veg', halfPrice: 190, fullPrice: 190, isCookingRequired: true },
  
  // Veg Chopsi
  { id: '38', name: 'Veg American Chopsi', category: 'veg', halfPrice: 80, fullPrice: 160, isCookingRequired: true },
  { id: '39', name: 'Veg Chinese Chopsi', category: 'veg', halfPrice: 80, fullPrice: 160, isCookingRequired: true },
  { id: '40', name: 'Veg Sezwan Chopsi', category: 'veg', halfPrice: 80, fullPrice: 160, isCookingRequired: true },
  { id: '41', name: 'Veg Chilli Chopsi', category: 'veg', halfPrice: 80, fullPrice: 160, isCookingRequired: true },
  { id: '42', name: 'Veg Manchuriyan Chopsi', category: 'veg', halfPrice: 80, fullPrice: 160, isCookingRequired: true },
  { id: '43', name: 'Veg Hongkong Chopsi', category: 'veg', halfPrice: 80, fullPrice: 160, isCookingRequired: true },
  { id: '44', name: 'Veg Chinese Bhel', category: 'veg', halfPrice: 80, fullPrice: 160, isCookingRequired: true },
  
  // Veg Dry
  { id: '45', name: 'Veg Manchurian', category: 'veg', halfPrice: 65, fullPrice: 130, isCookingRequired: true },
  { id: '46', name: 'Veg Garlic', category: 'veg', halfPrice: 65, fullPrice: 130, isCookingRequired: true },
  { id: '47', name: 'Veg Jinjar', category: 'veg', halfPrice: 65, fullPrice: 130, isCookingRequired: true },
  { id: '48', name: 'Veg Hakka Chilli', category: 'veg', halfPrice: 65, fullPrice: 130, isCookingRequired: true },
  { id: '49', name: 'Veg Krispi Chilli', category: 'veg', halfPrice: 65, fullPrice: 130, isCookingRequired: true },
  { id: '50', name: 'Veg Chilli', category: 'veg', halfPrice: 65, fullPrice: 130, isCookingRequired: true },
  { id: '51', name: 'Veg Lollipop', category: 'veg', halfPrice: 140, fullPrice: 140, isCookingRequired: true },
  { id: '52', name: 'Veg Gobi Manchurian', category: 'veg', halfPrice: 65, fullPrice: 130, isCookingRequired: true },
  { id: '53', name: 'Veg Mushroom Chilli', category: 'veg', halfPrice: 150, fullPrice: 150, isCookingRequired: true },
  { id: '54', name: 'Veg Paneer Manchurian', category: 'veg', halfPrice: 150, fullPrice: 150, isCookingRequired: true },
  { id: '55', name: 'Veg Mushroom Manchurian', category: 'veg', halfPrice: 150, fullPrice: 150, isCookingRequired: true },
  { id: '56', name: 'Veg Paneer Chilli', category: 'veg', halfPrice: 150, fullPrice: 150, isCookingRequired: true },
  { id: '57', name: 'Veg Paneer Garlic', category: 'veg', halfPrice: 150, fullPrice: 150, isCookingRequired: true },
  { id: '58', name: 'Veg Mushroom Garlic', category: 'veg', halfPrice: 150, fullPrice: 150, isCookingRequired: true },
  { id: '59', name: 'Veg Combo', category: 'veg', halfPrice: 160, fullPrice: 160, isCookingRequired: true },
  
  // Non-Veg Soups
  { id: '60', name: 'Chicken Sweet Corn Soup', category: 'non-veg', halfPrice: 100, fullPrice: 100, isCookingRequired: true },
  { id: '61', name: 'Chicken Union Soup', category: 'non-veg', halfPrice: 50, fullPrice: 90, isCookingRequired: true },
  { id: '62', name: 'Chicken Noodles Soup', category: 'non-veg', halfPrice: 50, fullPrice: 90, isCookingRequired: true },
  { id: '63', name: 'Chicken Manchaaw Soup', category: 'non-veg', halfPrice: 50, fullPrice: 90, isCookingRequired: true },
  { id: '64', name: 'Chicken Royal Soup', category: 'non-veg', halfPrice: 50, fullPrice: 90, isCookingRequired: true },
  { id: '65', name: 'Chicken Special Soup', category: 'non-veg', halfPrice: 50, fullPrice: 90, isCookingRequired: true },
  { id: '66', name: 'Chicken Mushroom Soup', category: 'non-veg', halfPrice: 100, fullPrice: 100, isCookingRequired: true },
  { id: '67', name: 'Chicken Clear Soup', category: 'non-veg', halfPrice: 50, fullPrice: 90, isCookingRequired: true },
  { id: '68', name: 'Chicken Hot N Sour Soup', category: 'non-veg', halfPrice: 50, fullPrice: 90, isCookingRequired: true },
  { id: '69', name: 'Chicken Manchurian Soup', category: 'non-veg', halfPrice: 50, fullPrice: 90, isCookingRequired: true },
  
  // Non-Veg Noodles
  { id: '70', name: 'Chicken Hakka Noodles', category: 'non-veg', halfPrice: 65, fullPrice: 130, isCookingRequired: true },
  { id: '71', name: 'Chicken Singapur Noodles', category: 'non-veg', halfPrice: 75, fullPrice: 150, isCookingRequired: true },
  { id: '72', name: 'Chicken Chilli Garlic Noodles', category: 'non-veg', halfPrice: 65, fullPrice: 130, isCookingRequired: true },
  { id: '73', name: 'Chicken Triple Noodles', category: 'non-veg', halfPrice: 90, fullPrice: 180, isCookingRequired: true },
  { id: '74', name: 'Chicken Hongkong Noodles', category: 'non-veg', halfPrice: 75, fullPrice: 150, isCookingRequired: true },
  { id: '75', name: 'Chicken Sezwan Noodles', category: 'non-veg', halfPrice: 70, fullPrice: 140, isCookingRequired: true },
  { id: '76', name: 'Chicken Manchurian Noodles', category: 'non-veg', halfPrice: 90, fullPrice: 180, isCookingRequired: true },
  { id: '77', name: 'Chicken Paneer Noodles', category: 'non-veg', halfPrice: 75, fullPrice: 150, isCookingRequired: true },
  { id: '78', name: 'Chicken Chaoumin Noodles', category: 'non-veg', halfPrice: 65, fullPrice: 130, isCookingRequired: true },
  { id: '79', name: 'Chicken Chilli Noodles', category: 'non-veg', halfPrice: 65, fullPrice: 130, isCookingRequired: true },
  { id: '80', name: 'Chicken Mushroom Noodles', category: 'non-veg', halfPrice: 75, fullPrice: 150, isCookingRequired: true },
  { id: '81', name: 'Chicken Garlic Noodles', category: 'non-veg', halfPrice: 65, fullPrice: 130, isCookingRequired: true },
  { id: '82', name: 'Chicken Krispi Noodles', category: 'non-veg', halfPrice: 65, fullPrice: 130, isCookingRequired: true },
  { id: '83', name: 'Chicken Chilli Garlic Noodles', category: 'non-veg', halfPrice: 65, fullPrice: 130, isCookingRequired: true },
  
  // Non-Veg Rice
  { id: '84', name: 'Chicken Fried Rice', category: 'non-veg', halfPrice: 65, fullPrice: 130, isCookingRequired: true },
  { id: '85', name: 'Chicken Singapur Rice', category: 'non-veg', halfPrice: 75, fullPrice: 150, isCookingRequired: true },
  { id: '86', name: 'Chicken Hongkong Rice', category: 'non-veg', halfPrice: 75, fullPrice: 150, isCookingRequired: true },
  { id: '87', name: 'Chicken Manchurian Rice', category: 'non-veg', halfPrice: 90, fullPrice: 180, isCookingRequired: true },
  { id: '88', name: 'Chicken Triple Rice', category: 'non-veg', halfPrice: 90, fullPrice: 180, isCookingRequired: true },
  { id: '89', name: 'Chicken Jinjar Rice', category: 'non-veg', halfPrice: 65, fullPrice: 130, isCookingRequired: true },
  { id: '90', name: 'Chicken Mushroom Fried Rice', category: 'non-veg', halfPrice: 75, fullPrice: 150, isCookingRequired: true },
  { id: '91', name: 'Chicken Paneer Fried Rice', category: 'non-veg', halfPrice: 75, fullPrice: 150, isCookingRequired: true },
  { id: '92', name: 'Chicken Garlic Rice', category: 'non-veg', halfPrice: 65, fullPrice: 130, isCookingRequired: true },
  { id: '93', name: 'Chicken Sezwan Rice', category: 'non-veg', halfPrice: 65, fullPrice: 130, isCookingRequired: true },
  { id: '94', name: 'Chicken Combination Rice', category: 'non-veg', halfPrice: 65, fullPrice: 130, isCookingRequired: true },
  { id: '95', name: 'Chicken Maleshiya Rice', category: 'non-veg', halfPrice: 220, fullPrice: 220, isCookingRequired: true },
  { id: '96', name: 'Chicken Thaouzand Rice', category: 'non-veg', halfPrice: 220, fullPrice: 220, isCookingRequired: true },
  { id: '97', name: 'Chicken Krispi Rice', category: 'non-veg', halfPrice: 65, fullPrice: 130, isCookingRequired: true },
  
  // Non-Veg Chopsi
  { id: '98', name: 'Chicken American Chopsi', category: 'non-veg', halfPrice: 80, fullPrice: 160, isCookingRequired: true },
  { id: '99', name: 'Chicken Chilli Chopsi', category: 'non-veg', halfPrice: 80, fullPrice: 160, isCookingRequired: true },
  { id: '100', name: 'Chicken Sezwan Chopsi', category: 'non-veg', halfPrice: 80, fullPrice: 160, isCookingRequired: true },
  { id: '101', name: 'Chicken Hongkong Chopsi', category: 'non-veg', halfPrice: 80, fullPrice: 160, isCookingRequired: true },
  { id: '102', name: 'Chicken Manchurian Chopsi', category: 'non-veg', halfPrice: 80, fullPrice: 160, isCookingRequired: true },
  { id: '103', name: 'Chicken Chineese Bhel', category: 'non-veg', halfPrice: 80, fullPrice: 160, isCookingRequired: true },
  
  // Extras
  { id: '104', name: 'Water Bottle', category: 'extra', halfPrice: 20, fullPrice: 20, isCookingRequired: false },
  { id: '105', name: 'Beverages', category: 'extra', halfPrice: 50, fullPrice: 50, isCookingRequired: false },
];

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<TableBill[]>([]);

  // ── Realtime Database real-time listeners ────────────────────────────────────
  useEffect(() => {
    // Listen to orders from Realtime Database
    const ordersRef = ref(db, 'restaurant/orders');
    const ordersListener = onValue(ordersRef, (snap) => {
      if (snap.exists()) {
        const raw: any[] = snap.val() || [];
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

    // Listen to tables from Realtime Database
    const tablesRef = ref(db, 'restaurant/tables');
    const tablesListener = onValue(tablesRef, (snap) => {
      if (snap.exists()) {
        const parsed: TableBill[] = snap.val() || [];
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
      off(ordersRef);
      off(tablesRef);
    };
  }, []);

  // ── Realtime Database save helpers ──────────────────────────────────────────────
  const saveOrders = useCallback(async (updatedOrders: Order[]) => {
    const serializable = updatedOrders.map(o => ({
      ...o,
      timestamp: o.timestamp instanceof Date ? o.timestamp.toISOString() : o.timestamp,
    }));
    await set(ref(db, 'restaurant/orders'), serializable);
  }, []);

  const saveTables = useCallback(async (updatedTables: TableBill[]) => {
    await set(ref(db, 'restaurant/tables'), updatedTables);
  }, []);

  const placeOrder = (tableNumber: number, items: OrderItem[], isParcel: boolean = false) => {
    const newOrder: Order = {
      id: `order-${Date.now()}`,
      tableNumber,
      items,
      status: 'pending',
      timestamp: new Date(),
      isParcel,
    };
    const updated = [...orders, newOrder];
    setOrders(updated);
    saveOrders(updated);

    // Set table to active status immediately when order is placed
    const existingTable = tables.find(t => t.tableNumber === tableNumber);
    let updatedTables: TableBill[];
    if (existingTable) {
      if (existingTable.status !== 'active') {
        updatedTables = tables.map(t =>
          t.tableNumber === tableNumber ? { ...t, status: 'active' } : t
        );
        setTables(updatedTables);
        saveTables(updatedTables);
      }
    } else {
      const total = items.reduce((sum, i) => sum + (i.portionSize === 'half' ? i.menuItem.halfPrice : i.menuItem.fullPrice) * i.quantity, 0);
      updatedTables = [...tables, { tableNumber, items, total, status: 'active' }];
      setTables(updatedTables);
      saveTables(updatedTables);
    }

    playNotificationSound();
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    const updated = orders.map(order =>
      order.id === orderId ? { ...order, status } : order
    );
    setOrders(updated);
    saveOrders(updated);
  };

  const rejectOrder = (orderId: string) => {
    updateOrderStatus(orderId, 'rejected');
  };

  const cancelOrder = (orderId: string) => {
    updateOrderStatus(orderId, 'cancelled');
  };

  const acceptOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || order.status !== 'pending') return;

    // Update order status to cooking
    const updatedOrders = orders.map(o =>
      o.id === orderId ? { ...o, status: 'cooking' as OrderStatus } : o
    );
    setOrders(updatedOrders);
    saveOrders(updatedOrders);

    // Set table to active status
    const existingTable = tables.find(t => t.tableNumber === order.tableNumber);
    let updatedTables: TableBill[];
    if (existingTable) {
      if (existingTable.status !== 'active') {
        updatedTables = tables.map(t =>
          t.tableNumber === order.tableNumber ? { ...t, status: 'active' } : t
        );
        setTables(updatedTables);
        saveTables(updatedTables);
      }
    } else {
      const total = order.items.reduce((sum, i) => sum + (i.portionSize === 'half' ? i.menuItem.halfPrice : i.menuItem.fullPrice) * i.quantity, 0);
      updatedTables = [...tables, { tableNumber: order.tableNumber, items: order.items, total, status: 'active' }];
      setTables(updatedTables);
      saveTables(updatedTables);
    }
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
      const total = updatedItems.reduce((sum, i) => sum + (i.portionSize === 'half' ? i.menuItem.halfPrice : i.menuItem.fullPrice) * i.quantity, 0);
      updatedTables = tables.map(t =>
        t.tableNumber === tableNumber && t.status === 'active'
          ? { ...t, items: updatedItems, total }
          : t
      );
    } else {
      const total = newItems.reduce((sum, i) => sum + (i.portionSize === 'half' ? i.menuItem.halfPrice : i.menuItem.fullPrice) * i.quantity, 0);
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
