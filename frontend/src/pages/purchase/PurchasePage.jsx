import { useEffect, useState } from 'react';
import { suppliersAPI } from '../../utils/api';
import { EmptyState, PageLoader, SearchBar } from '../../components/common/UIComponents';
import { Plus, Truck, X, Save, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';

function SupplierModal({ onClose, onSave }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', companyName: '', phone: '', email: '',
    gstNumber: '', drugLicense: '', creditDays: 30,
    address: { city: '', state: '', pincode: '' },
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim())        { toast.error('Contact name is required');  return; }
    if (!form.companyName.trim()) { toast.error('Company name is required');  return; }
    if (!form.phone.trim())       { toast.error('Phone number is required');  return; }
    setSaving(true);
    try {
      await suppliersAPI.create(form);
      toast.success('Supplier added!');
      onSave();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="card w-full max-w-lg border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold font-display text-white">Add Supplier</h3>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-5 h-5"/></button>
        </div>
        <div className="space-y-3">
          {[['Contact Person Name *','name'],['Company / Firm Name *','companyName'],
            ['Phone *','phone'],['Email','email'],
            ['GST Number','gstNumber'],['Drug License No.','drugLicense']].map(([l, k]) => (
            <div key={k} className="form-group">
              <label className="label">{l}</label>
              <input className="input" value={form[k] || ''} onChange={e => set(k, e.target.value)}/>
            </div>
          ))}
          <div className="grid grid-cols-3 gap-2">
            {[['City','city'],['State','state'],['PIN','pincode']].map(([l, k]) => (
              <div key={k} className="form-group">
                <label className="label">{l}</label>
                <input className="input" value={form.address[k] || ''}
                  onChange={e => setForm(p => ({ ...p, address: { ...p.address, [k]: e.target.value } }))}/>
              </div>
            ))}
          </div>
          <div className="form-group">
            <label className="label">Credit Days</label>
            <input type="number" min="0" className="input" value={form.creditDays}
              onChange={e => set('creditDays', Number(e.target.value))}/>
          </div>
        </div>
        <div className="flex gap-3 mt-5 pt-5 border-t border-white/5">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
            {saving ? <Spinner size="sm"/> : <><Save className="w-4 h-4"/>Save</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PurchasePage() {
  const [tab,        setTab]        = useState('suppliers');
  const [suppliers,  setSuppliers]  = useState([]);
  const [pos,        setPos]        = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [showModal,  setShowModal]  = useState(false);
  const [search,     setSearch]     = useState('');

  const loadSuppliers = async () => {
    setLoading(true); setError('');
    try {
      const r = await suppliersAPI.getAll({ search: search || undefined });
      setSuppliers(r.data.data || []);
    } catch (e) { setError(e.response?.data?.message || 'Failed to load suppliers'); }
    finally { setLoading(false); }
  };

  const loadPOs = async () => {
    setLoading(true); setError('');
    try {
      const r = await suppliersAPI.getPOs({});
      setPos(r.data.data || []);
    } catch (e) { setError(e.response?.data?.message || 'Failed to load purchase orders'); }
    finally { setLoading(false); }
  };

  useEffect(() => { tab === 'suppliers' ? loadSuppliers() : loadPOs(); }, [tab, search]);

  const receivePO = async (id) => {
    try {
      await suppliersAPI.receivePO(id, { items: [] });
      toast.success('Purchase order marked as received');
      loadPOs();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const ErrorBox = ({ msg, onRetry }) => (
    <div className="card border-red-500/20 bg-red-500/5 flex items-center gap-4 py-6">
      <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0"/>
      <div className="flex-1"><p className="text-sm text-red-300">{msg}</p></div>
      <button onClick={onRetry} className="btn-secondary btn-sm"><RefreshCw className="w-4 h-4"/>Retry</button>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {showModal && (
        <SupplierModal onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); loadSuppliers(); }}/>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Purchase & Supplier Management</h1>
          <p className="page-subtitle">Manage suppliers and purchase orders</p>
        </div>
        {tab === 'suppliers' && (
          <button onClick={() => setShowModal(true)} className="btn-primary btn-sm">
            <Plus className="w-4 h-4"/>Add Supplier
          </button>
        )}
      </div>

      <div className="flex gap-2">
        {[['suppliers','Suppliers'],['pos','Purchase Orders']].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`btn btn-sm ${tab === v ? 'btn-primary' : 'btn-secondary'}`}>{l}</button>
        ))}
      </div>

      {tab === 'suppliers' && (
        <>
          <SearchBar value={search} onChange={v => setSearch(v)} placeholder="Search suppliers..."/>
          {loading ? <PageLoader/> : error ? <ErrorBox msg={error} onRetry={loadSuppliers}/> :
            suppliers.length === 0 ? (
              <EmptyState icon={Truck} title="No Suppliers Yet"
                description="Add your first supplier to start creating purchase orders."
                action={<button onClick={() => setShowModal(true)} className="btn-primary">Add Supplier</button>}/>
            ) : (
              <div className="card">
                <div className="table-wrapper">
                  <table>
                    <thead><tr>
                      <th>Supplier</th><th>Contact</th><th>GST</th>
                      <th>Drug License</th><th>Credit Days</th><th>Total Purchases</th><th>Outstanding</th>
                    </tr></thead>
                    <tbody>
                      {suppliers.map(s => (
                        <tr key={s._id}>
                          <td>
                            <p className="text-sm font-semibold text-white">{s.companyName}</p>
                            <p className="text-xs text-slate-500">{s.name} · {s.email || '—'}</p>
                          </td>
                          <td className="text-sm text-slate-300">{s.phone}</td>
                          <td className="font-mono text-xs text-slate-400">{s.gstNumber || '—'}</td>
                          <td className="font-mono text-xs text-slate-400">{s.drugLicense || '—'}</td>
                          <td className="text-sm text-slate-300">{s.creditDays} days</td>
                          <td className="font-mono text-sm text-brand-400">₹{(s.totalPurchases || 0).toLocaleString('en-IN')}</td>
                          <td className={`font-mono text-sm ${s.outstandingAmt > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                            ₹{(s.outstandingAmt || 0).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
        </>
      )}

      {tab === 'pos' && (
        loading ? <PageLoader/> : error ? <ErrorBox msg={error} onRetry={loadPOs}/> :
          pos.length === 0 ? (
            <EmptyState icon={Truck} title="No Purchase Orders"
              description="Purchase orders will appear here once created."/>
          ) : (
            <div className="card">
              <div className="table-wrapper">
                <table>
                  <thead><tr>
                    <th>PO #</th><th>Supplier</th><th>Date</th>
                    <th>Total</th><th>Paid</th><th>Due</th><th>Status</th><th></th>
                  </tr></thead>
                  <tbody>
                    {pos.map(po => (
                      <tr key={po._id}>
                        <td className="font-mono text-xs text-brand-400">{po.poNumber}</td>
                        <td className="text-sm text-slate-300">{po.supplier?.companyName || '—'}</td>
                        <td className="text-xs text-slate-500">{po.createdAt ? format(new Date(po.createdAt), 'dd MMM yyyy') : '—'}</td>
                        <td className="font-mono text-sm">₹{(po.grandTotal || 0).toLocaleString('en-IN')}</td>
                        <td className="font-mono text-sm text-green-400">₹{(po.amountPaid || 0).toLocaleString('en-IN')}</td>
                        <td className={`font-mono text-sm ${po.amountDue > 0 ? 'text-red-400' : 'text-slate-400'}`}>₹{(po.amountDue || 0).toLocaleString('en-IN')}</td>
                        <td><span className={`badge capitalize ${po.status === 'received' ? 'badge-green' : po.status === 'cancelled' ? 'badge-red' : 'badge-yellow'}`}>{po.status}</span></td>
                        <td>
                          {po.status !== 'received' && po.status !== 'cancelled' && (
                            <button onClick={() => receivePO(po._id)} className="btn-secondary btn-sm text-xs">
                              <CheckCircle className="w-3.5 h-3.5"/>Received
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
      )}
    </div>
  );
}
