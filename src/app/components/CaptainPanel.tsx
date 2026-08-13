import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, ChefHat,
  Utensils, Package, AlertCircle, Bell
} from 'lucide-react';
import { useRestaurant, Order } from '../context/RestaurantContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

type ViewMode = 'pending' | 'active' | 'all';

export function CaptainPanel() {
  const { orders, acceptOrder, rejectOrder, updateOrderStatus } = useRestaurant();
  const [viewMode, setViewMode] = useState<ViewMode>('pending');

  // ─── Voice Notification Utility ────────────────────────────────────────────
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      // Use small delay after cancel for better browser compatibility
      setTimeout(() => window.speechSynthesis.speak(utterance), 100);
    }
  };

  // ─── Notify captain for new orders and ready status ────────────────────────
  const prevOrderStatuses = useRef<Record<string, string>>({});
  const hasInitialized = useRef(false);

  useEffect(() => {
    // ─── INITIALIZATION LOGIC (On Reopen) ───
    if (!hasInitialized.current && orders.length > 0) {
      const pendingOrders = orders.filter(o => o.status === 'pending');
      if (pendingOrders.length > 0) {
        if (pendingOrders.length === 1) {
          speak(`New order from table number ${pendingOrders[0].tableNumber}`);
        } else {
          speak(`You have ${pendingOrders.length} pending orders`);
        }
      }

      orders.forEach(order => {
        prevOrderStatuses.current[order.id] = order.status;
      });
      hasInitialized.current = true;
      return;
    }

    // ─── REAL-TIME UPDATE LOGIC ───
    orders.forEach(order => {
      const prevStatus = prevOrderStatuses.current[order.id];

      // 1. New Order Alert (Voice + Toast)
      if (hasInitialized.current && !prevStatus && order.status === 'pending') {
        speak(`New order from table number ${order.tableNumber}`);
        toast.info(`🔔 New Order: Table ${order.tableNumber}`, {
          style: { background: '#f43f5e', color: '#fff', border: 'none' },
          duration: 5000
        });
      }

      // 2. Order Ready Alert
      if (hasInitialized.current && prevStatus && prevStatus !== 'ready' && order.status === 'ready') {
        speak(`Order is ready for table number ${order.tableNumber}`);
        toast.success(`🍽️ Table ${order.tableNumber} is Ready!`, {
          duration: 6000,
          position: 'top-center',
          style: { background: '#10b981', color: '#fff', border: 'none' },
        });
      }

      // 3. Status Change Debug
      if (prevStatus && prevStatus !== order.status) {
        console.log(`Order ${order.id} status changed: ${prevStatus} -> ${order.status}`);
      }

      prevOrderStatuses.current[order.id] = order.status;
    });

    if (orders.length > 0) hasInitialized.current = true;
  }, [orders]);

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const activeOrders = orders.filter(o => ['accepted', 'cooking', 'ready'].includes(o.status));
  const historyOrders = orders.filter(o => ['served', 'rejected', 'cancelled'].includes(o.status));

  const displayedOrders: Order[] =
    viewMode === 'pending' ? pendingOrders :
      viewMode === 'active' ? activeOrders :
        [...pendingOrders, ...activeOrders, ...historyOrders];

  const orderNeedsCooking = (order: Order) =>
    order.items.some(i => i.menuItem.isCookingRequired);

  const orderIsNonCooking = (order: Order) =>
    order.items.every(i => !i.menuItem.isCookingRequired);

  const handleAccept = (order: Order) => {
    acceptOrder(order.id);
    if (orderNeedsCooking(order)) {
      toast.success(`Table ${order.tableNumber} → Sent to Chef`);
    } else {
      toast.success(`Table ${order.tableNumber} → Ready to Serve`);
    }
  };

  const handleReject = (order: Order) => {
    rejectOrder(order.id);
    toast.error(`Table ${order.tableNumber} rejected`);
  };

  const handleMarkServed = (order: Order) => {
    updateOrderStatus(order.id, 'served');
    toast.success(`Table ${order.tableNumber} served`);
  };

  const statusMeta = (status: string) => {
    switch (status) {
      case 'pending': return { label: 'New', className: 'bg-rose-500/10 text-rose-500 border-rose-500/20', icon: <Clock className="w-3 h-3 animate-pulse" /> };
      case 'accepted': return { label: 'Chef', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: <ChefHat className="w-3 h-3" /> };
      case 'cooking': return { label: 'Cooking', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: <ChefHat className="w-3 h-3 animate-bounce" /> };
      case 'ready': return { label: 'Ready', className: 'bg-orange-500/10 text-orange-400 border-orange-500/20', icon: <Utensils className="w-3 h-3" /> };
      case 'served': return { label: 'Served', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: <CheckCircle2 className="w-3 h-3" /> };
      case 'rejected': return { label: 'Rejected', className: 'bg-rose-500/10 text-rose-500 border-rose-500/20', icon: <XCircle className="w-3 h-3" /> };
      case 'cancelled': return { label: 'Cancelled', className: 'bg-slate-500/10 text-slate-500 border-slate-500/20', icon: <XCircle className="w-3 h-3" /> };
      default: return { label: status, className: 'bg-slate-700/10 text-slate-400 border-slate-700/20', icon: null };
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30 font-['Outfit']">

      {/* ── UNIFIED STICKY HEADER ── */}
      <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-5xl mx-auto">
          {/* Top Title Bar */}
          <div className="flex items-center justify-between px-4 py-4 sm:py-6">
            <div className="flex items-center gap-4">
              <Link to="/" className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors border border-white/10 group">
                <ArrowLeft className="w-5 h-5 text-white group-hover:-translate-x-1 transition-transform" />
              </Link>
              <div>
                <h1 className="text-sm font-black tracking-tighter uppercase leading-none">Captain Hub</h1>
                <p className="text-[10px] text-emerald-400 font-bold tracking-[0.2em] mt-1.5 uppercase opacity-80">Real-time Management</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  speak("Voice system activated");
                  toast.success("Voice System Active", { icon: '🔊' });
                }}
                className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors border border-white/10 text-emerald-400 group relative"
                title="Test & Enable Voice"
              >
                <Bell className="w-3.5 h-3.5 shadow-sm shadow-emerald-500/20 group-active:scale-90" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              </button>
              {pendingOrders.length > 0 && (
                <div className="flex items-center gap-2 bg-rose-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 animate-pulse">
                  <Bell className="w-3 h-3 text-white" />
                  {pendingOrders.length} New
                </div>
              )}
            </div>
          </div>

          {/* Quick Filter Bar */}
          <div className="flex border-t border-white/5">
            {([
              { id: 'pending', label: 'New', count: pendingOrders.length },
              { id: 'active', label: 'In Progress', count: activeOrders.length },
              { id: 'all', label: 'History', count: orders.length },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id)}
                className={`flex-1 flex flex-col items-center py-3 relative transition-all ${viewMode === tab.id ? 'text-white' : 'text-slate-500'
                  }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-black uppercase tracking-widest">{tab.label}</span>
                  <span className={`text-xs font-bold ${viewMode === tab.id ? 'text-emerald-400' : 'text-slate-600'}`}>
                    {tab.count}
                  </span>
                </div>
                {viewMode === tab.id && (
                  <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 sm:p-6 pb-24">

        <AnimatePresence mode="wait">
          {displayedOrders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center py-32 text-center"
            >
              <div className="w-20 h-20 bg-white/5 flex items-center justify-center mb-6 border border-white/5">
                <Package className="w-8 h-8 text-slate-700" />
              </div>
              <p className="text-lg font-black tracking-tight uppercase text-white">Operational Quiet</p>
              <p className="text-[10px] text-slate-500 tracking-[0.2em] mt-2 uppercase opacity-60">All targets achieved • Waiting for orders</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {displayedOrders.map(order => {
                const meta = statusMeta(order.status);
                const isUrgent = order.status === 'pending';

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={order.id}
                    className={`bg-white/5 border border-white/35 rounded-md relative group transition-all duration-500 ${isUrgent ? 'ring-1 ring-rose-500/30' : ''
                      }`}
                  >
                    {/* Urgency Glow */}
                    {isUrgent && (
                      <div className="absolute inset-0 bg-rose-500/5 animate-pulse pointer-events-none" />
                    )}

                    <div className="relative z-10">
                      {/* Card Header */}
                      <div className="p-4 flex items-start justify-between border-b border-white/5">
                        <div className="space-y-1">
                          <h2 className="text-2xl font-black tracking-tighter uppercase leading-none">Table {order.tableNumber}</h2>
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                            {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs font-black uppercase tracking-widest ${meta.className}`}>
                          {meta.icon}
                          {meta.label}
                        </div>
                      </div>

                      {/* Items */}
                      <div className="p-4 space-y-3">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-1.5 h-1.5 rounded-none flex-shrink-0 ${item.menuItem.category === 'veg' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              <div className="flex-1">
                                <span className="text-sm font-bold text-slate-200 uppercase tracking-tight">{item.menuItem.name}</span>
                                {item.menuItem.isCookingRequired && (
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <ChefHat className="w-2.5 h-2.5 text-blue-400" />
                                    <span className="text-[10px] text-blue-400 font-black uppercase tracking-tighter">Kitchen</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <span className="text-sm font-black text-white">×{item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      {/* Summary Section */}
                      <div className="px-4 py-3 bg-white/5 flex items-center justify-between border-t border-white/5">
                        <div className="flex items-center gap-2">
                          {orderIsNonCooking(order) ? (
                            <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">Quick</div>
                          ) : (
                            <div className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-widest border border-blue-500/20">Chef Required</div>
                          )}
                        </div>
                        <span className="text-base font-black text-white">
                          ₹{order.items.reduce((s, i) => s + i.menuItem.price * i.quantity, 0)}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="p-4 pt-2">
                        {order.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAccept(order)}
                              className="flex-1 bg-white text-black py-3 text-xs font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all duration-300"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleReject(order)}
                              className="w-12 flex items-center justify-center border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white transition-all duration-300"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>
                        )}

                        {['accepted', 'cooking'].includes(order.status) && (
                          <div className="flex items-center justify-center gap-3 py-3 bg-white/5 border border-white/5 text-xs font-black uppercase tracking-widest text-blue-400">
                            <ChefHat className="w-4 h-4 animate-bounce" />
                            In Kitchen
                          </div>
                        )}

                        {order.status === 'ready' && (
                          <button
                            onClick={() => handleMarkServed(order)}
                            className="w-full bg-emerald-500 text-white py-3 text-xs font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
                          >
                            Mark as Served
                          </button>
                        )}

                        {order.status === 'served' && (
                          <div className="flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/5 text-emerald-500 text-xs font-black uppercase tracking-widest">
                            <CheckCircle2 className="w-4 h-4" />
                            Served Successfully
                          </div>
                        )}

                        {(order.status === 'rejected' || order.status === 'cancelled') && (
                          <div className="flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/5 text-rose-500 text-[10px] font-black uppercase tracking-widest">
                            <XCircle className="w-4 h-4" />
                            {order.status}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
