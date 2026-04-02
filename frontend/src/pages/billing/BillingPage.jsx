import { useState, useRef, useEffect } from 'react';
import { medicinesAPI, batchesAPI, salesAPI, customersAPI } from '../../utils/api';
import {
  ShoppingCart, Search, Plus, Trash2, Printer,
  CheckCircle, User, X, RefreshCw, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';

const PAYMENT_MODES = ['cash', 'card', 'upi', 'credit', 'cheque'];
const fmt = (n) => Number(n || 0).toFixed(2);

// ── Bill Success Screen ──────────────────────────────────────
function BillSuccess({ bill, onNew }) {
  return (
    <div className="max-w-xl mx-auto mt-10 animate-fade-in">
      <div className="card border-green-500/20 bg-green-500/5 text-center py-12 px-8">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-10 h-10 text-green-400"/>
        </div>
        <h2 className="text-2xl font-extrabold font-display text-white mb-1">Bill Created!</h2>
        <p className="text-slate-400 mb-1">Bill Number</p>
        <p className="text-2xl font-mono font-bold text-brand-400 mb-3">{bill.billNumber}</p>
        <div className="flex justify-between text-sm p-4 rounded-xl bg-white/[0.04] mb-6">
          <span className="text-slate-400">Customer</span>
          <span className="text-white font-medium">{bill.customerName || 'Walk-in'}</span>
        </div>
        <div className="flex justify-between text-sm p-4 rounded-xl bg-white/[0.04] mb-6 -mt-3">
          <span className="text-slate-400">Grand Total</span>
          <span className="text-brand-400 font-bold font-mono text-lg">₹{Number(bill.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
        {bill.changeReturned > 0 && (
          <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-green-400 mb-4">
            Change returned to customer: <strong>₹{fmt(bill.changeReturned)}</strong>
          </div>
        )}
        {bill.amountDue > 0 && (
          <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-sm text-yellow-400 mb-4">
            Balance due from customer: <strong>₹{fmt(bill.amountDue)}</strong>
          </div>
        )}
        <div className="flex gap-3 justify-center mt-2">
          <button onClick={onNew} className="btn-primary btn-lg">
            <Plus className="w-5 h-5"/> New Bill
          </button>
          <button onClick={() => window.print()} className="btn-secondary btn-lg">
            <Printer className="w-4 h-4"/> Print
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Cart Item Row ────────────────────────────────────────────
function CartItem({ item, onQtyChange, onDiscChange, onRemove }) {
  const lineTotal = (item.sellingPrice * item.quantity) - (item.discount || 0);
  return (
    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
      {/* Top row: name + remove */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white leading-snug truncate">{item.medicineName}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Batch: {item.batchNumber} &nbsp;·&nbsp; MRP ₹{item.mrp}
            &nbsp;·&nbsp; Avail: <span className="text-green-400">{item.availableQty}</span>
          </p>
        </div>
        <button onClick={onRemove} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1 rounded-lg flex-shrink-0">
          <Trash2 className="w-4 h-4"/>
        </button>
      </div>

      {/* Bottom row: qty × price − disc = total */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex flex-col items-center">
          <label className="text-[10px] text-slate-600 mb-0.5">QTY</label>
          <input
            type="number" min="1" max={item.availableQty}
            value={item.quantity}
            onChange={e => onQtyChange(Number(e.target.value))}
            className="input w-16 text-center py-1.5 text-sm"
          />
        </div>
        <span className="text-slate-600 text-sm mt-3">×</span>
        <div className="flex flex-col items-center">
          <label className="text-[10px] text-slate-600 mb-0.5">PRICE</label>
          <span className="font-mono text-sm text-slate-300 bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2">
            ₹{item.sellingPrice}
          </span>
        </div>
        <span className="text-slate-600 text-sm mt-3">−</span>
        <div className="flex flex-col items-center">
          <label className="text-[10px] text-slate-600 mb-0.5">DISC ₹</label>
          <input
            type="number" min="0"
            value={item.discount}
            onChange={e => onDiscChange(Number(e.target.value))}
            className="input w-16 text-center py-1.5 text-sm"
            placeholder="0"
          />
        </div>
        <div className="flex flex-col items-center ml-auto">
          <label className="text-[10px] text-slate-600 mb-0.5">TOTAL</label>
          <span className="font-mono text-sm font-bold text-brand-400 bg-brand-500/10 border border-brand-500/20 rounded-xl px-3 py-2">
            ₹{fmt(lineTotal)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Main BillingPage ─────────────────────────────────────────
export default function BillingPage() {
  const searchRef = useRef(null);

  // Medicine search
  const [query,     setQuery]     = useState('');
  const [results,   setResults]   = useState([]);
  const [searching, setSearching] = useState(false);

  // Cart
  const [cart, setCart] = useState([]);

  // Customer
  const [customer,        setCustomer]        = useState(null);
  const [customerQuery,   setCustomerQuery]   = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [showCustDrop,    setShowCustDrop]    = useState(false);

  // Billing
  const [paymentMode, setPaymentMode] = useState('cash');
  const [amountPaid,  setAmountPaid]  = useState('');
  const [doctorName,  setDoctorName]  = useState('');
  const [saving,      setSaving]      = useState(false);

  // Success
  const [lastBill, setLastBill] = useState(null);

  // ── Computed totals ────────────────────────────────────────
  const subtotal      = cart.reduce((s, i) => s + (i.sellingPrice * i.quantity), 0);
  const totalDiscount = cart.reduce((s, i) => s + (i.discount || 0), 0);
  const totalGst      = cart.reduce((s, i) => {
    const base = (i.sellingPrice * i.quantity) - (i.discount || 0);
    return s + (base * (i.gstPercent || 12) / 100);
  }, 0);
  const grandTotal = Math.max(0, subtotal - totalDiscount + totalGst);
  const paid       = Number(amountPaid) || 0;
  const change     = Math.max(0, paid - grandTotal);
  const due        = Math.max(0, grandTotal - paid);

  // ── Medicine search ────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length < 2) { setResults([]); return; }
      setSearching(true);
      try {
        // Barcode scan (all digits, 5+)
        if (/^\d{5,}$/.test(query.trim())) {
          try {
            const r = await medicinesAPI.getByBarcode(query.trim());
            if (r.data.data) { await addToCart(r.data.data); setQuery(''); setResults([]); }
          } catch { /* not a barcode match, fall through to text search */ }
        }
        const r = await medicinesAPI.getAll({ search: query, limit: 8 });
        setResults(r.data.data || []);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  // ── Customer search ────────────────────────────────────────
  useEffect(() => {
    if (customerQuery.length < 2) { setCustomerResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const r = await customersAPI.getAll({ search: customerQuery });
        setCustomerResults(r.data.data || []);
        setShowCustDrop(true);
      } catch { setCustomerResults([]); }
    }, 250);
    return () => clearTimeout(timer);
  }, [customerQuery]);

  // ── Add to cart ────────────────────────────────────────────
  const addToCart = async (medicine) => {
    setResults([]); setQuery('');
    try {
      const r       = await batchesAPI.getAll({ medicineId: medicine._id });
      const batches = (r.data.data || []).filter(b => !b.isExpired && b.availableQty > 0);
      if (!batches.length) {
        toast.error(`No stock available for ${medicine.name}`);
        return;
      }
      // FEFO — use first-to-expire batch
      batches.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
      const batch = batches[0];

      setCart(prev => {
        const exists = prev.find(i => i.batchId === String(batch._id));
        if (exists) {
          const newQty = exists.quantity + 1;
          if (newQty > batch.availableQty) {
            toast.error(`Max available: ${batch.availableQty}`);
            return prev;
          }
          return prev.map(i =>
            i.batchId === String(batch._id)
              ? { ...i, quantity: newQty }
              : i
          );
        }
        const sellingPrice = batch.sellingPrice || batch.mrp || medicine.pricing?.ptr || medicine.pricing?.mrp || 0;
        return [...prev, {
          medicineId:  String(medicine._id),
          medicineName: medicine.name,
          batchId:     String(batch._id),
          batchNumber: batch.batchNumber,
          expiryDate:  batch.expiryDate,
          availableQty:batch.availableQty,
          quantity:    1,
          mrp:         batch.mrp || medicine.pricing?.mrp || 0,
          sellingPrice,
          discount:    0,
          gstPercent:  medicine.pricing?.gstPercent || 12,
        }];
      });

      toast.success(`${medicine.name} added to cart`, { duration: 1500 });
      // Return focus to search input
      setTimeout(() => searchRef.current?.focus(), 50);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not load stock info');
    }
  };

  const updateQty = (batchId, qty) => {
    if (qty < 1) { removeItem(batchId); return; }
    const item = cart.find(i => i.batchId === batchId);
    if (item && qty > item.availableQty) {
      toast.error(`Only ${item.availableQty} available in this batch`);
      return;
    }
    setCart(prev => prev.map(i => i.batchId === batchId ? { ...i, quantity: qty } : i));
  };

  const updateDiscount = (batchId, disc) =>
    setCart(prev => prev.map(i => i.batchId === batchId ? { ...i, discount: Math.max(0, disc) } : i));

  const removeItem = (batchId) =>
    setCart(prev => prev.filter(i => i.batchId !== batchId));

  // ── Select customer ────────────────────────────────────────
  const selectCustomer = (c) => {
    setCustomer(c);
    setCustomerQuery(c.name);
    setCustomerResults([]);
    setShowCustDrop(false);
  };

  const clearCustomer = () => {
    setCustomer(null);
    setCustomerQuery('');
    setCustomerResults([]);
    setShowCustDrop(false);
  };

  // ── Generate bill ──────────────────────────────────────────
  const handleBill = async () => {
    if (!cart.length) { toast.error('Add at least one medicine to the cart'); return; }
    if (grandTotal <= 0) { toast.error('Grand total must be greater than 0'); return; }

    setSaving(true);
    try {
      const payload = {
        items: cart.map(i => ({
          batchId:     i.batchId,
          medicineName:i.medicineName,
          quantity:    i.quantity,
          mrp:         i.mrp,
          sellingPrice:i.sellingPrice,
          discount:    i.discount || 0,
          gstPercent:  i.gstPercent,
          amount:      (i.sellingPrice * i.quantity) - (i.discount || 0),
        })),
        customer:       customer?._id  || undefined,
        customerName:   customer?.name || 'Walk-in Customer',
        customerMobile: customer?.mobile || '',
        doctorName:     doctorName || '',
        paymentMode,
        amountPaid:     paid > 0 ? paid : grandTotal,
      };

      const r = await salesAPI.create(payload);
      const bill = r.data.data;
      setLastBill(bill);

      // Reset form
      setCart([]);
      setCustomer(null);
      setCustomerQuery('');
      setAmountPaid('');
      setDoctorName('');
      setPaymentMode('cash');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to generate bill');
    } finally {
      setSaving(false);
    }
  };

  // ── New bill reset ─────────────────────────────────────────
  const handleNewBill = () => {
    setLastBill(null);
    setCart([]);
    setTimeout(() => searchRef.current?.focus(), 100);
  };

  // ── Success screen ─────────────────────────────────────────
  if (lastBill) {
    return <BillSuccess bill={lastBill} onNew={handleNewBill}/>;
  }

  // ── Main UI ────────────────────────────────────────────────
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header mb-5">
        <div>
          <h1 className="page-title">Billing / POS</h1>
          <p className="page-subtitle">Fast billing · Barcode scanning · Auto GST · Stock deduction</p>
        </div>
        {cart.length > 0 && (
          <button onClick={() => setCart([])} className="btn-secondary btn-sm text-red-400 border-red-500/20 hover:bg-red-500/10">
            <Trash2 className="w-4 h-4"/> Clear Cart
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── LEFT: Medicine Search + Cart ──────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Search box */}
          <div className="card">
            <label className="label mb-2">Search Medicine / Scan Barcode</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"/>
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Type medicine name, generic or scan barcode..."
                className="input pl-10 pr-10"
              />
              {searching && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  <Spinner size="sm"/>
                </div>
              )}
              {query && !searching && (
                <button onClick={() => { setQuery(''); setResults([]); }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                  <X className="w-4 h-4"/>
                </button>
              )}
            </div>

            {/* Search results dropdown */}
            {results.length > 0 && (
              <div className="mt-2 rounded-xl border border-white/10 overflow-hidden bg-slate-900 shadow-2xl">
                {results.map(m => (
                  <button
                    key={m._id}
                    type="button"
                    onClick={() => addToCart(m)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{m.name}</p>
                      <p className="text-xs text-slate-500">
                        {m.genericName} · {m.strength || 'N/A'} · Stock:{' '}
                        <span className={m.currentStock <= 0 ? 'text-red-400' : 'text-green-400'}>
                          {m.currentStock} {m.unit}
                        </span>
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-mono font-bold text-brand-400">₹{m.pricing?.ptr || 0}</p>
                      <p className="text-xs text-slate-600">PTR</p>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                      <Plus className="w-4 h-4 text-brand-400"/>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {query.length >= 2 && !searching && results.length === 0 && (
              <div className="mt-2 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                <p className="text-sm text-slate-500">No medicines found for "{query}"</p>
                <p className="text-xs text-slate-600 mt-1">Make sure medicines are added in Inventory first</p>
              </div>
            )}
          </div>

          {/* Cart */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white font-display flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-brand-400"/>
                Cart
                {cart.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 text-xs font-bold">
                    {cart.length} item{cart.length !== 1 ? 's' : ''}
                  </span>
                )}
              </h3>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-12 h-12 text-slate-700 mx-auto mb-3"/>
                <p className="text-slate-500 text-sm">Cart is empty</p>
                <p className="text-slate-600 text-xs mt-1">Search and click a medicine above to add it</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map(item => (
                  <CartItem
                    key={item.batchId}
                    item={item}
                    onQtyChange={qty => updateQty(item.batchId, qty)}
                    onDiscChange={disc => updateDiscount(item.batchId, disc)}
                    onRemove={() => removeItem(item.batchId)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Customer + Payment ──────────────────────── */}
        <div className="space-y-4">

          {/* Customer section */}
          <div className="card">
            <h3 className="text-sm font-semibold text-white font-display mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400"/> Customer
            </h3>

            {customer ? (
              /* Selected customer chip */
              <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-500/10 border border-brand-500/20">
                <div className="w-9 h-9 rounded-xl bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold font-display flex-shrink-0">
                  {customer.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{customer.name}</p>
                  <p className="text-xs text-slate-400">{customer.mobile}</p>
                </div>
                <button
                  type="button"
                  onClick={clearCustomer}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-red-500/20 flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5"/>
                </button>
              </div>
            ) : (
              /* Customer search input */
              <div className="relative">
                <input
                  type="text"
                  value={customerQuery}
                  onChange={e => {
                    setCustomerQuery(e.target.value);
                    setShowCustDrop(true);
                    if (!e.target.value) setCustomerResults([]);
                  }}
                  onFocus={() => customerResults.length > 0 && setShowCustDrop(true)}
                  onBlur={() => setTimeout(() => setShowCustDrop(false), 200)}
                  placeholder="Search by name or mobile..."
                  className="input text-sm"
                />

                {showCustDrop && customerResults.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 rounded-xl border border-white/10 bg-slate-900 overflow-hidden shadow-2xl max-h-52 overflow-y-auto">
                    {customerResults.map(c => (
                      <button
                        key={c._id}
                        type="button"
                        onMouseDown={() => selectCustomer(c)}
                        className="w-full text-left px-3 py-2.5 hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors"
                      >
                        <p className="text-sm font-medium text-white">{c.name}</p>
                        <p className="text-xs text-slate-500">{c.mobile}{c.doctorName ? ` · Dr. ${c.doctorName}` : ''}</p>
                      </button>
                    ))}
                  </div>
                )}

                <p className="text-xs text-slate-600 mt-1.5">
                  Leave blank for walk-in customer
                </p>
              </div>
            )}

            {/* Doctor name */}
            <div className="form-group mt-3">
              <label className="label">Doctor Name (optional)</label>
              <input
                type="text"
                className="input text-sm"
                value={doctorName}
                onChange={e => setDoctorName(e.target.value)}
                placeholder="Dr. Sharma"
              />
            </div>
          </div>

          {/* Bill summary + payment */}
          <div className="card">
            <h3 className="text-sm font-semibold text-white font-display mb-4">Bill Summary</h3>

            {/* Totals */}
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-mono text-slate-300">₹{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-slate-500">Discount (−)</span>
                <span className="font-mono text-red-400">₹{fmt(totalDiscount)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-slate-500">GST (+)</span>
                <span className="font-mono text-slate-300">₹{fmt(totalGst)}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="font-bold text-white text-base">Grand Total</span>
                <span className="font-mono font-bold text-brand-400 text-lg">₹{fmt(grandTotal)}</span>
              </div>
            </div>

            {/* Payment mode */}
            <div className="form-group mb-3">
              <label className="label">Payment Mode</label>
              <div className="flex flex-wrap gap-1.5">
                {PAYMENT_MODES.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMode(m)}
                    className={`btn btn-sm capitalize ${paymentMode === m ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount paid */}
            <div className="form-group mb-3">
              <label className="label">Amount Paid ₹</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input text-lg font-mono"
                value={amountPaid}
                onChange={e => setAmountPaid(e.target.value)}
                placeholder={fmt(grandTotal)}
              />
            </div>

            {/* Change / due */}
            {paid > 0 && paid >= grandTotal && grandTotal > 0 && (
              <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 mb-3">
                <p className="text-sm text-green-400">
                  Change to return: <span className="font-bold font-mono">₹{fmt(change)}</span>
                </p>
              </div>
            )}
            {paid > 0 && paid < grandTotal && (
              <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 mb-3">
                <p className="text-sm text-yellow-400">
                  Balance due: <span className="font-bold font-mono">₹{fmt(due)}</span>
                </p>
              </div>
            )}

            {/* Generate bill button */}
            <button
              type="button"
              onClick={handleBill}
              disabled={saving || cart.length === 0}
              className="btn-primary w-full justify-center btn-lg mt-1 disabled:opacity-50"
            >
              {saving
                ? <><Spinner size="sm"/> Generating...</>
                : <><CheckCircle className="w-5 h-5"/> Generate Bill</>}
            </button>

            {cart.length === 0 && (
              <p className="text-xs text-slate-600 text-center mt-2">Add medicines to the cart first</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
