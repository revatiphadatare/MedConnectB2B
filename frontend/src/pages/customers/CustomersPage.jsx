import { useEffect, useState } from 'react';
import { customersAPI } from '../../utils/api';
import { EmptyState, PageLoader, SearchBar, StatCard } from '../../components/common/UIComponents';
import { Users, Plus, X, Save, CreditCard, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';

function CustomerModal({ customer, onClose, onSave }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name:         customer?.name         || '',
    mobile:       customer?.mobile       || '',
    email:        customer?.email        || '',
    gender:       customer?.gender       || '',
    doctorName:   customer?.doctorName   || '',
    medicalHistory: customer?.medicalHistory || '',
    isCredit:     customer?.isCredit     || false,
    creditLimit:  customer?.creditLimit  || 0,
    address: {
      city:  customer?.address?.city  || '',
      state: customer?.address?.state || '',
    },
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim())   { toast.error('Name is required');   return; }
    if (!form.mobile.trim()) { toast.error('Mobile is required'); return; }
    setSaving(true);
    try {
      if (customer?._id) await customersAPI.update(customer._id, form);
      else               await customersAPI.create(form);
      toast.success(customer ? 'Customer updated!' : 'Customer added!');
      onSave();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="card w-full max-w-lg border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold font-display text-white">
            {customer ? 'Edit Customer' : 'Add New Customer'}
          </h3>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-5 h-5"/></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="label">Full Name *</label>
              <input className="input" value={form.name}
                onChange={e => set('name', e.target.value)} placeholder="Ramesh Sharma"/>
            </div>
            <div className="form-group">
              <label className="label">Mobile *</label>
              <input className="input" value={form.mobile}
                onChange={e => set('mobile', e.target.value)} placeholder="9876543210"/>
            </div>
            <div className="form-group">
              <label className="label">Email</label>
              <input type="email" className="input" value={form.email}
                onChange={e => set('email', e.target.value)} placeholder="optional"/>
            </div>
            <div className="form-group">
              <label className="label">Gender</label>
              <select className="input" value={form.gender} onChange={e => set('gender', e.target.value)}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Doctor Name</label>
              <input className="input" value={form.doctorName}
                onChange={e => set('doctorName', e.target.value)} placeholder="Dr. Sharma"/>
            </div>
            <div className="form-group">
              <label className="label">City</label>
              <input className="input" value={form.address.city}
                onChange={e => setForm(p => ({ ...p, address: { ...p.address, city: e.target.value } }))}
                placeholder="Pune"/>
            </div>
          </div>

          <div className="form-group">
            <label className="label">Medical Notes / Allergies</label>
            <textarea rows={2} className="input" value={form.medicalHistory}
              onChange={e => set('medicalHistory', e.target.value)}
              placeholder="Any known allergies or medical history..."/>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <input type="checkbox" id="credit" checked={form.isCredit}
              onChange={e => set('isCredit', e.target.checked)}
              className="accent-brand-500 w-4 h-4"/>
            <label htmlFor="credit" className="text-sm text-slate-300 flex-1">Credit Customer</label>
            {form.isCredit && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500">Limit ₹</label>
                <input type="number" className="input w-28 py-1.5 text-sm"
                  value={form.creditLimit}
                  onChange={e => set('creditLimit', Number(e.target.value))}/>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-5 pt-5 border-t border-white/5">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
            {saving ? <Spinner size="sm"/> : <><Save className="w-4 h-4"/>Save Customer</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [stats, setStats]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [error, setError]         = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { search: search || undefined };
      if (filter === 'credit') params.isCredit = 'true';

      const [cr, sr] = await Promise.all([
        customersAPI.getAll(params),
        customersAPI.getStats(),
      ]);
      setCustomers(cr.data.data || []);
      setStats(sr.data.data || {});
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to load customers';
      setError(msg);
      toast.error(msg);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, filter]);

  return (
    <div className="space-y-6 animate-fade-in">
      {showModal && (
        <CustomerModal
          customer={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={() => { setShowModal(false); setEditing(null); load(); }}
        />
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Customer Management</h1>
          <p className="page-subtitle">{stats?.total || 0} registered customers</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary btn-sm">
          <Plus className="w-4 h-4"/>Add Customer
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Customers"   value={stats?.total              || 0} icon={Users}     color="teal"  />
        <StatCard title="Credit Customers"  value={stats?.creditCustomers    || 0} icon={CreditCard} color="yellow"/>
        <StatCard title="Credit Balance"    value={`₹${(stats?.totalCreditBalance || 0).toLocaleString('en-IN')}`}
                  icon={TrendingUp} color="red"/>
        <StatCard title="Top Customer"      value={stats?.topCustomers?.[0]?.name || '—'} icon={Users} color="blue"/>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-48">
          <SearchBar value={search} onChange={v => { setSearch(v); }}
            placeholder="Search name or mobile..."/>
        </div>
        {[['all','All'],['credit','Credit Only']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`btn btn-sm ${filter === v ? 'btn-primary' : 'btn-secondary'}`}>{l}</button>
        ))}
      </div>

      {loading ? <PageLoader/> : error ? (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          ❌ {error} — <button onClick={load} className="underline">Retry</button>
        </div>
      ) : customers.length === 0 ? (
        <EmptyState icon={Users} title="No Customers Found"
          description="Add your first customer to start tracking purchase history and credit."
          action={<button onClick={() => setShowModal(true)} className="btn-primary">Add Customer</button>}/>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Customer</th><th>Mobile</th><th>Doctor</th>
                  <th>Visits</th><th>Total Purchases</th><th>Credit</th>
                  <th>Last Visit</th><th></th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c._id}>
                    <td>
                      <p className="text-sm font-semibold text-white">{c.name}</p>
                      <p className="text-xs text-slate-500 capitalize">{c.gender || '—'} · {c.address?.city || '—'}</p>
                    </td>
                    <td className="font-mono text-sm text-slate-300">{c.mobile}</td>
                    <td className="text-xs text-slate-400">{c.doctorName || '—'}</td>
                    <td className="text-sm text-slate-300">{c.totalVisits || 0}</td>
                    <td className="font-mono text-sm text-brand-400">
                      ₹{(c.totalPurchases || 0).toLocaleString('en-IN')}
                    </td>
                    <td>
                      {c.isCredit
                        ? <span className="badge-yellow">₹{(c.creditBalance || 0).toLocaleString('en-IN')} due</span>
                        : <span className="badge-gray">—</span>}
                    </td>
                    <td className="text-xs text-slate-500">
                      {c.lastVisit ? format(new Date(c.lastVisit), 'dd MMM yyyy') : 'Never'}
                    </td>
                    <td>
                      <button
                        onClick={() => { setEditing(c); setShowModal(true); }}
                        className="btn-ghost btn-sm text-xs">
                        Edit
                      </button>
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
