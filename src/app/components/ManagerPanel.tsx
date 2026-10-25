import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, DollarSign, Printer, X, Plus, TrendingUp, Users, ShoppingBag, User, Lock } from 'lucide-react';
import { useRestaurant, OrderItem, MenuItem } from '../context/RestaurantContext';
import { toast } from 'sonner';

export function ManagerPanel() {
  const navigate = useNavigate();
  const { tables, menuItems, addItemsToTable, generateBill, resetTable } = useRestaurant();
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [showAddItems, setShowAddItems] = useState(false);
  const [additionalItems, setAdditionalItems] = useState<OrderItem[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  const allTableNumbers = Array.from({ length: 12 }, (_, i) => i + 1);
  const activeTables = tables.filter(t => t.status === 'active');
  const emptyTables = allTableNumbers.filter(
    num => !activeTables.some(t => t.tableNumber === num)
  );

  const currentTable = selectedTable
    ? tables.find(t => t.tableNumber === selectedTable && t.status === 'active')
    : null;

  const addExtraItem = (menuItem: MenuItem) => {
    setAdditionalItems(prev => {
      const existing = prev.find(item => item.menuItem.id === menuItem.id);
      if (existing) {
        return prev.map(item =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { menuItem, quantity: 1, portionSize: 'full' as const }];
    });
  };

  const handleAddItemsToTable = () => {
    if (!selectedTable || additionalItems.length === 0) return;

    addItemsToTable(selectedTable, additionalItems);
    setAdditionalItems([]);
    setShowAddItems(false);
    toast.success('Items added to bill');
  };

  const handlePrintBill = () => {
    if (!currentTable) return;

    const tableNum = currentTable.tableNumber;
    // Generate bill
    generateBill(tableNum);

    // Print
    const printWindow = window.open('', '', 'width=300,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Bill - Table ${currentTable.tableNumber}</title>
          <style>
            body {
              font-family: monospace;
              padding: 20px;
              max-width: 300px;
            }
            h1 {
              text-align: center;
              border-bottom: 2px dashed #000;
              padding-bottom: 10px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .item {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
            }
            .total {
              border-top: 2px dashed #000;
              margin-top: 10px;
              padding-top: 10px;
              font-weight: bold;
              font-size: 1.2em;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              border-top: 2px dashed #000;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Smart Dining</h1>
            <p>Restaurant Bill</p>
            <p>Table: ${currentTable.tableNumber}</p>
            <p>Date: ${new Date().toLocaleDateString()}</p>
            <p>Time: ${new Date().toLocaleTimeString()}</p>
          </div>
          
          <div class="items">
            ${currentTable.items
          .map(
            item => `
              <div class="item">
                <span>${item.menuItem.name} x ${item.quantity}</span>
                <span>₹${(item.portionSize === 'half' ? item.menuItem.halfPrice : item.menuItem.fullPrice) * item.quantity}</span>
              </div>
            `
          )
          .join('')}
          </div>
          
          <div class="total">
            <div class="item">
              <span>TOTAL:</span>
              <span>₹${currentTable.total}</span>
            </div>
          </div>
          
          <div class="footer">
            <p>Thank you for dining with us!</p>
            <p>Visit us again</p>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }

    toast.success('Bill printed successfully');

    // Reset table after short delay using local variable
    setTimeout(() => {
      resetTable(tableNum);
      setSelectedTable(null);
      toast.info(`Table ${tableNum} is now available`);
    }, 1000);
  };

  const handlePaid = () => {
    if (!currentTable) return;

    const tableNum = currentTable.tableNumber;
    generateBill(tableNum);
    resetTable(tableNum);
    setSelectedTable(null);
    toast.success(`Table ${tableNum} payment received! Table is now available`);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Manager@1234') {
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
              <div className="bg-emerald-500/20 backdrop-blur-sm rounded-full p-6 mb-4">
                <Lock className="w-12 h-12 text-emerald-500" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Manager Panel</h1>
              <p className="text-slate-400">Enter password to access</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-medium focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-slate-600"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-emerald-500/20"
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
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:bg-white/20 rounded-lg p-2 transition">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-2xl font-bold">Manager Panel - Billing & Admin</h1>
          </div>
          <Link
            to="/manager/sales"
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-full font-bold transition-all group"
          >
            <User className="w-4 h-4" />
            <span>Login</span>
            <span className="text-white/60 group-hover:translate-x-1 transition-transform text-sm">→</span>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Tables Overview */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-2xl p-6 shadow-xl sticky top-6 space-y-5">

              <h2 className="text-base font-black text-white uppercase tracking-widest">Tables Status</h2>

              {/* Active Table Status Cards */}
              {activeTables.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    Occupied ({activeTables.length})
                  </p>
                  <div className="space-y-2">
                    {activeTables.map(table => (
                      <button
                        key={table.tableNumber}
                        onClick={() => setSelectedTable(table.tableNumber)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all border ${selectedTable === table.tableNumber
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-white shadow-lg shadow-emerald-500/10'
                          : 'bg-slate-700/50 border-slate-600/30 text-slate-300 hover:bg-slate-700 hover:border-slate-500'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${selectedTable === table.tableNumber ? 'bg-emerald-500 text-white' : 'bg-slate-600 text-slate-300'
                            }`}>
                            {table.tableNumber}
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-black uppercase tracking-tight">Table {table.tableNumber}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <ShoppingBag className="w-2.5 h-2.5 text-slate-500" />
                              <span className="text-[10px] text-slate-500">{table.items.reduce((s, i) => s + i.quantity, 0)} items</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-emerald-400">₹{table.total}</p>
                          <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-0.5">Total</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-700">
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs text-slate-500">{activeTables.length} of 12 occupied</span>
                </div>
              </div>

            </div>

          </div>

          {/* Bill Details */}
          <div className="lg:col-span-2">
            {currentTable ? (
              <div className="bg-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    Table {currentTable.tableNumber} - Bill
                  </h2>
                  <button
                    onClick={() => setSelectedTable(null)}
                    className="p-2 hover:bg-slate-700 rounded-lg transition"
                  >
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>

                {/* Bill Items */}
                <div className="bg-slate-700 rounded-xl p-6 mb-6">
                  <div className="space-y-4 mb-4">
                    {currentTable.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between pb-4 border-b border-slate-600 last:border-0 last:pb-0"
                      >
                        <div>
                          <p className="font-semibold text-white">{item.menuItem.name}</p>
                          <p className="text-sm text-slate-400">
                            ₹{item.portionSize === 'half' ? item.menuItem.halfPrice : item.menuItem.fullPrice} × {item.quantity}
                          </p>
                        </div>
                        <p className="text-lg font-bold text-white">
                          ₹{(item.portionSize === 'half' ? item.menuItem.halfPrice : item.menuItem.fullPrice) * item.quantity}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t-2 border-slate-600 pt-4 mt-4">
                    <div className="flex items-center justify-between text-2xl font-bold text-white">
                      <span>TOTAL:</span>
                      <span className="text-emerald-400">₹{currentTable.total}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setShowAddItems(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold transition flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Items
                  </button>
                  <button
                    onClick={handlePrintBill}
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-4 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-500/50"
                  >
                    <Printer className="w-5 h-5" />
                    Print & Close
                  </button>
                  <button
                    onClick={handlePaid}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-4 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/50"
                  >
                    <DollarSign className="w-5 h-5" />
                    Paid
                  </button>
                </div>

                {/* Add Items Modal */}
                {showAddItems && (
                  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
                    <div className="bg-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-white">Add Extra Items</h3>
                        <button
                          onClick={() => {
                            setShowAddItems(false);
                            setAdditionalItems([]);
                          }}
                          className="p-2 hover:bg-slate-700 rounded-lg transition"
                        >
                          <X className="w-6 h-6 text-slate-400" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        {menuItems.map(item => (
                          <button
                            key={item.id}
                            onClick={() => addExtraItem(item)}
                            className="bg-slate-700 hover:bg-slate-600 rounded-xl p-4 text-left transition"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <p className="font-semibold text-white">{item.name}</p>
                              {item.category === 'veg' ? (
                                <div className="w-4 h-4 border-2 border-green-500 flex items-center justify-center flex-shrink-0">
                                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                </div>
                              ) : (
                                <div className="w-4 h-4 border-2 border-red-500 flex items-center justify-center flex-shrink-0">
                                  <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                </div>
                              )}
                            </div>
                            <p className="text-blue-400 font-bold">₹{item.fullPrice}</p>
                          </button>
                        ))}
                      </div>

                      {additionalItems.length > 0 && (
                        <div className="bg-slate-700 rounded-xl p-4 mb-4">
                          <h4 className="font-bold text-white mb-3">Selected Items:</h4>
                          <div className="space-y-2">
                            {additionalItems.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between text-white">
                                <span>{item.menuItem.name}</span>
                                <span className="font-bold">x{item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={handleAddItemsToTable}
                        disabled={additionalItems.length === 0}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold transition"
                      >
                        Add to Bill
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-800 rounded-2xl p-12 shadow-xl text-center">
                <div className="bg-slate-700 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6">
                  <DollarSign className="w-16 h-16 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Select a Table</h3>
                <p className="text-slate-400">
                  Choose an occupied table from the left to view and manage its bill
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
