import { useEffect, useState } from 'react';
import { reportsAPI } from '../../utils/api';
import { PageLoader } from '../../components/common/UIComponents';
import { DollarSign, TrendingUp, TrendingDown, Plus, X, Save, AlertTriangle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';

const INCOME_CATS  = ['Sales Revenue','Commission','Interest','Rent Income','Other Income'];
const EXPENSE_CATS = ['Rent','Salaries','Electricity','Internet','Transport','Medicine Purchase','Equipment','Miscellaneous'];

function EntryModal({ onClose, onSave }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: 'expense', category: '', amount: '', description: '',
    date: new Date().toISOString().split('T')[0], paymentMode: 'cash', reference: '',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const cats = form.type === 'income' ? INCOME_CATS : EXPENSE_CATS;

  const handleSave = async () => {
    if (!form.category)                       { toast.error('Select a category');       return; }
    if (!form.amount || Number(form.amount) <= 0) { toast.error('Enter valid amount'); return; }
    if (!form.description.trim())             { toast.error('Enter description');        return; }
    setSaving(true);
    try {
      await reportsAPI.addEntry({ ...form, amount: Number(form.amount) });
      toast.success('Entry added!');
      onSave();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="card w-full max-w-md border-white/10 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold font-display text-white">Add Account Entry</h3>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-5 h-5"/></button>
        </div>
        <div className="space-y-3">
          <div className="flex gap-2">
            {['income','expense'].map(t => (
              <button key={t} onClick={() => { set('type', t); set('category', ''); }}
                className={`btn flex-1 justify-center capitalize btn-sm ${form.type === t ? (t === 'income' ? 'bg-green-500 text-white border-green-500' : 'bg-red-500 text-white border-red-500') : 'btn-secondary'}`}>
                {t}
              </button>
            ))}
          </div>
          <div className="form-group">
            <label className="label">Category *</label>
            <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
              <option value="">Select category...</option>
              {cats.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Amount ₹ *</label>
            <input type="number" min="0.01" step="0.01" className="input" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00"/>
          </div>
          <div className="form-group">
            <label className="label">Description *</label>
            <input className="input" value={form.description} onChange={e => set('description', e.target.value)} placeholder="e.g. Shop rent for March 2025"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="label">Date</label>
              <input type="date" className="input" value={form.date} onChange={e => set('date', e.target.value)}/>
            </div>
            <div className="form-group">
              <label className="label">Payment Mode</label>
              <select className="input" value={form.paymentMode} onChange={e => set('paymentMode', e.target.value)}>
                {['cash','bank','upi','cheque','card'].map(m => <option key={m} value={m} className="capitalize">{m}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="label">Reference No.</label>
            <input className="input" value={form.reference} onChange={e => set('reference', e.target.value)} placeholder="Invoice / receipt number (optional)"/>
          </div>
        </div>
        <div className="flex gap-3 mt-5 pt-5 border-t border-white/5">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
            {saving ? <Spinner size="sm"/> : <><Save className="w-4 h-4"/>Save Entry</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AccountingPage() {
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [showModal,  setShowModal]  = useState(false);
  const [range,      setRange]      = useState({ start: '', end: '' });

  const load = async () => {
    setLoading(true); setError('');
    try {
      const r = await reportsAPI.accounting({
        startDate: range.start || undefined,
        endDate:   range.end   || undefined,
      });
      setData(r.data.data);
    } catch (e) { setError(e.response?.data?.message || 'Failed to load accounting data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [range.start, range.end]);

  const fmt = v => `₹${Number(v || 0).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6 animate-fade-in">
      {showModal && <EntryModal onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); load(); }}/>}

      <div className="page-header">
        <div><h1 className="page-title">Accounting</h1><p className="page-subtitle">Income, expenses and cashbook</p></div>
        <div className="flex gap-2 flex-wrap">
          <input type="date" className="input text-sm w-36" value={range.start} onChange={e => setRange(p => ({ ...p, start: e.target.value }))}/>
          <input type="date" className="input text-sm w-36" value={range.end}   onChange={e => setRange(p => ({ ...p, end:   e.target.value }))}/>
          <button onClick={() => setShowModal(true)} className="btn-primary btn-sm"><Plus className="w-4 h-4"/>Add Entry</button>
        </div>
      </div>

      {loading ? <PageLoader/> : error ? (
        <div className="card border-red-500/20 bg-red-500/5 flex items-center gap-4 py-6">
          <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0"/>
          <div className="flex-1"><p className="text-sm text-red-300">{error}</p></div>
          <button onClick={load} className="btn-secondary btn-sm"><RefreshCw className="w-4 h-4"/>Retry</button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="card bg-green-500/5 border border-green-500/20">
              <p className="text-2xl font-bold font-display text-green-400">{fmt(data?.income)}</p>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5"/>Total Income (incl. sales)</p>
            </div>
            <div className="card bg-red-500/5 border border-red-500/20">
              <p className="text-2xl font-bold font-display text-red-400">{fmt(data?.expense)}</p>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><TrendingDown className="w-3.5 h-3.5"/>Total Expenses</p>
            </div>
            <div className={`card border ${data?.balance >= 0 ? 'bg-teal-500/5 border-teal-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
              <p className={`text-2xl font-bold font-display ${data?.balance >= 0 ? 'text-teal-400' : 'text-red-400'}`}>{fmt(data?.balance)}</p>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><DollarSign className="w-3.5 h-3.5"/>Net Balance</p>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white font-display">Transaction History</h3>
              <button onClick={() => setShowModal(true)} className="btn-secondary btn-sm"><Plus className="w-3.5 h-3.5"/>Add</button>
            </div>
            {!data?.entries?.length ? (
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 text-slate-700 mx-auto mb-3"/>
                <p className="text-slate-400 font-semibold">No entries yet</p>
                <p className="text-slate-500 text-sm mt-1">Click "Add Entry" to record income or expenses.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead><tr>
                    <th>Date</th><th>Type</th><th>Category</th><th>Description</th>
                    <th>Mode</th><th>Ref.</th><th>Amount</th>
                  </tr></thead>
                  <tbody>
                    {data.entries.map(e => (
                      <tr key={e._id}>
                        <td className="text-xs text-slate-500">{e.date ? format(new Date(e.date), 'dd MMM yyyy') : '—'}</td>
                        <td><span className={`badge capitalize ${e.type === 'income' ? 'badge-green' : 'badge-red'}`}>{e.type}</span></td>
                        <td className="text-sm text-slate-300">{e.category}</td>
                        <td className="text-sm text-slate-400 max-w-xs truncate">{e.description}</td>
                        <td className="text-xs text-slate-500 capitalize">{e.paymentMode}</td>
                        <td className="font-mono text-xs text-slate-500">{e.reference || '—'}</td>
                        <td className={`font-mono text-sm font-bold ${e.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                          {e.type === 'income' ? '+' : '−'}{fmt(e.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
