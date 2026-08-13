import { useState, useMemo } from 'react';
import { Link } from 'react-router';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  ArrowLeft, TrendingUp, ShoppingBag, IndianRupee, Hash,
  BarChart3, Star, ChevronDown, Calendar, Filter, Package,
  LayoutDashboard, PieChart, Activity, Layers, Download
} from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';
import { motion, AnimatePresence } from 'framer-motion';

type TimeFilter = 'today' | 'weekly' | 'monthly' | 'yearly';
type CategoryFilter = 'all' | 'veg' | 'non-veg' | 'extra';

const CATEGORY_CONFIG = {
  veg:       { label: 'Veg',  color: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-600', icon: '🌿' },
  'non-veg': { label: 'Non-Veg',   color: '#ef4444', bg: 'bg-rose-50',    text: 'text-rose-600',    icon: '🍗' },
  extra:     { label: 'Extras',    color: '#3b82f6', bg: 'bg-blue-50',   text: 'text-blue-600',   icon: '⭐' },
};

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKS = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function SalesDashboard() {
  const { orders } = useRestaurant();
  const [timeFilter, setTimeFilter]         = useState<TimeFilter>('today');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [chartType, setChartType]           = useState<'area' | 'bar'>('bar');
  const [subFilter, setSubFilter]           = useState<string>('all');

  const handleTimeFilterChange = (val: TimeFilter) => {
    setTimeFilter(val);
    setSubFilter('all');
  };

  const filteredByTime = useMemo(() => {
    const now = new Date();
    return orders.filter(o => {
      if (o.status !== 'served') return false;
      const t = new Date(o.timestamp);
      
      let inRange = false;
      if (timeFilter === 'today')   inRange = t.toDateString() === now.toDateString();
      else if (timeFilter === 'weekly')  { const w = new Date(now); w.setDate(now.getDate() - 7); inRange = t >= w; }
      else if (timeFilter === 'monthly') inRange = t.getMonth() === now.getMonth() && t.getFullYear() === now.getFullYear();
      else inRange = t.getFullYear() === now.getFullYear();

      if (!inRange) return false;
      if (subFilter === 'all') return true;

      if (timeFilter === 'today')   return DAYS[t.getDay()] === subFilter;
      if (timeFilter === 'weekly')  return WEEKS[Math.min(Math.floor((t.getDate() - 1) / 7), 3)] === subFilter;
      if (timeFilter === 'monthly') return MONTHS[t.getMonth()] === subFilter;
      if (timeFilter === 'yearly')  return t.getFullYear().toString() === subFilter;

      return true;
    });
  }, [orders, timeFilter, subFilter]);

  const filteredOrders = useMemo(() => {
    if (categoryFilter === 'all') return filteredByTime;
    return filteredByTime
      .map(o => ({ ...o, items: o.items.filter(i => i.menuItem.category === categoryFilter) }))
      .filter(o => o.items.length > 0);
  }, [filteredByTime, categoryFilter]);

  const totalRevenue = filteredOrders.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.menuItem.price * i.quantity, 0), 0);
  const totalOrders  = filteredOrders.length;
  const totalItems   = filteredOrders.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.quantity, 0), 0);

  const catStats = useMemo(() => {
    const s = { veg: 0, 'non-veg': 0, extra: 0 };
    filteredByTime.forEach(o => o.items.forEach(i => { s[i.menuItem.category] += i.menuItem.price * i.quantity; }));
    return s;
  }, [filteredByTime]);
  const totalCatRev = (catStats.veg + catStats['non-veg'] + catStats.extra) || 1;

  const topItems = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number; category: string }> = {};
    filteredOrders.forEach(o => o.items.forEach(i => {
      if (!map[i.menuItem.id]) map[i.menuItem.id] = { name: i.menuItem.name, qty: 0, revenue: 0, category: i.menuItem.category };
      map[i.menuItem.id].qty += i.quantity;
      map[i.menuItem.id].revenue += i.menuItem.price * i.quantity;
    }));
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 6);
  }, [filteredOrders]);

  const chartData = useMemo(() => {
    const getVal = (o: any) => o.items.reduce((s: number, i: any) => s + i.menuItem.price * i.quantity, 0);
    if (timeFilter === 'today') {
      const h = Array.from({ length: 14 }, (_, i) => ({ name: `${i + 9}:00`, value: 0 }));
      filteredOrders.forEach(o => { 
        const hr = new Date(o.timestamp).getHours(); 
        if (hr >= 9 && hr <= 22) h[hr - 9].value += getVal(o); 
      });
      return h;
    }
    if (timeFilter === 'weekly') {
      const d = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(l => ({ name: l, value: 0 }));
      filteredOrders.forEach(o => { d[new Date(o.timestamp).getDay()].value += getVal(o); });
      return d;
    }
    if (timeFilter === 'monthly') {
      const w = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'].map(l => ({ name: l, value: 0 }));
      filteredOrders.forEach(o => { w[Math.min(Math.floor((new Date(o.timestamp).getDate() - 1) / 7), 3)].value += getVal(o); });
      return w;
    }
    const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(l => ({ name: l, value: 0 }));
    filteredOrders.forEach(o => { m[new Date(o.timestamp).getMonth()].value += getVal(o); });
    return m;
  }, [filteredOrders, timeFilter]);

  const handleExport = () => {
    if (filteredOrders.length === 0) return;
    
    // Updated headers for professional alignment
    const headers = ['Date', 'Time', 'Table', 'Category', 'Item', 'Quantity', 'Per Unit', 'Total'];
    
    const rows = filteredOrders.flatMap(o => {
      // Create a date object safely
      const d = o.timestamp instanceof Date ? o.timestamp : new Date(o.timestamp);
      
      let dateStr = "N/A";
      let timeStr = "N/A";
      
      if (!isNaN(d.getTime())) {
        // YYYY/MM/DD and HH:MM:SS - very standard 
        dateStr = d.toLocaleDateString();
        timeStr = d.toLocaleTimeString();
      }

      return o.items.map(i => [
        dateStr,
        timeStr,
        `Table ${o.tableNumber}`,
        i.menuItem.category,
        i.menuItem.name,
        i.quantity,
        i.menuItem.price,
        i.menuItem.price * i.quantity
      ]);
    });

    // Byte Order Mark (BOM) for Excel
    const BOM = '\uFEFF';
    const csvContent = BOM + [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const dateStrFile = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
    link.setAttribute("download", `Admin_Report_${dateStrFile}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-['Outfit'] selection:bg-emerald-500/10 transition-colors duration-500">
      
      {/* ── TOP PREMIUM NAV ── */}
      <nav className="sticky top-0 z-[100] bg-white/70 backdrop-blur-2xl border-b border-slate-200/60 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/manager" className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 transition-all border border-slate-200">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="h-10 w-px bg-slate-200/80 my-auto" />
            <div>
              <div className="flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-emerald-600" />
                <h1 className="text-xl font-black text-slate-800 tracking-tight">Admin Dashboard</h1>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">Commercial Intelligence Suite</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-black text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-slate-200"
            >
              <Download className="w-3.5 h-3.5" />
              Export Report
            </button>
            <div className="w-10 h-10 rounded-full bg-emerald-500 border-2 border-white shadow-md flex items-center justify-center text-white font-black text-xs cursor-pointer hover:scale-105 transition-transform">
              HR
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1440px] mx-auto p-6 space-y-8 pb-20">
        
        {/* ── FILTER ARCHITECTURE ── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
            <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
              {(['today','weekly','monthly','yearly'] as TimeFilter[]).map(t => (
                <button
                  key={t}
                  onClick={() => handleTimeFilterChange(t)}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    timeFilter === t ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
              <Filter className="w-3.5 h-3.5 text-slate-300 mx-3 my-auto" />
              <select
                value={subFilter}
                onChange={(e) => setSubFilter(e.target.value)}
                className="pr-8 py-2.5 bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">All Sub-periods</option>
                {timeFilter === 'today' && DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                {timeFilter === 'weekly' && WEEKS.map(w => <option key={w} value={w}>{w}</option>)}
                {timeFilter === 'monthly' && MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                {timeFilter === 'yearly' && [new Date().getFullYear().toString()].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
            {(['all','veg','non-veg','extra'] as CategoryFilter[]).map(cat => {
              const active = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                    active ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {cat === 'all' && <Layers className="w-3 h-3" />}
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── KPI GRID ── */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Net Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: <IndianRupee/>, color: 'emerald', change: '+24%', desc: 'After all deductions' },
            { label: 'Volume Sold', value: totalOrders, icon: <ShoppingBag/>, color: 'blue', change: '+12%', desc: 'Total successful orders' },
            { label: 'Inventory Throughput', value: totalItems, icon: <Activity/>, color: 'violet', change: '+18%', desc: 'Units moved from storage' },
          ].map((kpi, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              key={kpi.label}
              className="bg-white p-8 rounded-[32px] border border-slate-200/60 shadow-xl shadow-slate-200/40 relative overflow-hidden group"
            >
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-slate-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12 duration-500 ${
                    kpi.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 
                    kpi.color === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-violet-50 text-violet-600'
                  }`}>
                    {kpi.icon}
                  </div>
                  <div className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">
                    {kpi.change}
                  </div>
                </div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-1.5">{kpi.label}</h3>
                <p className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{kpi.value}</p>
                <p className="text-[10px] text-slate-400 font-bold mt-4 opacity-0 group-hover:opacity-100 transition-opacity">{kpi.desc}</p>
              </div>
            </motion.div>
          ))}
        </section>

        {/* ── CENTRAL ANALYTICS HUB ── */}
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Main Chart Container */}
          <section className="lg:col-span-2 bg-white rounded-[32px] border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  Revenue Performance
                </h3>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button onClick={() => setChartType('area')} className={`p-2 rounded-lg transition-all ${chartType === 'area' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400'}`}><TrendingUp className="w-4 h-4" /></button>
                <button onClick={() => setChartType('bar')} className={`p-2 rounded-lg transition-all ${chartType === 'bar' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400'}`}><BarChart3 className="w-4 h-4" /></button>
              </div>
            </div>
            
            <div className="p-8 h-[400px] w-full relative overflow-x-auto no-scrollbar scroll-smooth">
              <div style={{ minWidth: timeFilter === 'today' ? '1200px' : '100%' }} className="h-full">
                {totalRevenue > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'area' ? (
                      <AreaChart data={chartData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                        <defs><linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} padding={{left: 20, right: 20}} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 900, background: '#fff' }} formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Revenue']} />
                        <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={5} fillOpacity={1} fill="url(#colorRev)" animationDuration={2000} dot={{ r: 5, fill: '#10b981', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 0 }} />
                      </AreaChart>
                    ) : (
                      <BarChart data={chartData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} padding={{left: 10, right: 10}} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                        <Tooltip cursor={{ fill: '#F8FAFB' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 900 }} formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Revenue']} />
                        <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={32}>
                          {chartData.map((_entry, index) => <Cell key={`cell-${index}`} fill={index === chartData.length -1 ? '#059669' : '#10b981'} />)}
                        </Bar>
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center space-y-4">
                    <div className="w-20 h-20 bg-slate-50 flex items-center justify-center rounded-3xl"><BarChart3 className="w-10 h-10 text-slate-200" /></div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Operational Silence</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Categorical Intelligence */}
          <section className="bg-white rounded-[32px] border border-slate-200/60 shadow-xl shadow-slate-200/40 p-8 flex flex-col h-full">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] mb-10 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-500" />
              Segmentation
            </h3>
            <div className="flex-1 flex flex-col justify-center space-y-8">
              {Object.entries(catStats).map(([cat, rev]) => {
                const cfg = CATEGORY_CONFIG[cat as keyof typeof catStats];
                const pct = Math.round((rev / totalCatRev) * 100);
                return (
                  <div key={cat} className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${cfg.bg} ${cfg.text} flex items-center justify-center rounded-xl text-lg shadow-sm border border-slate-100`}>{cfg.icon}</div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cfg.label}</p>
                          <p className="text-sm font-black text-slate-800">₹{rev.toLocaleString()}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-slate-800 bg-slate-100 px-2 py-1 rounded-lg">{pct}%</span>
                    </div>
                    <div className="h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100/50">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: 'easeOut' }} className="h-full rounded-full" style={{ background: cfg.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* ── TOP PERFORMING ASSETS ── */}
        <section className="bg-white rounded-[32px] border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2">
              <Star className="w-4 h-4 text-emerald-500 fill-emerald-500" />
              Top Asset Performance
            </h3>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-lg">High performing</span>
          </div>
          <div className="divide-y divide-slate-100">
            {topItems.length > 0 ? (
              <div className="flex flex-col divide-y divide-slate-50">
                {topItems.map((item, i) => (
                  <div key={i} className="p-8 flex items-center justify-between hover:bg-slate-50/50 transition-all group">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-white border border-slate-200 flex items-center justify-center rounded-2xl text-[10px] font-black text-slate-800 shadow-sm group-hover:scale-110 transition-transform">
                        #{i+1}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{item.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                          {item.category} • {item.qty} Sales
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-emerald-600 tracking-tight leading-none">₹{item.revenue.toLocaleString()}</p>
                      <div className="w-24 h-1 bg-slate-100 rounded-full mt-3 overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(item.revenue / (topItems[0].revenue || 1)) * 100}%` }} className="h-full bg-emerald-500" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-24 text-center">
                <Package className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">No Assets to Display</p>
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
