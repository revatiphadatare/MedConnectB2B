import { useEffect, useState } from 'react';
import { batchesAPI, medicinesAPI } from '../../utils/api';
import { EmptyState, PageLoader, StatCard } from '../../components/common/UIComponents';
import { Plus, X, Save, Warehouse, AlertTriangle, Package, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';

function AddBatchModal({ onClose, onSave }) {
  const [medicines, setMedicines] = useState([]);
  const [loadingMeds, setLoadingMeds] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    medicine: '', batchNumber: '', expiryDate: '', manufacturingDate: '',
    quantity: '', purchasePrice: '', sellingPrice: '', mrp: '', location: 'Main Store',
  });

  useEffect(() => {
    setLoadingMeds(true);
    medicinesAPI.getAll({ limit: 500 })
      .then(r => setMedicines(r.data.data || []))
      .catch(e => toast.error(e.response?.data?.message || 'Could not load medicines'))
      .finally(() => setLoadingMeds(false));
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.medicine)    { toast.error('Please select a medicine'); return; }
    if (!form.batchNumber) { toast.error('Batch number is required'); return; }
    if (!form.expiryDate)  { toast.error('Expiry date is required');  return; }
    if (!form.quantity || Number(form.quantity) <= 0) { toast.error('Enter valid quantity'); return; }

    setSaving(true);
    try {
      await batchesAPI.create({
        medicine:          form.medicine,
        batchNumber:       form.batchNumber.trim(),
        expiryDate:        form.expiryDate,
        manufacturingDate: form.manufacturingDate || undefined,
        quantity:          Number(form.quantity),
        purchasePrice:     Number(form.purchasePrice) || 0,
        sellingPrice:      Number(form.sellingPrice)  || 0,
        mrp:               Number(form.mrp)           || 0,
        location:          form.location || 'Main Store',
      });
      toast.success('Stock added! Inventory updated.');
      onSave();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to add stock');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="card w-full max-w-lg border-white/10 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold font-display text-white">Add Stock / New Batch</h3>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-5 h-5"/></button>
        </div>

        <div className="space-y-3">
          <div className="form-group">
            <label className="label">Medicine *</label>
            {loadingMeds ? (
              <div className="input flex items-center gap-2 text-slate-500">
                <Spinner size="sm"/><span>Loading medicines...</span>
              </div>
            ) : (
              <select className="input" value={form.medicine} onChange={e => set('medicine', e.target.value)}>
                <option value="">-- Select Medicine --</option>
                {medicines.map(m => (
                  <option key={m._id} value={m._id}>
                    {m.name} — {m.brand}{m.strength ? ` (${m.strength})` : ''}
                  </option>
                ))}
              </select>
            )}
            {!loadingMeds && medicines.length === 0 && (
              <p className="text-xs text-yellow-400 mt-1">
                ⚠️ No medicines found. Go to <strong>Inventory</strong> and add medicines first.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="label">Batch Number *</label>
              <input className="input" value={form.batchNumber} onChange={e => set('batchNumber', e.target.value)} placeholder="BT-2025-001"/>
            </div>
            <div className="form-group">
              <label className="label">Quantity *</label>
              <input type="number" min="1" className="input" value={form.quantity} onChange={e => set('quantity', e.target.value)} placeholder="500"/>
            </div>
            <div className="form-group">
              <label className="label">Mfg. Date</label>
              <input type="date" className="input" value={form.manufacturingDate} onChange={e => set('manufacturingDate', e.target.value)}/>
            </div>
            <div className="form-group">
              <label className="label">Expiry Date *</label>
              <input type="date" className="input" value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)}/>
            </div>
            <div className="form-group">
              <label className="label">Purchase Price ₹</label>
              <input type="number" min="0" className="input" value={form.purchasePrice} onChange={e => set('purchasePrice', e.target.value)} placeholder="0"/>
            </div>
            <div className="form-group">
              <label className="label">MRP ₹</label>
              <input type="number" min="0" className="input" value={form.mrp} onChange={e => set('mrp', e.target.value)} placeholder="0"/>
            </div>
            <div className="form-group">
              <label className="label">Selling Price ₹</label>
              <input type="number" min="0" className="input" value={form.sellingPrice} onChange={e => set('sellingPrice', e.target.value)} placeholder="0"/>
            </div>
            <div className="form-group">
              <label className="label">Location</label>
              <input className="input" value={form.location} onChange={e => set('location', e.target.value)} placeholder="Main Store"/>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-5 pt-5 border-t border-white/5">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={handleSave} disabled={saving || loadingMeds || medicines.length === 0}
            className="btn-primary flex-1 justify-center">
            {saving ? <Spinner size="sm"/> : <><Save className="w-4 h-4"/>Add Stock</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BatchesPage() {
  const [batches,    setBatches]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [showModal,  setShowModal]  = useState(false);
  const [filter,     setFilter]     = useState('all');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const params = {};
      if (filter === 'expiring') params.expiring = 'true';
      if (filter === 'expired')  params.expired  = 'true';
      if (filter === 'low')      params.lowStock  = 'true';
      const r = await batchesAPI.getAll(params);
      setBatches(r.data.data || []);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load batches');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const expiringCount = batches.filter(b => b.isNearExpiry).length;
  const expiredCount  = batches.filter(b => b.isExpired).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {showModal && <AddBatchModal onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); load(); }}/>}

      <div className="page-header">
        <div>
          <h1 className="page-title">Batch & Stock Management</h1>
          <p className="page-subtitle">{batches.length} batches · {expiringCount} near expiry · {expiredCount} expired</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary btn-sm">
          <Plus className="w-4 h-4"/>Add Stock
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Batches"  value={batches.length}  icon={Warehouse}     color="teal"  />
        <StatCard title="Near Expiry"    value={expiringCount}   icon={AlertTriangle} color="yellow"/>
        <StatCard title="Expired"        value={expiredCount}    icon={AlertTriangle} color="red"   />
        <StatCard title="Total Qty"      value={batches.reduce((s, b) => s + (b.availableQty || 0), 0)} icon={Package} color="blue"/>
      </div>

      <div className="flex flex-wrap gap-2">
        {[['all','All'],['expiring','Near Expiry'],['expired','Expired'],['low','Low Stock']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`btn btn-sm ${filter === v ? 'btn-primary' : 'btn-secondary'}`}>{l}</button>
        ))}
      </div>

      {loading ? <PageLoader/> : error ? (
        <div className="card border-red-500/20 bg-red-500/5 flex items-center gap-4 py-6">
          <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0"/>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-300">Failed to load batches</p>
            <p className="text-xs text-red-400 mt-1">{error}</p>
          </div>
          <button onClick={load} className="btn-secondary btn-sm"><RefreshCw className="w-4 h-4"/>Retry</button>
        </div>
      ) : batches.length === 0 ? (
        <EmptyState icon={Warehouse} title="No Stock Found"
          description={filter === 'all' ? 'Click Add Stock to add your first batch of medicines.' : `No batches match the "${filter}" filter.`}
          action={filter === 'all' ? <button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4"/>Add Stock</button> : null}/>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead><tr>
                <th>Medicine</th><th>Batch #</th><th>Total</th><th>Available</th>
                <th>Sold</th><th>Buy ₹</th><th>MRP ₹</th><th>Expiry</th><th>Status</th>
              </tr></thead>
              <tbody>
                {batches.map(b => (
                  <tr key={b._id}>
                    <td>
                      <p className="text-sm font-semibold text-white">{b.medicine?.name || '—'}</p>
                      <p className="text-xs text-slate-500">{b.medicine?.brand}</p>
                    </td>
                    <td className="font-mono text-xs text-slate-300">{b.batchNumber}</td>
                    <td className="font-mono text-sm">{b.quantity}</td>
                    <td className={`font-mono text-sm font-bold ${
                      b.availableQty === 0 ? 'text-red-400' :
                      b.availableQty <= 10 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {b.availableQty}
                    </td>
                    <td className="font-mono text-sm text-slate-400">{b.soldQty || 0}</td>
                    <td className="font-mono text-sm">₹{b.purchasePrice || 0}</td>
                    <td className="font-mono text-sm">₹{b.mrp || 0}</td>
                    <td className={`text-sm ${b.isExpired ? 'text-red-400' : b.isNearExpiry ? 'text-yellow-400' : 'text-slate-300'}`}>
                      {b.expiryDate ? format(new Date(b.expiryDate), 'dd MMM yyyy') : '—'}
                    </td>
                    <td>
                      {b.isExpired ? <span className="badge-red">Expired</span>
                        : b.isNearExpiry ? <span className="badge-yellow">Near Expiry</span>
                        : <span className="badge-green">OK</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
