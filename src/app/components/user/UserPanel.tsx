import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import {
  ArrowLeft, Search, ShoppingCart, Leaf, Drumstick,
  Plus, Minus, CheckCircle2, Clock, ChefHat,
  Utensils, Package, ClipboardList, Trash2, XCircle
} from 'lucide-react';
import { useRestaurant, MenuItem, OrderItem, Order } from '../context/RestaurantContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Subcomponents ──────────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 120
    }
  }
};

function MenuCard({ item, cart, updateQuantity, addToCart }: {
  item: MenuItem,
  cart: OrderItem[],
  updateQuantity: (id: string, delta: number) => void,
  addToCart: (item: MenuItem) => void
}) {
  const inCart = cart.find(i => i.menuItem.id === item.id);
  const isVeg = item.category === 'veg';

  return (
    <motion.div
      variants={itemVariants}
      layout
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className="bg-white rounded-none shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] border border-slate-100 flex flex-col overflow-hidden group transition-shadow duration-300"
    >
      {/* Compact Image Area */}
      <div className="relative h-32 overflow-hidden bg-slate-50 flex-shrink-0">
        {item.image ? (
          <motion.img
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.6 }}
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 text-slate-200">
            <Package className="w-10 h-10 stroke-[1]" />
          </div>
        )}

        {/* Minimalist Badge Overlay */}
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-md p-1 rounded-lg shadow-sm border border-white">
          <div className={`w-3 h-3 border-2 flex items-center justify-center ${isVeg ? 'border-emerald-500' : 'border-rose-500'}`}>
            <div className={`w-1 h-1 rounded-full ${isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          </div>
        </div>

        {!item.isCookingRequired && (
          <div className="absolute top-2 right-2 bg-emerald-500/90 text-white px-2 py-0.5 rounded-lg font-black uppercase flex items-center gap-1 text-[7px] shadow-sm tracking-widest">
            Quick
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col flex-1">
        <div className="flex-1 space-y-1 mb-3">
          <h3 className="font-semibold text-slate-900 text-base leading-tight tracking-tight line-clamp-2 uppercase">
            {item.name}
          </h3>
        </div>

        <div className="mt-auto flex items-center justify-between gap-1">
          <div className="text-[oklch(0.75_0.21_156.47)] font-bold text-base tracking-tighter">₹{item.price}</div>

          <AnimatePresence mode="wait">
            {inCart ? (
              <motion.div
                key="controls"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200"
              >
                <button
                  onClick={() => updateQuantity(item.id, -1)}
                  className="w-7 h-7 flex items-center justify-center bg-white rounded-lg text-rose-500 shadow-sm"
                >
                  <Minus className="w-4 h-4 stroke-[3]" />
                </button>
                <span className="font-black text-slate-900 w-8 text-center text-xs tabular-nums">{inCart.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, 1)}
                  className="w-7 h-7 flex items-center justify-center bg-white rounded-lg text-emerald-500 shadow-sm"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="add-btn"
                whileTap={{ scale: 0.95 }}
                onClick={() => addToCart(item)}
                className="bg-gradient-to-r from-black via-slate-500 to-black text-white px-6 py-2 rounded-md font-bold text-[11px] uppercase tracking-widest shadow-lg transition-all active:scale-95"
              >
                ADD
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export function UserPanel() {
  const { tableNumber } = useParams();
  const { menuItems, placeOrder, orders, cancelOrder } = useRestaurant();
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<'veg' | 'non-veg' | 'extra'>('veg');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'menu' | 'orders'>('menu');
  const navigate = useNavigate();
  const { tables } = useRestaurant();

  const numTable = parseInt(tableNumber || '0');

  // ─── Voice Notification Logic for User ────────────────────────────────────
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.lang = 'en-US';
      setTimeout(() => window.speechSynthesis.speak(utterance), 100);
    }
  };

  const prevStatuses = useRef<Record<string, string>>({});
  const isInit = useRef(false);

  useEffect(() => {
    const currentTableOrders = orders.filter(o => o.tableNumber === numTable);

    if (!isInit.current) {
      currentTableOrders.forEach(o => { prevStatuses.current[o.id] = o.status; });
      isInit.current = true;
      return;
    }

    currentTableOrders.forEach(order => {
      const prev = prevStatuses.current[order.id];
      if (prev !== order.status) {
        if (order.status === 'accepted') {
          speak('Your order is accepted');
          toast.success('Order Accepted!');
        } else if (order.status === 'ready') {
          speak('Your order is ready to serve');
          toast.success('Ready to Serve!');
        } else if (order.status === 'served') {
          speak('Enjoy your meal');
          toast.success('Served ✓');
        }
      }
      prevStatuses.current[order.id] = order.status;
    });
  }, [orders, numTable]);

  // ─── Auto Logout on Bill Print ───────────────────────────────────────────
  useEffect(() => {
    const currentTable = tables.find(t => t.tableNumber === numTable);
    if (currentTable && currentTable.status === 'paid') {
      toast.info('Session ended. Thank you for dining with us!');
      speak('Thank you!, Visit again');

      // Delay navigation so the voice plays completely before unmounting
      setTimeout(() => {
        navigate('/user-access', { replace: true });
      }, 2500);
    }
  }, [tables, numTable, navigate]);

  const filteredMenuItems = menuItems.filter(item => {
    const matchesCategory = item.category === categoryFilter;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // ─── Cart helpers ──────────────────────────────────────────────────────────

  const addToCart = (menuItem: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItem.id === menuItem.id);
      if (existing) {
        return prev.map(i =>
          i.menuItem.id === menuItem.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { menuItem, quantity: 1 }];
    });
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(i => i.menuItem.id === menuItemId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i)
        .filter(i => i.quantity > 0)
    );
  };

  const handlePlaceOrder = () => {
    if (!numTable) { toast.error('Invalid table number'); return; }
    if (cart.length === 0) { toast.error('Cart is empty'); return; }
    placeOrder(numTable, cart);
    toast.success('Order placed! Waiting for Captain to accept.');
    setCart([]);
    setActiveTab('orders');
  };

  const cartTotal = cart.reduce((s, i) => s + i.menuItem.price * i.quantity, 0);
  const tableOrders = orders.filter(o => o.tableNumber === numTable).slice().reverse();
  const pendingCount = tableOrders.filter(o => o.status === 'pending').length;

  // ─── Status display config ─────────────────────────────────────────────────

  const statusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pending — Waiting for Captain',
          badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          icon: <Clock className="w-4 h-4 animate-pulse" />,
          bar: 'bg-amber-500',
          progress: 20,
        };
      case 'accepted':
        return {
          label: 'Accepted by Captain',
          badgeClass: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
          icon: <CheckCircle2 className="w-4 h-4" />,
          bar: 'bg-blue-500',
          progress: 50,
        };
      case 'cooking':
        return {
          label: 'Accepted by Captain',
          badgeClass: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
          icon: <CheckCircle2 className="w-4 h-4" />,
          bar: 'bg-blue-500',
          progress: 50,
        };
      case 'ready':
        return {
          label: 'Ready to Serve',
          badgeClass: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
          icon: <Utensils className="w-4 h-4" />,
          bar: 'bg-orange-500',
          progress: 85,
        };
      case 'served':
        return {
          label: 'Served ✓',
          badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          icon: <CheckCircle2 className="w-4 h-4" />,
          bar: 'bg-emerald-500',
          progress: 100,
        };
      case 'rejected':
        return {
          label: 'Rejected by Captain',
          badgeClass: 'bg-red-500/20 text-red-400 border-red-500/30',
          icon: <XCircle className="w-4 h-4" />,
          bar: 'bg-red-500',
          progress: 100,
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          badgeClass: 'bg-slate-300 text-slate-500 border-slate-300',
          icon: <XCircle className="w-4 h-4" />,
          bar: 'bg-slate-400',
          progress: 100,
        };
      default:
        return {
          label: status,
          badgeClass: 'bg-slate-700 text-slate-400 border-slate-600',
          icon: null,
          bar: 'bg-slate-600',
          progress: 0,
        };
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-slate-50 pb-32"
    >

      {/* ── Compact Header ── */}
      <div className="bg-black border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-none flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Utensils className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black text-white leading-none">HOTEL ROYAL</h1>
              <p className="text-[10px] text-emerald-400 font-bold tracking-widest mt-1">TABLE {numTable}</p>
            </div>
          </div>
        </div>

        {/* Modern Search Area */}
        {activeTab === 'menu' && (
          <div className="px-4 pb-3 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative group"
            >
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <div className="w-px h-3 bg-slate-200" />
              </div>
              <input
                type="text"
                placeholder="Search favorite dishes..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white text-slate-900 pl-12 pr-4 py-2 rounded-md border border-slate-200 focus:border-emerald-500/50 transition-all text-base font-bold shadow-sm outline-none placeholder:text-slate-400"
              />
            </motion.div>
          </div>
        )}
      </div>

      {/* ── Category Filter Bar (Fixed Width - No Scroll) ── */}
      {activeTab === 'menu' && (
        <div className="sticky top-[108px] z-40 bg-white/80 backdrop-blur-xl border-b border-white/20 mb-4 shadow-sm h-14 sm:h-16 flex items-center">
          <div className="max-w-4xl mx-auto px-3 w-full grid grid-cols-3 gap-2 py-2">
            {([
              { id: 'veg', label: 'Pure Veg', color: 'bg-emerald-500', iconColor: 'border-emerald-500' },
              { id: 'non-veg', label: 'Non-Veg', color: 'bg-rose-500', iconColor: 'border-rose-500' },
              { id: 'extra', label: 'Extras', color: 'bg-amber-500', iconColor: 'border-amber-500' },
            ] as const).map(cat => (
              <motion.button
                key={cat.id}
                layout
                whileTap={{ scale: 0.95 }}
                onClick={() => setCategoryFilter(cat.id)}
                className={`flex items-center justify-center gap-2 px-3 py-3.5 rounded-md text-xs font-black transition-all border whitespace-nowrap ${categoryFilter === cat.id
                  ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/20 active:scale-95'
                  : 'bg-white/50 border-slate-100 text-slate-500 hover:border-slate-300'
                  }`}
              >
                <div className={`w-3 h-3 border-2 flex items-center justify-center ${cat.iconColor} rounded-none`}>
                  <div className={`w-1 h-1 rounded-none ${cat.color}`} />
                </div>
                {cat.label}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 mt-4 space-y-4">

        {/* ══════════════ MENU TAB ══════════════ */}
        {activeTab === 'menu' && (
          <div className="relative">
            {/* Ambient background glow */}
            <div className="absolute top-40 right-1/2 translate-x-1/2 w-96 h-96 bg-emerald-500/5 blur-[120px] rounded-full -z-10 pointer-events-none" />

            {/* Search & Filter - Handled above in sticky area */}


            {/* Menu items grouped by subCategory */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-10 pb-10"
            >
              {filteredMenuItems.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-20 text-slate-400"
                >
                  <Search className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-lg font-medium">No dishes found</p>
                  <p className="text-sm opacity-60">Try searching for something else or change category.</p>
                </motion.div>
              ) : categoryFilter === 'extra' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4 lg:gap-6">
                  {filteredMenuItems.map(item => (
                    <MenuCard key={item.id} item={item} cart={cart} updateQuantity={updateQuantity} addToCart={addToCart} />
                  ))}
                </div>
              ) : (
                <>
                  {['starter', 'main_course'].map(subCat => {
                    const subCatItems = filteredMenuItems.filter(i => i.subCategory === subCat);
                    if (subCatItems.length === 0) return null;

                    return (
                      <motion.div key={subCat} className="space-y-4">
                        <div className="w-fit bg-gradient-to-r from-black via-slate-500 to-black py-1 px-6 border-l-4 border-emerald-500 shadow-lg rounded-lg overflow-hidden relative group">
                          {/* Ambient light effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10 opacity-30" />

                          <div className="relative z-10">
                            <h2 className="text-xl font-bold text-white uppercase tracking-wider drop-shadow-md">
                              {subCat === 'starter' ? 'Starters' : 'Main Course'}
                            </h2>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6 lg:gap-8">
                          {subCatItems.map(item => (
                            <MenuCard key={item.id} item={item} cart={cart} updateQuantity={updateQuantity} addToCart={addToCart} />
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </>
              )}
            </motion.div>
          </div>
        )}

        {/* ══════════════ MY ORDERS TAB ══════════════ */}
        {activeTab === 'orders' && (
          <div className="space-y-8 pb-24 relative">
            {/* Decorative background glow */}
            <div className="absolute top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/5 blur-[120px] rounded-full -z-10 pointer-events-none" />

            {tableOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <motion.div
                  initial={{ rotate: -10, scale: 0.9 }}
                  animate={{ rotate: 0, scale: 1 }}
                  className="w-24 h-24 bg-gradient-to-br from-slate-50 to-white shadow-inner rounded-3xl flex items-center justify-center mb-6 border border-slate-100"
                >
                  <ClipboardList className="w-12 h-12 text-slate-200" />
                </motion.div>
                <p className="text-xl font-black text-slate-900 tracking-tight">Your table is empty</p>
                <p className="text-sm text-slate-500 text-center max-w-[220px] mt-2 leading-relaxed">
                  Browse our menu and treat yourself to something extraordinary!
                </p>
                <button
                  onClick={() => setActiveTab('menu')}
                  className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-full font-bold text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all"
                >
                  Explore Menu
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-end justify-between px-2">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Dining History</p>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Your Orders</h2>
                  </div>
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
                        <div className="w-full h-full bg-emerald-500/10 flex items-center justify-center">
                          <Utensils className="w-3 h-3 text-emerald-600" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-8 auto-rows-max">
                  {tableOrders.map((order, orderIdx) => {
                    const cfg = statusConfig(order.status);
                    const isLastOrder = orderIdx === 0;

                    return (
                      <motion.div
                        layout
                        key={order.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: orderIdx * 0.1 }}
                        className={`relative bg-white rounded-[2.5rem] border border-slate-100/80 shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden ${isLastOrder ? 'ring-2 ring-emerald-500/5' : ''}`}
                      >
                        {/* Premium Header with Glassmorphism Status */}
                        <div className="p-6 pb-4 flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <p className="text-slate-900 font-bold text-base tracking-tighter uppercase">ID: {order.id.slice(-4)}</p>
                            </div>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                              Ordered {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className={`backdrop-blur-xl flex items-center gap-2 px-4 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-widest shadow-sm shadow-black/5 transition-all ${cfg.badgeClass.replace('/20', '/10').replace('text-amber-400', 'text-amber-600').replace('text-blue-400', 'text-blue-600').replace('text-orange-400', 'text-orange-600').replace('text-emerald-400', 'text-emerald-600').replace('text-red-400', 'text-red-600')}`}>
                            <div className={`p-1 rounded-lg bg-white/50`}>{cfg.icon}</div>
                            {cfg.label.split(' — ')[0]}
                          </div>

                          {order.status === 'pending' && (
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => cancelOrder(order.id)}
                              className="bg-red-50 text-red-500 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-100 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                            >
                              Cancel
                            </motion.button>
                          )}
                        </div>

                        {/* Receipt Style Items List */}
                        <div className="px-6 py-2">
                          <div className="bg-slate-50/50 rounded-3xl p-5 border border-dashed border-slate-200">
                            <div className="space-y-4">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className={`min-w-[32px] h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-xs font-black text-slate-900 shadow-sm`}>
                                      {item.quantity}x
                                    </div>
                                    <div className="flex flex-col">
                                      <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-sm border ${item.menuItem.category === 'veg' ? 'border-emerald-500' : 'border-rose-500'} flex items-center justify-center`}>
                                          <div className={`w-0.5 h-0.5 rounded-full ${item.menuItem.category === 'veg' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                        </div>
                                        <span className="text-sm font-bold text-slate-800 tracking-tight">{item.menuItem.name}</span>
                                      </div>
                                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">₹{item.menuItem.price} / portion</span>
                                    </div>
                                  </div>
                                  <span className="text-sm font-bold text-slate-900">₹{item.menuItem.price * item.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Visual Order Tracking */}
                        {order.status !== 'rejected' && (
                          <div className="p-6 pt-4">
                            <div className="bg-white rounded-3xl p-4 border border-slate-50 shadow-inner">
                              <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Progress</span>
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{cfg.progress}% Advanced</span>
                              </div>
                              <div className="relative h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${cfg.progress}%` }}
                                  transition={{ duration: 1, ease: 'easeOut' }}
                                  className={`absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.3)]`}
                                />
                              </div>
                              <div className="flex justify-between mt-4">
                                {[Clock, ChefHat, Utensils, CheckCircle2].map((Icon, idx) => {
                                  const stepProgress = [20, 50, 85, 100][idx];
                                  const isActive = cfg.progress >= stepProgress;
                                  return (
                                    <div key={idx} className={`flex flex-col items-center gap-2 transition-all duration-500 ${isActive ? 'scale-110' : 'opacity-30'}`}>
                                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm ${isActive ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-slate-50 text-slate-400'}`}>
                                        <Icon className="w-4 h-4" />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Premium Footer with Brand Name */}
                        <div className="mt-2 bg-gradient-to-r from-slate-950 to-slate-800 p-6 flex items-center justify-center">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                              <Utensils className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div className="text-center">
                              <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] leading-none mb-1.5">HOTEL ROYAL</p>
                              <p className="text-white font-black text-base uppercase tracking-widest">Enjoy Your Meal</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 px-6 py-3 z-[100] shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
          <div className="max-w-xl mx-auto flex items-center justify-around">
            <button
              onClick={() => setActiveTab('menu')}
              className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'menu' ? 'text-emerald-600 scale-110' : 'text-slate-400'}`}
            >
              <div className={`p-2 rounded-none transition-colors ${activeTab === 'menu' ? 'bg-emerald-50' : 'bg-transparent'}`}>
                <Utensils className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-tighter">Menu</span>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex flex-col items-center gap-1 transition-all relative ${activeTab === 'orders' ? 'text-emerald-600 scale-110' : 'text-slate-400'}`}
            >
              <div className={`p-2 rounded-none transition-colors ${activeTab === 'orders' ? 'bg-emerald-50' : 'bg-transparent'}`}>
                <ClipboardList className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-tighter">Orders</span>
              {pendingCount > 0 && (
                <span className="absolute -top-1 right-0 bg-rose-500 text-white text-[8px] w-4 h-4 rounded-none flex items-center justify-center font-black animate-bounce shadow-md">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {activeTab === 'menu' && cart.length > 0 && (
            <motion.div
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              className="fixed bottom-24 left-0 right-0 px-4 z-[90]"
            >
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handlePlaceOrder}
                className="max-w-md mx-auto w-full bg-slate-900 text-white p-4 rounded-none shadow-2xl flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-500 p-2 rounded-none shadow-lg border border-emerald-400/20">
                    <ShoppingCart className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-[8px] font-black uppercase opacity-60 tracking-widest leading-none mb-1">
                      YOUR ORDER TOTAL
                    </p>
                    <p className="text-xl font-black tracking-tight text-white">₹{cartTotal}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 font-black text-xs uppercase tracking-[0.2em] text-emerald-400 group-hover:text-white transition-colors">
                  PLACE ORDER
                  <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
