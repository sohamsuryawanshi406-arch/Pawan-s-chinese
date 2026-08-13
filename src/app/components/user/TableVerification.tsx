import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Table codes provided by user:
 * 1-AST1102, 2-AST1112, 3-AST1122, 4-AST1117, 5-AST1162, 
 * 6-AST1135, 7-AST1167, 8-AST1118, 9-AST1137
 */
const TABLE_CODES: Record<string, string> = {
  'AST1102': '1',
  'AST1112': '2',
  'AST1122': '3',
  'AST1117': '4',
  'AST1162': '5',
  'AST1135': '6',
  'AST1167': '7',
  'AST1118': '8',
  'AST1137': '9'
};

export function TableVerification() {
  const [code, setCode] = useState('');
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tableNum = TABLE_CODES[code.toUpperCase().trim()];
    if (tableNum) {
      toast.success('Access Granted! Welcome back.');
      navigate(`/user/${tableNum}`, { replace: true });
    } else {
      setIsError(true);
      toast.error('Invalid Table Code.');
      setTimeout(() => setIsError(false), 600);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden bg-slate-100 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* ── Background: Subtle & Immersive ── */}
      <div className="absolute inset-0 z-0">
        <motion.img 
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 8, ease: "easeOut" }}
          src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=2070"
          alt="Lobby Area"
          className="w-full h-full object-cover opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
      </div>

      {/* ── Perfectly Square Portal ── */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[320px] aspect-square bg-white/5 backdrop-blur-[30px] shadow-[0_40px_100px_rgba(0,0,0,0.25)] flex flex-col items-center justify-between p-10 overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-600" />

        {/* Brand Identity */}
        <div className="flex flex-col items-center mt-2">
            <motion.div 
               whileHover={{ rotate: 180 }}
               transition={{ duration: 0.6 }}
               className="bg-slate-900 p-2 mb-4 shadow-lg"
            >
               <ChefHat className="w-5 h-5 text-white" />
            </motion.div>
            <h1 className="text-slate-900 text-xl font-black tracking-[0.25em] leading-none text-center">
              HOTEL ROYAL
            </h1>
        </div>

        {/* Verification Core */}
        <form onSubmit={handleSubmit} className="w-full space-y-6 flex flex-col items-center">
          <div className="w-full text-center space-y-3">
            <h2 className="text-slate-400 text-[10px] font-medium leading-relaxed px-4 pt-4">
              Please Enter Your Table Code to Open Digital Menu Card
            </h2>
            <div className="relative group w-full max-w-[180px] mx-auto">
               <input
                 type="text"
                 value={code}
                 autoFocus
                 onChange={(e) => {
                    const filtered = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
                    setCode(filtered);
                 }}
                 placeholder="CODE"
                 className={`w-full bg-slate-50 border-b-2 px-2 py-3 font-medium text-center text-lg tracking-[0.4em] outline-none transition-all placeholder:tracking-[0.1em] placeholder:opacity-20 text-slate-900 ${
                   isError ? 'shake border-rose-500 text-rose-600 bg-rose-50' : 'border-slate-100 focus:border-emerald-600 focus:bg-white'
                 }`}
                 required
               />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02, backgroundColor: "#065f46" }}
            whileTap={{ scale: 0.98 }}
            className="w-full max-w-[150px] py-3 bg-emerald-600 text-white font-black uppercase tracking-[0.3em] text-[10px] rounded-full shadow-lg shadow-emerald-600/20 transition-all"
          >
            Authenticate
          </motion.button>
        </form>

        {/* Footer Editorial Removed */}
        <div className="text-center w-full min-h-[1px]" />
      </motion.div>

      {/* Shake Animation */}
      <style>{`
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
        .shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
      `}</style>
    </div>
  );
}
