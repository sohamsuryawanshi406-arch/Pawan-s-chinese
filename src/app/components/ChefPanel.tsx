import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, Clock, Flame, CheckCircle, AlertCircle, ChefHat, X, Lock } from 'lucide-react';
import { useRestaurant, Order } from '../context/RestaurantContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Notification Sound Utility ────────────────────────────────────────────
const playNotificationSound = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 800;
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0.8, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.01, audioContext.currentTime + 0.8);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.8);
};

type ChefTab = 'pending' | 'cooking' | 'ready';

export function ChefPanel() {
  const navigate = useNavigate();
  const { orders, updateOrderStatus, cancelOrder, acceptOrder } = useRestaurant();
  const [activeTab, setActiveTab] = useState<ChefTab>('pending');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const cookingOrders = orders.filter(o => o.status === 'cooking');
  const readyOrders   = orders.filter(o => o.status === 'ready');

  // ─── Voice Notification Utility ────────────────────────────────────────────
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.lang = 'en-US';
      // Use small delay after cancel to ensure audio isn't swallowed
      setTimeout(() => window.speechSynthesis.speak(utterance), 100);
    }
  };

  // ─── Notify Chef for new orders ───────────────────────────────────────────
  const prevOrderStatuses = useRef<Record<string, string>>({});
  const isInitialized = useRef(false);

  useEffect(() => {
    // 1. Map existing orders on first run to avoid noise
    if (!isInitialized.current) {
      orders.forEach(o => { prevOrderStatuses.current[o.id] = o.status; });
      isInitialized.current = true;
      return;
    }

    // 2. Real-time updates for everything after mount
    orders.forEach(order => {
      const prevStatus = prevOrderStatuses.current[order.id];

      // New Order for Chef Trigger
      if (prevStatus !== 'pending' && order.status === 'pending') {
        playNotificationSound();
        const location = order.isParcel || order.tableNumber === 21 ? 'Parcel' : `table ${order.tableNumber}`;
        toast.info(`🔔 Kitchen Alert: ${location === 'Parcel' ? 'Parcel' : 'Table ' + order.tableNumber}`, {
          style: { background: '#f59e0b', color: '#fff', border: 'none' }
        });
      }

      // Order Ready Trigger
      if (prevStatus !== 'ready' && order.status === 'ready') {
        const location = order.isParcel || order.tableNumber === 21 ? 'Parcel' : `table ${order.tableNumber}`;
        toast.success(`🔔 Order Ready: ${location === 'Parcel' ? 'Parcel' : 'Table ' + order.tableNumber}`, {
          style: { background: '#10b981', color: '#fff', border: 'none' }
        });
      }

      prevOrderStatuses.current[order.id] = order.status;
    });
  }, [orders]);

  // ── Tab config ──────────────────────────────────────────────────────────────
  const tabs: { id: ChefTab; label: string; count: number; color: string }[] = [
    { id: 'pending', label: 'Pending', count: pendingOrders.length, color: 'text-rose-400' },
    { id: 'cooking', label: 'Cooking', count: cookingOrders.length, color: 'text-amber-400' },
    { id: 'ready',   label: 'Ready',   count: readyOrders.length,   color: 'text-emerald-400' },
  ];

  const displayedOrders =
    activeTab === 'pending' ? pendingOrders :
    activeTab === 'cooking' ? cookingOrders :
    readyOrders;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '@chef1') {
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
              <div className="bg-orange-500/20 backdrop-blur-sm rounded-full p-6 mb-4">
                <Lock className="w-12 h-12 text-orange-500" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Chef Panel</h1>
              <p className="text-slate-400">Enter password to access</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-medium focus:border-orange-500 focus:outline-none transition-colors placeholder:text-slate-600"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-orange-500/20"
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

  // ── Order Card ──────────────────────────────────────────────────────────────
  const OrderCard = ({ order }: { order: Order }) => {
    const isPending = order.status === 'pending';
    const isCooking = order.status === 'cooking';
    const isReady   = order.status === 'ready';

    const accentMap: Record<string, string> = {
      rose:    'border-rose-500/70 ring-rose-500/30',
      amber:   'border-amber-500/70 ring-amber-500/30',
      emerald: 'border-emerald-500/70 ring-emerald-500/30',
    };
    const textAccentMap: Record<string, string> = {
      rose:    'text-rose-400',
      amber:   'text-amber-400',
      emerald: 'text-emerald-400',
    };
    const bgAccentMap: Record<string, string> = {
      rose:    'bg-rose-500/10',
      amber:   'bg-amber-500/10',
      emerald: 'bg-emerald-500/10',
    };
    const accent = isPending ? 'rose' : isCooking ? 'amber' : 'emerald';
    const isParcel = order.isParcel || order.tableNumber === 21;
    
    const headerBg = isParcel ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20' : bgAccentMap[accent];
    const titleColor = isParcel ? 'text-amber-400' : 'text-white';
    const statusBadge = isParcel ? 'text-amber-400 bg-amber-500/20 border-amber-500/30' : textAccentMap[accent];
    const statusBadgeBg = isParcel ? '' : bgAccentMap[accent];
    const cardBorder = isParcel ? 'border-amber-500/50 ring-1 ring-amber-500/30' : accentMap[accent];

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`bg-white/5 border rounded-md overflow-hidden ${cardBorder} ${isPending ? 'ring-1' : ''}`}
      >
        {/* Card Header */}
        <div className={`px-4 py-3 flex items-center justify-between border-b border-white/10 ${headerBg}`}>
          <div className="space-y-0.5">
            <h2 className={`text-3xl font-black tracking-tighter uppercase leading-none ${titleColor}`}>
              {isParcel ? 'Parcel' : `Table ${order.tableNumber}`}
            </h2>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-500 font-bold tracking-widest uppercase">
                {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
          <div className={`text-sm font-black uppercase tracking-widest px-3 py-1.5 border rounded-md ${statusBadge} ${statusBadgeBg}`}>
            {isPending ? 'New' : isCooking ? 'Cooking' : 'Done'}
          </div>
        </div>

        {/* Items */}
        <div className="p-4 space-y-3">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 flex-shrink-0 ${item.menuItem.category === 'veg' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <div className="flex flex-col">
                  <span className="text-base font-bold text-slate-200 uppercase tracking-tight">{item.menuItem.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-black uppercase px-2 py-0.5 rounded ${item.portionSize === 'half' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                  {item.portionSize === 'half' ? 'Half' : 'Full'}
                </span>
                <span className={`text-base font-black ${textAccentMap[accent]}`}>×{item.quantity}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 space-y-2">
          {isPending && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  acceptOrder(order.id);
                  setActiveTab('cooking');
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white py-3.5 text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20"
              >
                <Flame className="w-4 h-4" />
                Accept
              </button>
              <button
                onClick={() => {
                  cancelOrder(order.id);
                  toast.success('Order cancelled');
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-400 text-white py-3.5 text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-500/20"
              >
                <X className="w-4 h-4" />
                Reject
              </button>
            </div>
          )}

          {isCooking && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  updateOrderStatus(order.id, 'ready');
                  setActiveTab('ready');
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white py-3.5 text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle className="w-4 h-4" />
                Mark Ready
              </button>
            </div>
          )}

          {isReady && (
            <div className="flex items-center justify-center gap-2 py-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-widest">
              <CheckCircle className="w-4 h-4" />
              Ready — Waiting for Captain
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black text-white font-['Outfit']">

      {/* ── STICKY HEADER ── */}
      <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-5xl mx-auto">

          {/* Title Bar */}
          <div className="flex items-center justify-between px-4 py-4 sm:py-5">
            <div className="flex items-center gap-4">
              <Link to="/" className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 transition border border-white/10 group">
                <ArrowLeft className="w-5 h-5 text-white group-hover:-translate-x-1 transition-transform" />
              </Link>
              <div>
                <h1 className="text-sm font-black tracking-tighter uppercase leading-none">Kitchen Display</h1>
                <p className="text-[10px] text-amber-400 font-bold tracking-[0.2em] mt-1.5 uppercase opacity-80">Chef Panel</p>
              </div>
            </div>

            {pendingOrders.length > 0 && (
              <div className="flex items-center gap-1.5 bg-rose-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest animate-pulse rounded-md shadow-lg shadow-rose-500/20">
                <AlertCircle className="w-3.5 h-3.5" />
                {pendingOrders.length} New
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex border-t border-white/5">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center py-3 relative transition-all ${activeTab === tab.id ? 'text-white' : 'text-slate-500'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-black uppercase tracking-widest">{tab.label}</span>
                  <span className={`text-xs font-bold ${activeTab === tab.id ? tab.color : 'text-slate-600'}`}>{tab.count}</span>
                </div>
                {activeTab === tab.id && (
                  <motion.div layoutId="chef-tab-line" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="max-w-5xl mx-auto p-4 sm:p-6 pb-24">
        <AnimatePresence mode="wait">
          {displayedOrders.length === 0 ? (
            <motion.div
              key={`empty-${activeTab}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 text-center"
            >
              <div className="w-24 h-24 bg-white/5 border border-white/5 flex items-center justify-center mb-6">
                <ChefHat className="w-10 h-10 text-slate-700" />
              </div>
              <p className="text-xl font-black tracking-tight uppercase text-white">
                {activeTab === 'pending' ? 'No New Orders' : activeTab === 'cooking' ? 'Nothing Cooking' : 'Nothing Ready'}
              </p>
              <p className="text-xs text-slate-500 tracking-[0.2em] mt-2 uppercase opacity-60">Standing by...</p>
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {displayedOrders.map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
