import { useEffect, useState } from 'react';
import { productsAPI } from '../../utils/api';
import { EmptyState, StatusBadge, ConfirmModal, PageLoader } from '../../components/common/UIComponents';
import { Package, Plus, Edit, Trash2, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';

const EMPTY_PRODUCT = {
  name: '', genericName: '', brand: '', category: 'tablet', description: '', composition: '',
  strength: '', packSize: '', hsn: '', batchNumber: '', storageConditions: '',
  pricing: { mrp: '', ptr: '', pts: '', gstPercent: 12 },
  minOrderQty: 10, stock: 0, requiresPrescription: false, schedule: 'OTC', status: 'active',
};

export default function ManufacturerProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(EMPTY_PRODUCT);
  const [saving, setSaving]     = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productsAPI.getAll({ limit: 50 });
      setProducts(res.data.data);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY_PRODUCT); setModal(true); };
  const openEdit = (p) => {
    setEditing(p._id);
    setForm({
      ...p,
      pricing: { mrp: p.pricing?.mrp, ptr: p.pricing?.ptr, pts: p.pricing?.pts, gstPercent: p.pricing?.gstPercent },
    });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.brand || !form.genericName) { toast.error('Name, brand and generic name are required'); return; }
    setSaving(true);
    try {
      if (editing) {
        await productsAPI.update(editing, form);
        toast.success('Product updated!');
      } else {
        await productsAPI.create(form);
        toast.success('Product created!');
      }
      setModal(false);
      fetchProducts();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await productsAPI.delete(deleteId);
      toast.success('Product deleted');
      fetchProducts();
    } catch { toast.error('Delete failed'); }
    setDeleteId(null);
  };

  const setPricing = (field, val) =>
    setForm((p) => ({ ...p, pricing: { ...p.pricing, [field]: val } }));

  const CATEGORIES = ['tablet','capsule','syrup','injection','ointment','drops','inhaler','other'];
  const SCHEDULES  = ['H','H1','X','G','J','OTC'];

  return (
    <div className="space-y-6 animate-fade-in">
      <ConfirmModal
        open={!!deleteId} danger
        title="Delete Product"
        message="This will permanently delete the product. Are you sure?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      <div className="page-header">
        <div>
          <h1 className="page-title">My Products</h1>
          <p className="page-subtitle">{products.length} products listed</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {loading ? <PageLoader /> : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No Products Yet"
          description="Start by adding your first pharmaceutical product."
          action={<button onClick={openCreate} className="btn-primary">Add Product</button>}
        />
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>MRP</th>
                  <th>PTR</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <p className="text-sm font-medium text-white">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.brand} · {p.strength} · {p.sku}</p>
                    </td>
                    <td className="capitalize text-xs text-slate-400">{p.category}</td>
                    <td className="font-mono text-sm">₹{p.pricing?.mrp}</td>
                    <td className="font-mono text-sm text-brand-400">₹{p.pricing?.ptr}</td>
                    <td className={`font-mono text-sm ${p.stock === 0 ? 'text-red-400' : 'text-green-400'}`}>{p.stock}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td>
                      <div className="flex gap-1.5">
                        <button onClick={() => openEdit(p)} className="btn-ghost btn-sm p-1.5">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteId(p._id)} className="btn-ghost btn-sm p-1.5 text-red-400 hover:text-red-300">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold font-display text-white">{editing ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => setModal(false)} className="btn-ghost p-1.5"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group col-span-2">
                  <label className="label">Product Name *</label>
                  <input className="input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="label">Generic Name *</label>
                  <input className="input" value={form.genericName} onChange={(e) => setForm((p) => ({ ...p, genericName: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="label">Brand *</label>
                  <input className="input" value={form.brand} onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="label">Category</label>
                  <select className="input" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                    {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Schedule</label>
                  <select className="input" value={form.schedule} onChange={(e) => setForm((p) => ({ ...p, schedule: e.target.value }))}>
                    {SCHEDULES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Strength</label>
                  <input className="input" placeholder="500mg" value={form.strength} onChange={(e) => setForm((p) => ({ ...p, strength: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="label">Pack Size</label>
                  <input className="input" placeholder="10 tablets/strip" value={form.packSize} onChange={(e) => setForm((p) => ({ ...p, packSize: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="label">Batch No.</label>
                  <input className="input" value={form.batchNumber} onChange={(e) => setForm((p) => ({ ...p, batchNumber: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="label">HSN Code</label>
                  <input className="input" value={form.hsn} onChange={(e) => setForm((p) => ({ ...p, hsn: e.target.value }))} />
                </div>
              </div>

              <div className="border-t border-white/5 pt-4">
                <p className="label mb-3">Pricing (₹)</p>
                <div className="grid grid-cols-4 gap-3">
                  {[['MRP','mrp'],['PTR','ptr'],['PTS','pts'],['GST %','gstPercent']].map(([l, k]) => (
                    <div key={k} className="form-group">
                      <label className="label">{l}</label>
                      <input type="number" className="input" value={form.pricing[k]}
                        onChange={(e) => setPricing(k, Number(e.target.value))} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="form-group">
                  <label className="label">Stock</label>
                  <input type="number" className="input" value={form.stock} onChange={(e) => setForm((p) => ({ ...p, stock: Number(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label className="label">Min. Order Qty</label>
                  <input type="number" className="input" value={form.minOrderQty} onChange={(e) => setForm((p) => ({ ...p, minOrderQty: Number(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label className="label">Status</label>
                  <select className="input" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                    {['active','inactive','discontinued','out_of_stock'].map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="label">Description</label>
                <textarea rows={2} className="input" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="label">Storage Conditions</label>
                <input className="input" value={form.storageConditions} onChange={(e) => setForm((p) => ({ ...p, storageConditions: e.target.value }))} />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="rx" checked={form.requiresPrescription}
                  onChange={(e) => setForm((p) => ({ ...p, requiresPrescription: e.target.checked }))}
                  className="w-4 h-4 rounded accent-brand-500" />
                <label htmlFor="rx" className="text-sm text-slate-400">Requires Prescription</label>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-5 border-t border-white/5">
              <button onClick={() => setModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
                {saving ? <Spinner size="sm" /> : <><Save className="w-4 h-4" /> {editing ? 'Update' : 'Create'} Product</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
