import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, DollarSign, Printer, X, Plus, TrendingUp, Users, ShoppingBag, User, MessageCircle, CheckCircle, Image } from 'lucide-react';
import { useRestaurant, OrderItem, MenuItem } from '../context/RestaurantContext';
import { toast } from 'sonner';

export function ManagerPanel() {
  const { tables, menuItems, addItemsToTable, generateBill, resetTable } = useRestaurant();
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [showAddItems, setShowAddItems] = useState(false);
  const [additionalItems, setAdditionalItems] = useState<OrderItem[]>([]);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappStatus, setWhatsappStatus] = useState<'idle' | 'confirm' | 'generating' | 'sending' | 'success'>('idle');

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
      return [...prev, { menuItem, quantity: 1 }];
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
            <h1>DineFlow Pro</h1>
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
                <span>₹${item.menuItem.price * item.quantity}</span>
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

  const handleInitiateWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTable || !whatsappNumber.trim()) return;
    setWhatsappStatus('confirm');
  };

  const handleSendWhatsAppFree = async () => {
    if (!currentTable || !whatsappNumber.trim()) return;
    const tableNum = currentTable.tableNumber;
    setWhatsappStatus('sending');

    try {
      // 1. Generate receipt on Canvas (Professional POS thermal style)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      const width = 450;
      const itemHeight = 35;
      const headerHeight = 220; 
      const summaryHeight = 130; 
      const qrHeight = 160; 
      const footerHeight = 120;
      const height = headerHeight + (currentTable.items.length * itemHeight) + summaryHeight + qrHeight + footerHeight;

      canvas.width = width;
      canvas.height = height;

      // Draw background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Draw elegant outer border
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 6;
      ctx.strokeRect(8, 8, width - 16, height - 16);

      // --- HEADER SECTION ---
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText('HOTEL ROYAL', width / 2, 55);

      ctx.fillStyle = '#475569';
      ctx.font = 'normal 13px monospace';
      ctx.fillText('123 Gourmet Street, Food Plaza, Mumbai', width / 2, 80);
      ctx.fillText('Tel: +91 98765 43210  |  GSTIN: 27AAAAA1111A1Z1', width / 2, 98);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 15px monospace';
      ctx.fillText(`BILL NO: #HR-${Date.now().toString().slice(-6)}`, width / 2, 130);

      // Metadata line
      ctx.fillStyle = '#334155';
      ctx.font = 'normal 13px monospace';
      ctx.fillText(`Table Number: ${currentTable.tableNumber}   |   Date: ${new Date().toLocaleDateString()}`, width / 2, 155);
      ctx.fillText(`Time: ${new Date().toLocaleTimeString()}   |   Staff: Manager`, width / 2, 175);

      // Dashed separator
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(25, 195);
      ctx.lineTo(width - 25, 195);
      ctx.stroke();

      // --- ITEMS TABLE HEADER ---
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('QTY  ITEM', 30, 215);
      ctx.textAlign = 'right';
      ctx.fillText('RATE  TOTAL', width - 30, 215);

      ctx.beginPath();
      ctx.moveTo(25, 225);
      ctx.lineTo(width - 25, 225);
      ctx.stroke();

      // --- DRAW ITEMS ---
      let currentY = 255;
      ctx.font = 'normal 13px monospace';
      ctx.fillStyle = '#1e293b';

      currentTable.items.forEach(item => {
        ctx.textAlign = 'left';
        ctx.fillText(`${item.quantity.toString().padStart(2, '0')}   ${item.menuItem.name}`, 30, currentY);
        
        ctx.textAlign = 'right';
        ctx.fillText(`₹${item.menuItem.price}  ₹${item.menuItem.price * item.quantity}`, width - 30, currentY);
        
        currentY += itemHeight;
      });

      // Separator before totals
      ctx.beginPath();
      ctx.moveTo(25, currentY - 15);
      ctx.lineTo(width - 25, currentY - 15);
      ctx.stroke();

      // --- FINANCIAL SUMMARY ---
      ctx.font = 'normal 13px monospace';
      ctx.fillStyle = '#475569';
      
      const subtotal = currentTable.total;
      const cgst = subtotal * 0.025; 
      const sgst = subtotal * 0.025; 
      const grandTotal = Math.round(subtotal + cgst + sgst);

      // Subtotal
      ctx.textAlign = 'left';
      ctx.fillText('Subtotal:', 40, currentY + 10);
      ctx.textAlign = 'right';
      ctx.fillText(`₹${subtotal.toFixed(2)}`, width - 40, currentY + 10);

      // CGST
      ctx.textAlign = 'left';
      ctx.fillText('CGST @ 2.5%:', 40, currentY + 30);
      ctx.textAlign = 'right';
      ctx.fillText(`₹${cgst.toFixed(2)}`, width - 40, currentY + 30);

      // SGST
      ctx.textAlign = 'left';
      ctx.fillText('SGST @ 2.5%:', 40, currentY + 50);
      ctx.textAlign = 'right';
      ctx.fillText(`₹${sgst.toFixed(2)}`, width - 40, currentY + 50);

      // Grand Total
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('GRAND TOTAL:', 40, currentY + 80);
      ctx.textAlign = 'right';
      ctx.fillText(`₹${grandTotal.toFixed(2)}`, width - 40, currentY + 80);

      // Separator before QR code
      ctx.beginPath();
      ctx.moveTo(25, currentY + 105);
      ctx.lineTo(width - 25, currentY + 105);
      ctx.stroke();

      // --- UPI QR CODE MOCKUP ---
      const qrY = currentY + 120;
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(width / 2 - 50, qrY, 100, 100);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.strokeRect(width / 2 - 50, qrY, 100, 100);

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(width / 2 - 45, qrY + 5, 20, 20);
      ctx.fillRect(width / 2 + 25, qrY + 5, 20, 20);
      ctx.fillRect(width / 2 - 45, qrY + 75, 20, 20);
      ctx.fillRect(width / 2 - 15, qrY + 15, 10, 10);
      ctx.fillRect(width / 2 + 5, qrY + 35, 15, 15);
      ctx.fillRect(width / 2 - 25, qrY + 45, 20, 10);
      ctx.fillRect(width / 2 + 10, qrY + 65, 10, 20);
      ctx.fillRect(width / 2 - 20, qrY + 75, 10, 10);

      ctx.fillStyle = '#475569';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SCAN TO PAY VIA UPI', width / 2, qrY + 115);

      // Separator before footer message
      ctx.beginPath();
      ctx.moveTo(25, qrY + 130);
      ctx.lineTo(width - 25, qrY + 130);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = 'italic 12px sans-serif';
      ctx.fillText('Thank you for dining with us!', width / 2, qrY + 155);
      ctx.font = 'normal 10px monospace';
      ctx.fillText('Powered by DineFlow Pro POS', width / 2, qrY + 175);

      // 2. Convert Canvas to Blob and upload to free CDN
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Failed to create bill image blob');

      toast.loading('Hosting bill image on temporary secure CDN...', { id: 'whatsapp-upload' });
      
      const formData = new FormData();
      formData.append('file', blob, `bill_table_${tableNum}.png`);

      const uploadRes = await fetch('https://tmpfiles.org/api/v1/upload', {
        method: 'POST',
        body: formData
      });
      const uploadJson = await uploadRes.json();
      
      if (!uploadJson.data || !uploadJson.data.url) {
        throw new Error('CDN Upload failed');
      }

      const directImageUrl = uploadJson.data.url.replace('https://tmpfiles.org/', 'https://tmpfiles.org/dl/');
      toast.success('Hosted successfully! Opening WhatsApp...', { id: 'whatsapp-upload' });

      // 3. Construct WhatsApp text with receipt link
      let messageText = `*HOTEL ROYAL - Bill Receipt*\n`;
      messageText += `---------------------------\n`;
      messageText += `*Table:* ${currentTable.tableNumber}\n`;
      messageText += `*Date:* ${new Date().toLocaleDateString()}\n`;
      messageText += `*Total Amount:* ₹${grandTotal}\n\n`;
      messageText += `*View/Download Bill Image:* ${directImageUrl}\n`;
      messageText += `---------------------------\n`;
      messageText += `Thank you for dining with us! Visit again. 😊`;

      const encodedText = encodeURIComponent(messageText);
      const whatsappUrl = `https://api.whatsapp.com/send?phone=91${whatsappNumber}&text=${encodedText}`;

      // Open WhatsApp Web/App in a new tab
      window.open(whatsappUrl, '_blank');

      // Step 4: Show success confirmation popup and clear table
      setWhatsappStatus('success');
      generateBill(tableNum);
      toast.success('Bill image link sent on WhatsApp successfully!');

      setTimeout(() => {
        resetTable(tableNum);
        setSelectedTable(null);
        setShowWhatsAppModal(false);
        setWhatsappStatus('idle');
        setWhatsappNumber('');
        toast.info(`Table ${tableNum} is now available`);
      }, 2000);

    } catch (err: any) {
      console.error(err);
      toast.dismiss('whatsapp-upload');
      toast.error(`WhatsApp Send Failed: ${err.message || err}`);
      setWhatsappStatus('idle');
    }
  };

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

              {/* Available Tables */}
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">
                  Available ({emptyTables.length})
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {emptyTables.map(tableNum => (
                    <div
                      key={tableNum}
                      className="aspect-square rounded-lg font-bold text-sm bg-slate-700/40 text-slate-600 flex items-center justify-center border border-slate-700/40"
                    >
                      {tableNum}
                    </div>
                  ))}
                </div>
              </div>

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
                            ₹{item.menuItem.price} × {item.quantity}
                          </p>
                        </div>
                        <p className="text-lg font-bold text-white">
                          ₹{item.menuItem.price * item.quantity}
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
                    onClick={() => {
                      setWhatsappStatus('idle');
                      setWhatsappNumber('');
                      setShowWhatsAppModal(true);
                    }}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg hover:shadow-green-500/50"
                  >
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp Bill
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
                            <p className="text-blue-400 font-bold">₹{item.price}</p>
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

                {/* WhatsApp Bill Modal */}
                {showWhatsAppModal && (
                  <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-6">
                    <div className={`bg-slate-800 border border-slate-700 rounded-2xl p-8 w-full shadow-2xl relative overflow-hidden transition-all ${whatsappStatus === 'confirm' ? 'max-w-lg' : 'max-w-md'
                      }`}>
                      {whatsappStatus !== 'success' && whatsappStatus !== 'generating' && whatsappStatus !== 'sending' && (
                        <button
                          onClick={() => setShowWhatsAppModal(false)}
                          className="absolute top-4 right-4 p-2 hover:bg-slate-700 rounded-lg transition"
                        >
                          <X className="w-5 h-5 text-slate-400" />
                        </button>
                      )}

                      {whatsappStatus === 'idle' && (
                        <form onSubmit={handleInitiateWhatsApp} className="space-y-6">
                          <div className="text-center space-y-2">
                            <div className="bg-green-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
                              <MessageCircle className="w-8 h-8 text-green-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-white">Send Bill on WhatsApp</h3>
                            <p className="text-sm text-slate-400">
                              Table {currentTable.tableNumber} • Total Amount: ₹{currentTable.total}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                              WhatsApp Number
                            </label>
                            <input
                              type="tel"
                              value={whatsappNumber}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                setWhatsappNumber(val);
                              }}
                              placeholder="Enter 10-digit number"
                              pattern="[0-9]{10}"
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3.5 text-white font-medium text-center text-lg tracking-wider focus:border-green-500 focus:outline-none transition-colors placeholder:text-slate-600"
                              required
                              autoFocus
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
                          >
                            <MessageCircle className="w-5 h-5" />
                            Send Digital Bill
                          </button>
                        </form>
                      )}

                      {whatsappStatus === 'confirm' && (
                        <div className="space-y-6">
                          <div className="text-center space-y-2">
                            <h3 className="text-xl font-bold text-white">Confirm Bill Image Details</h3>
                            <p className="text-sm text-slate-400">
                              Sending to: <span className="text-green-400 font-bold">+91 {whatsappNumber}</span>
                            </p>
                          </div>

                          {/* Image Format Receipt Preview */}
                          <div className="bg-white text-slate-800 p-6 rounded-xl shadow-inner font-mono text-xs max-h-60 overflow-y-auto border-4 border-slate-300 relative">
                            {/* Visual Indicator of Image/Card */}
                            <div className="absolute top-2 right-2 bg-slate-100 text-slate-600 text-[9px] px-2 py-0.5 rounded font-sans font-bold flex items-center gap-1 border border-slate-200">
                              <Image className="w-2.5 h-2.5" />
                              JPEG Image Preview
                            </div>

                            <div className="text-center border-b border-dashed border-slate-300 pb-3 mb-3">
                              <h4 className="font-bold text-sm uppercase">Hotel Royal</h4>
                              <p className="text-[10px] text-slate-500">Bill Receipt Card</p>
                              <p className="text-[9px] text-slate-400 mt-1">
                                Table {currentTable.tableNumber} • {new Date().toLocaleDateString()}
                              </p>
                            </div>

                            <div className="space-y-1">
                              {currentTable.items.map((item, index) => (
                                <div key={index} className="flex justify-between">
                                  <span>{item.menuItem.name} x{item.quantity}</span>
                                  <span>₹{item.menuItem.price * item.quantity}</span>
                                </div>
                              ))}
                            </div>

                            <div className="border-t border-dashed border-slate-300 pt-3 mt-3 flex justify-between font-bold text-sm">
                              <span>TOTAL:</span>
                              <span>₹{currentTable.total}</span>
                            </div>

                            <div className="text-center text-[10px] text-slate-400 mt-4 border-t pt-2">
                              Thank you for dining with us!
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <button
                              onClick={() => setWhatsappStatus('idle')}
                              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3.5 rounded-xl font-bold transition-all"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSendWhatsAppFree}
                              className="flex-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
                            >
                              <MessageCircle className="w-4 h-4" />
                              Confirm & Send Bill
                            </button>
                          </div>
                        </div>
                      )}

                      {whatsappStatus === 'sending' && (
                        <div className="py-12 flex flex-col items-center justify-center space-y-6">
                          <div className="relative">
                            <div className="w-16 h-16 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin"></div>
                            <MessageCircle className="w-6 h-6 text-green-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                          </div>
                          <div className="text-center space-y-2">
                            <h4 className="text-xl font-bold text-white">Opening WhatsApp...</h4>
                            <p className="text-sm text-slate-400">Redirecting to chat with bill content</p>
                          </div>
                        </div>
                      )}

                      {whatsappStatus === 'success' && (
                        <div className="py-8 flex flex-col items-center justify-center space-y-6">
                          <div className="bg-emerald-500/10 p-4 rounded-full border border-emerald-500/20 animate-bounce">
                            <CheckCircle className="w-16 h-16 text-emerald-500" />
                          </div>
                          <div className="text-center space-y-2">
                            <h4 className="text-2xl font-bold text-white">Bill Sent!</h4>
                            <p className="text-sm text-emerald-400 font-medium">
                              Sent successfully to +91 {whatsappNumber}
                            </p>
                            <p className="text-xs text-slate-400 pt-2">
                              Table {currentTable.tableNumber} is now being cleared...
                            </p>
                          </div>
                        </div>
                      )}
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
