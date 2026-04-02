import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { medicinesAPI } from '../../utils/api';
import { SearchBar, EmptyState, Pagination, PageLoader, StatCard } from '../../components/common/UIComponents';
import { Package, Plus, AlertTriangle, Warehouse, Pill, BarChart3, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import MedicineModal from '../../components/inventory/MedicineModal';

export default function InventoryPage() {
  const [medicines,   setMedicines]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [search,      setSearch]      = useState('');
  const [page,        setPage]        = useState(1);
  const [pagination,  setPagination]  = useState({ total: 0, pages: 1 });
  const [showModal,   setShowModal]   = useState(false);
  const [editing,     setEditing]     = useState(null);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const r = await medicinesAPI.getAll({ search: search || undefined, page, limit: 15 });
      setMedicines(r.data.data       || []);
      setPagination(r.data.pagination || { total: 0, pages: 1 });
    } catch (e) {
      const msg = e.response?.data?.message || e.message || 'Failed to load medicines';
      setError(msg);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, page]);

  const lowStock   = medicines.filter(m => m.currentStock > 0 && m.currentStock <= m.reorderLevel).length;
  const outOfStock = medicines.filter(m => m.currentStock === 0).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {showModal && (
        <MedicineModal medicine={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={()  => { setShowModal(false); setEditing(null); load(); }} />
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Medicine Inventory</h1>
          <p className="page-subtitle">{pagination.total} medicines in database</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/inventory/batches" className="btn-secondary btn-sm"><Warehouse className="w-4 h-4"/>Batches</Link>
          <Link to="/inventory/expiry"  className="btn-secondary btn-sm"><AlertTriangle className="w-4 h-4"/>Expiry</Link>
          <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary btn-sm">
            <Plus className="w-4 h-4"/>Add Medicine
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Medicines" value={pagination.total} icon={Pill}          color="teal"  />
        <StatCard title="Low Stock"        value={lowStock}         icon={AlertTriangle} color="yellow"/>
        <StatCard title="Out of Stock"     value={outOfStock}       icon={Package}       color="red"   />
        <StatCard title="Categories" value={[...new Set(medicines.map(m => m.category))].length} icon={BarChart3} color="blue"/>
      </div>

      <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }}
        placeholder="Search by name, generic, brand..."/>

      {loading ? <PageLoader/> : error ? (
        <div className="card border-red-500/20 bg-red-500/5 flex items-center gap-4 py-6">
          <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0"/>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-300">Failed to load medicines</p>
            <p className="text-xs text-red-400 mt-1">{error}</p>
          </div>
          <button onClick={load} className="btn-secondary btn-sm"><RefreshCw className="w-4 h-4"/>Retry</button>
        </div>
      ) : medicines.length === 0 ? (
        <EmptyState icon={Pill} title="No Medicines Yet"
          description="Start by adding medicines to your inventory database."
          action={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4"/>Add First Medicine</button>}/>
      ) : (
        <>
          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead><tr>
                  <th>Medicine</th><th>Category</th><th>Barcode</th>
                  <th>MRP ₹</th><th>Cost ₹</th><th>Stock</th><th>Reorder</th><th>Status</th><th></th>
                </tr></thead>
                <tbody>
                  {medicines.map(m => (
                    <tr key={m._id}>
                      <td>
                        <p className="text-sm font-semibold text-white">{m.name}</p>
                        <p className="text-xs text-slate-500">{m.genericName} · {m.brand}{m.strength ? ` · ${m.strength}` : ''}</p>
                      </td>
                      <td><span className="badge-gray capitalize text-xs">{m.category}</span></td>
                      <td className="font-mono text-xs text-slate-500">{m.barcode || '—'}</td>
                      <td className="font-mono text-sm">₹{m.pricing?.mrp || 0}</td>
                      <td className="font-mono text-sm text-slate-400">₹{m.pricing?.costPrice || 0}</td>
                      <td>
                        <span className={`font-mono text-sm font-bold ${
                          m.currentStock === 0 ? 'text-red-400' :
                          m.currentStock <= m.reorderLevel ? 'text-yellow-400' : 'text-green-400'}`}>
                          {m.currentStock} {m.unit}
                        </span>
                      </td>
                      <td className="font-mono text-sm text-slate-500">{m.reorderLevel}</td>
                      <td>
                        {m.currentStock === 0
                          ? <span className="badge-red">Out of Stock</span>
                          : m.currentStock <= m.reorderLevel
                          ? <span className="badge-yellow">Low Stock</span>
                          : <span className="badge-green">In Stock</span>}
                      </td>
                      <td>
                        <button onClick={() => { setEditing(m); setShowModal(true); }}
                          className="btn-ghost btn-sm text-xs">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={page} pages={pagination.pages} onChange={setPage}/>
        </>
      )}
    </div>
  );
}
