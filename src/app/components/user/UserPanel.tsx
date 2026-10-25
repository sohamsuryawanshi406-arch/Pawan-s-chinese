import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import {
  ArrowLeft, Search, ShoppingCart, Leaf, Drumstick,
  Plus, Minus, CheckCircle2, Clock, ChefHat,
  Pizza, ClipboardList, Trash2, XCircle, X, Utensils, Lock
} from 'lucide-react';
import { useRestaurant, MenuItem, OrderItem, Order, PortionSize } from '../../context/RestaurantContext';
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
      type: 'spring' as const,
      damping: 25,
      stiffness: 120
    }
  }
};

function MenuCard({ item, cart, updateQuantity, addToCart }: {
  item: MenuItem,
  cart: OrderItem[],
  updateQuantity: (id: string, portionSize: PortionSize, delta: number) => void,
  addToCart: (item: MenuItem, portionSize: PortionSize) => void,
}) {
  const inCart = cart.find(i => i.menuItem.id === item.id);
  const isVeg = item.category === 'veg';

  // Get quantities for each portion size
  const halfItem = cart.find(i => i.menuItem.id === item.id && i.portionSize === 'half');
  const fullItem = cart.find(i => i.menuItem.id === item.id && i.portionSize === 'full');
  const halfQty = halfItem?.quantity || 0;
  const fullQty = fullItem?.quantity || 0;

  return (
    <motion.div
      variants={itemVariants}
      layout
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className="bg-white rounded-xl shadow-sm hover:shadow-md border-2 border-slate-200 p-4 group transition-all duration-300"
    >
      {/* Veg/Non-Veg Badge and Item Name */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-6 h-6 border-2 flex items-center justify-center flex-shrink-0 ${isVeg ? 'border-emerald-500' : 'border-rose-500'}`}>
          <div className={`w-2.5 h-2.5 rounded-full ${isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
        </div>
        <h3 className="font-bold text-slate-900 text-lg leading-tight tracking-tight uppercase flex-1">
          {item.name}
        </h3>
        {!item.isCookingRequired && (
          <span className="text-[10px] text-emerald-600 font-black uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded">Quick</span>
        )}
      </div>

      {/* Half/Full Buttons */}
      <div className="flex gap-3">
        {item.category === 'extra' ? (
          /* Extra items - single add button */
          inCart ? (
            <div className="flex-1 flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
              <button
                onClick={() => updateQuantity(item.id, 'full', -1)}
                className="w-10 h-10 flex items-center justify-center bg-white rounded-md text-rose-500 shadow-sm hover:bg-rose-50 transition-colors"
              >
                <Minus className="w-5 h-5 stroke-[3]" />
              </button>
              <span className="font-black text-slate-900 w-12 text-center text-base tabular-nums">{inCart.quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, 'full', 1)}
                className="w-10 h-10 flex items-center justify-center bg-white rounded-md text-emerald-500 shadow-sm hover:bg-emerald-50 transition-colors"
              >
                <Plus className="w-5 h-5 stroke-[3]" />
              </button>
            </div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => addToCart(item, 'full')}
              className="flex-1 bg-slate-900 text-white py-3 rounded-lg font-bold text-sm uppercase tracking-widest shadow-md transition-all active:scale-95"
            >
              ₹{item.fullPrice}
            </motion.button>
          )
        ) : (
          /* Veg/Non-veg items - half and full */
          <>
            {/* Half */}
            <div className="flex-1">
              {halfQty > 0 ? (
                /* Quantity controls for half */
                <div className="flex items-center bg-emerald-50 rounded-lg p-1 border-2 border-emerald-200">
                  <button
                    onClick={() => updateQuantity(item.id, 'half', -1)}
                    className="w-10 h-10 flex items-center justify-center bg-white rounded-md text-rose-500 shadow-sm hover:bg-rose-50 transition-colors"
                  >
                    <Minus className="w-5 h-5 stroke-[3]" />
                  </button>
                  <span className="font-black text-slate-900 w-12 text-center text-base tabular-nums">{halfQty}</span>
                  <button
                    onClick={() => updateQuantity(item.id, 'half', 1)}
                    className="w-10 h-10 flex items-center justify-center bg-white rounded-md text-emerald-500 shadow-sm hover:bg-emerald-50 transition-colors"
                  >
                    <Plus className="w-5 h-5 stroke-[3]" />
                  </button>
                </div>
              ) : (
                /* Half button */
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => addToCart(item, 'half')}
                  className="w-full bg-emerald-500 text-white py-3 rounded-lg font-bold text-sm uppercase tracking-widest shadow-md transition-all active:scale-95"
                >
                  Half ₹{item.halfPrice}
                </motion.button>
              )}
            </div>

            {/* Full */}
            <div className="flex-1">
              {fullQty > 0 ? (
                /* Quantity controls for full */
                <div className="flex items-center bg-rose-50 rounded-lg p-1 border-2 border-rose-200">
                  <button
                    onClick={() => updateQuantity(item.id, 'full', -1)}
                    className="w-10 h-10 flex items-center justify-center bg-white rounded-md text-rose-500 shadow-sm hover:bg-rose-50 transition-colors"
                  >
                    <Minus className="w-5 h-5 stroke-[3]" />
                  </button>
                  <span className="font-black text-slate-900 w-12 text-center text-base tabular-nums">{fullQty}</span>
                  <button
                    onClick={() => updateQuantity(item.id, 'full', 1)}
                    className="w-10 h-10 flex items-center justify-center bg-white rounded-md text-emerald-500 shadow-sm hover:bg-emerald-50 transition-colors"
                  >
                    <Plus className="w-5 h-5 stroke-[3]" />
                  </button>
                </div>
              ) : (
                /* Full button */
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => addToCart(item, 'full')}
                  className="w-full bg-rose-500 text-white py-3 rounded-lg font-bold text-sm uppercase tracking-widest shadow-md transition-all active:scale-95"
                >
                  Full ₹{item.fullPrice}
                </motion.button>
              )}
            </div>
          </>
        )}
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
  const [activeTab, setActiveTab] = useState<'tables' | 'orders'>('tables');
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [isParcelMode, setIsParcelMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { tables } = useRestaurant();

  const numTable = selectedTable || parseInt(tableNumber || '0');

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

  const playBellSound = () => {
    // Create audio context for professional bell notification
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create multiple oscillators for realistic bell sound
    const frequencies = [880, 1760, 2200]; // A5, A6, C#7
    const oscillators = frequencies.map(freq => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      osc.connect(gain);
      gain.connect(audioContext.destination);
      
      osc.frequency.value = freq;
      osc.type = 'sine';
      
      return { osc, gain };
    });

    // Play bell pattern
    const now = audioContext.currentTime;
    oscillators.forEach(({ osc, gain }, i) => {
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.6, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
      
      osc.start(now + (i * 0.1));
      osc.stop(now + 1.5);
    });
  };

  const prevStatuses = useRef<Record<string, string>>({});
  const notifiedReadyOrders = useRef<Set<string>>(new Set(JSON.parse(localStorage.getItem('notifiedReadyOrders') || '[]')));
  const isInit = useRef(false);

  // Save notified orders to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('notifiedReadyOrders', JSON.stringify(Array.from(notifiedReadyOrders.current)));
  }, [notifiedReadyOrders.current]);

  useEffect(() => {
    if (!isInit.current) {
      orders.forEach(o => { 
        prevStatuses.current[o.id] = o.status;
        // Mark already ready orders as notified to prevent initial notification
        if (o.status === 'ready') {
          notifiedReadyOrders.current.add(o.id);
        }
      });
      // Save to localStorage immediately after marking already ready orders
      localStorage.setItem('notifiedReadyOrders', JSON.stringify(Array.from(notifiedReadyOrders.current)));
      isInit.current = true;
      return;
    }

    orders.forEach(order => {
      const prev = prevStatuses.current[order.id];
      if (prev !== order.status) {
        if (order.status === 'ready' && !notifiedReadyOrders.current.has(order.id)) {
          playBellSound();
          const location = order.tableNumber === 21 ? 'Parcel' : `Table ${order.tableNumber}`;
          toast.success(`🔔 ${location} order is ready to serve!`, {
            duration: 5000,
            style: { background: '#10b981', color: '#fff', border: 'none' }
          });
          notifiedReadyOrders.current.add(order.id);
          localStorage.setItem('notifiedReadyOrders', JSON.stringify(Array.from(notifiedReadyOrders.current)));
        }
      }
      prevStatuses.current[order.id] = order.status;
    });
  }, [orders]);

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

  const addToCart = (menuItem: MenuItem, portionSize: PortionSize) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItem.id === menuItem.id && i.portionSize === portionSize);
      if (existing) {
        return prev.map(i =>
          i.menuItem.id === menuItem.id && i.portionSize === portionSize ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { menuItem, quantity: 1, portionSize }];
    });
  };

  const updateQuantity = (menuItemId: string, portionSize: PortionSize, delta: number) => {
    setCart(prev =>
      prev
        .map(i => i.menuItem.id === menuItemId && i.portionSize === portionSize ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i)
        .filter(i => i.quantity > 0)
    );
  };



  const handlePlaceOrder = () => {
    if (!numTable) { toast.error('Invalid table number'); return; }
    if (cart.length === 0) { toast.error('Cart is empty'); return; }
    
    const isParcel = isParcelMode || numTable === 21;
    
    if (isParcel) {
      placeOrder(numTable, cart, true);
      toast.success('Parcel order placed!');
    } else {
      placeOrder(numTable, cart, false);
      toast.success('Order placed! Waiting for Captain to accept.');
    }
    
    setCart([]);
    setSelectedTable(null);
    setIsParcelMode(false);
  };

  const cartTotal = cart.reduce((s, i) => s + (i.portionSize === 'half' ? i.menuItem.halfPrice : i.menuItem.fullPrice) * i.quantity, 0);
  const tableOrders = orders.filter(o => o.tableNumber === numTable).slice().reverse();
  const allOrders = orders.slice().reverse();
  const pendingCount = allOrders.filter(o => o.status === 'pending').length;

  // ─── Status display config ─────────────────────────────────────────────────

  const statusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pending',
          badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          icon: <Clock className="w-4 h-4 animate-pulse" />,
        };
      case 'cooking':
        return {
          label: 'Cooking',
          badgeClass: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
          icon: <CheckCircle2 className="w-4 h-4" />,
        };
      case 'ready':
        return {
          label: 'Ready',
          badgeClass: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
          icon: <Pizza className="w-4 h-4" />,
        };
      case 'served':
        return {
          label: 'Served ✓',
          badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          icon: <CheckCircle2 className="w-4 h-4" />,
        };
      case 'rejected':
        return {
          label: 'Rejected',
          badgeClass: 'bg-red-500/20 text-red-400 border-red-500/30',
          icon: <XCircle className="w-4 h-4" />,
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          badgeClass: 'bg-slate-300 text-slate-500 border-slate-300',
          icon: <XCircle className="w-4 h-4" />,
        };
      default:
        return {
          label: status,
          badgeClass: 'bg-slate-700 text-slate-400 border-slate-600',
          icon: null,
        };
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Orderman') {
      setIsAuthenticated(true);
      toast.success('Login successful');
    } else {
      toast.error('Invalid password');
      setPassword('');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-slate-800 rounded-2xl p-8 shadow-2xl">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="bg-blue-500/20 backdrop-blur-sm rounded-full p-6 mb-4">
                <Lock className="w-12 h-12 text-blue-500" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Order Panel</h1>
              <p className="text-slate-400">Enter password to access</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-medium focus:border-blue-500 focus:outline-none transition-colors placeholder:text-slate-600"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-500/20"
              >
                Login
              </button>
            </form>
            <div className="mt-6 text-center">
              <Link to="/" className="text-slate-400 hover:text-white transition-colors text-sm">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            {(selectedTable || isParcelMode) && (
              <button
                onClick={() => { setSelectedTable(null); setIsParcelMode(false); }}
                className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="w-10 h-10 bg-emerald-500 rounded-none flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Pizza className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-normal text-white leading-none">Pawan's Chinese</h1>
              {selectedTable && (
                <p className="text-[10px] text-emerald-400 font-bold tracking-widest mt-1">{isParcelMode || selectedTable === 21 ? 'PARCEL' : `TABLE ${selectedTable}`}</p>
              )}
            </div>
          </div>
        </div>

        {/* Modern Search Area */}
        {selectedTable && (
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
                className="w-full bg-white text-slate-900 pl-12 pr-10 py-2 rounded-md border border-slate-200 focus:border-emerald-500/50 transition-all text-base font-bold shadow-sm outline-none placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          </div>
        )}
      </div>

      {/* ── Category Filter Bar (Fixed Width - No Scroll) ── */}
      {selectedTable && (
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

        {/* ══════════════ TABLE SELECTION ══════════════ */}
        {activeTab === 'tables' && !selectedTable && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-6"
          >
            <div className="grid grid-cols-4 gap-2 max-w-3xl mx-auto">
              {Array.from({ length: 20 }, (_, i) => i + 1).map(tableNum => {
                const isOccupied = tables.some(t => t.tableNumber === tableNum && t.status === 'active');
                return (
                  <motion.button
                    key={tableNum}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedTable(tableNum)}
                    className={`aspect-square rounded-lg font-bold text-lg flex flex-col items-center justify-center gap-1 transition-all shadow-sm ${
                      isOccupied
                        ? 'bg-emerald-500 text-white border-2 border-emerald-600 hover:bg-emerald-600 hover:shadow-md'
                        : 'bg-slate-800 text-white border-2 border-slate-700 hover:border-emerald-500 hover:shadow-md'
                    }`}
                  >
                    {tableNum}
                  </motion.button>
                );
              })}
            </div>
            <div className="flex justify-center mt-4">
              {(() => {
                const tableNum = 21;
                const isOccupied = tables.some(t => t.tableNumber === tableNum && t.status === 'active');
                return (
                  <motion.button
                    key={tableNum}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setSelectedTable(tableNum); setIsParcelMode(true); }}
                    className={`h-20 w-64 rounded-xl font-bold text-xl flex flex-col items-center justify-center gap-2 transition-all shadow-sm ${
                      isOccupied
                        ? 'bg-orange-500 text-white border-2 border-orange-600 hover:bg-orange-600 hover:shadow-md'
                        : 'bg-orange-500 text-white border-2 border-orange-600 hover:bg-orange-600 hover:shadow-md'
                    }`}
                  >
                    Parcel
                  </motion.button>
                );
              })()}
            </div>
          </motion.div>
        )}

        {/* ══════════════ MENU (Shown when table is selected) ══════════════ */}
        {selectedTable && (
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
                <div className="space-y-3">
                  {filteredMenuItems.map(item => (
                    <MenuCard key={item.id} item={item} cart={cart} updateQuantity={updateQuantity} addToCart={addToCart} />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMenuItems.map(item => (
                    <MenuCard key={item.id} item={item} cart={cart} updateQuantity={updateQuantity} addToCart={addToCart} />
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}



        {/* ══════════════ MY ORDERS TAB ══════════════ */}
        {activeTab === 'orders' && (
          <div className="space-y-8 pb-24 relative">
            {/* Decorative background glow */}
            <div className="absolute top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/5 blur-[120px] rounded-full -z-10 pointer-events-none" />

            {(selectedTable ? tableOrders : allOrders).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <motion.div
                  initial={{ rotate: -10, scale: 0.9 }}
                  animate={{ rotate: 0, scale: 1 }}
                  className="w-24 h-24 bg-gradient-to-br from-slate-50 to-white shadow-inner rounded-3xl flex items-center justify-center mb-6 border border-slate-100"
                >
                  <ClipboardList className="w-12 h-12 text-slate-200" />
                </motion.div>
                <p className="text-xl font-black text-slate-900 tracking-tight">No orders yet</p>
                <p className="text-sm text-slate-500 text-center max-w-[220px] mt-2 leading-relaxed">
                  {selectedTable ? 'This table has no orders yet.' : 'No orders in the restaurant yet.'}
                </p>
                {selectedTable && (
                  <button
                    onClick={() => setSelectedTable(null)}
                    className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-full font-bold text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    Select Another Table
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-end justify-between px-2">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Dining History</p>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter">{selectedTable ? (selectedTable === 21 ? 'Parcel Orders' : `Table ${selectedTable} Orders`) : 'All Orders'}</h2>
                  </div>
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
                        <div className="w-full h-full bg-emerald-500/10 flex items-center justify-center">
                          <Pizza className="w-3 h-3 text-emerald-600" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-8 auto-rows-max">
                  {(selectedTable ? tableOrders : allOrders).map((order, orderIdx) => {
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
                              {!selectedTable && (
                                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                                  {order.tableNumber === 21 ? 'Parcel' : `Table ${order.tableNumber}`}
                                </span>
                              )}
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
                                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">
                                        ₹{item.portionSize === 'half' ? item.menuItem.halfPrice : item.menuItem.fullPrice} / {item.portionSize}
                                      </span>
                                    </div>
                                  </div>
                                  <span className="text-sm font-bold text-slate-900">
                                    ₹{(item.portionSize === 'half' ? item.menuItem.halfPrice : item.menuItem.fullPrice) * item.quantity}
                                  </span>
                                </div>
                              ))}
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

        {/* ══════════════ NAVBAR (Only when no table selected) ══════════════ */}
        {!selectedTable && (
          <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 px-6 py-3 z-[100] shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
            <div className="max-w-xl mx-auto flex items-center justify-around">
              <button
                onClick={() => { setSelectedTable(null); setActiveTab('tables'); }}
                className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'tables' ? 'text-emerald-600 scale-110' : 'text-slate-400'}`}
              >
                <div className={`p-2 rounded-none transition-colors ${activeTab === 'tables' ? 'bg-emerald-50' : 'bg-transparent'}`}>
                  <Utensils className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-tighter">Tables</span>
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
        )}

        <AnimatePresence>
          {selectedTable && cart.length > 0 && (
            <motion.div
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              className="fixed bottom-6 left-0 right-0 px-4 z-[90]"
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
