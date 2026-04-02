import { useState } from 'react';
import { medicinesAPI } from '../../utils/api';
import { X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '../common/Spinner';

const EMPTY = {
  name:'', genericName:'', brand:'', category:'tablet', strength:'', packSize:'',
  barcode:'', hsn:'', sku:'', unit:'strip', schedule:'OTC', requiresPrescription:false,
  description:'', manufacturer:'', storageConditions:'', reorderLevel:10,
  pricing:{ mrp:0, ptr:0, pts:0, costPrice:0, gstPercent:12 },
};

export default function MedicineModal({ medicine, onClose, onSave }) {
  const [form, setForm] = useState(medicine ? {
    ...medicine, pricing:{ ...medicine.pricing }
  } : EMPTY);
  const [saving, setSaving] = useState(false);

  const set = (k,v) => setForm(p => ({ ...p, [k]:v }));
  const setP = (k,v) => setForm(p => ({ ...p, pricing:{ ...p.pricing, [k]:v } }));

  const handleSave = async () => {
    if (!form.name || !form.genericName || !form.brand) {
      toast.error('Name, Generic Name and Brand are required'); return;
    }
    setSaving(true);
    try {
      if (medicine?._id) await medicinesAPI.update(medicine._id, form);
      else await medicinesAPI.create(form);
      toast.success(medicine ? 'Medicine updated!' : 'Medicine added!');
      onSave();
    } catch(e) { toast.error(e.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="card w-full max-w-3xl max-h-[90vh] overflow-y-auto border-white/10 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold font-display text-white">{medicine ? 'Edit Medicine' : 'Add New Medicine'}</h3>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-5 h-5"/></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="form-group col-span-2">
            <label className="label">Medicine Name *</label>
            <input className="input" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Paracetamol 500mg Tablets"/>
          </div>
          <div className="form-group">
            <label className="label">Generic Name *</label>
            <input className="input" value={form.genericName} onChange={e=>set('genericName',e.target.value)} placeholder="e.g. Paracetamol"/>
          </div>
          <div className="form-group">
            <label className="label">Brand *</label>
            <input className="input" value={form.brand} onChange={e=>set('brand',e.target.value)} placeholder="e.g. Crocin"/>
          </div>
          <div className="form-group">
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={e=>set('category',e.target.value)}>
              {['tablet','capsule','syrup','injection','ointment','drops','inhaler','powder','strip','other'].map(c=>(
                <option key={c} value={c} className="capitalize">{c}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Schedule</label>
            <select className="input" value={form.schedule} onChange={e=>set('schedule',e.target.value)}>
              {['H','H1','X','G','J','OTC'].map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Strength</label>
            <input className="input" value={form.strength} onChange={e=>set('strength',e.target.value)} placeholder="e.g. 500mg"/>
          </div>
          <div className="form-group">
            <label className="label">Pack Size</label>
            <input className="input" value={form.packSize} onChange={e=>set('packSize',e.target.value)} placeholder="e.g. 10 tablets/strip"/>
          </div>
          <div className="form-group">
            <label className="label">Unit</label>
            <input className="input" value={form.unit} onChange={e=>set('unit',e.target.value)} placeholder="strip / bottle / vial"/>
          </div>
          <div className="form-group">
            <label className="label">Barcode</label>
            <input className="input" value={form.barcode} onChange={e=>set('barcode',e.target.value)} placeholder="Scan or type barcode"/>
          </div>
          <div className="form-group">
            <label className="label">HSN Code</label>
            <input className="input" value={form.hsn} onChange={e=>set('hsn',e.target.value)} placeholder="30049099"/>
          </div>
          <div className="form-group">
            <label className="label">Manufacturer</label>
            <input className="input" value={form.manufacturer} onChange={e=>set('manufacturer',e.target.value)}/>
          </div>
          <div className="form-group">
            <label className="label">Reorder Level</label>
            <input type="number" className="input" value={form.reorderLevel} onChange={e=>set('reorderLevel',Number(e.target.value))}/>
          </div>
        </div>

        <div className="border-t border-white/5 mt-4 pt-4">
          <p className="label mb-3">Pricing (₹)</p>
          <div className="grid grid-cols-5 gap-3">
            {[['MRP','mrp'],['PTR','ptr'],['PTS','pts'],['Cost Price','costPrice'],['GST %','gstPercent']].map(([l,k])=>(
              <div key={k} className="form-group">
                <label className="label">{l}</label>
                <input type="number" className="input" value={form.pricing[k]} onChange={e=>setP(k,Number(e.target.value))}/>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="form-group col-span-2">
            <label className="label">Storage Conditions</label>
            <input className="input" value={form.storageConditions} onChange={e=>set('storageConditions',e.target.value)}/>
          </div>
          <div className="form-group col-span-2">
            <label className="label">Description</label>
            <textarea rows={2} className="input" value={form.description} onChange={e=>set('description',e.target.value)}/>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <input type="checkbox" id="rx" checked={form.requiresPrescription}
            onChange={e=>set('requiresPrescription',e.target.checked)} className="accent-brand-500 w-4 h-4"/>
          <label htmlFor="rx" className="text-sm text-slate-400">Requires Prescription</label>
        </div>

        <div className="flex gap-3 mt-6 pt-5 border-t border-white/5">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
            {saving ? <Spinner size="sm"/> : <><Save className="w-4 h-4"/>{medicine?'Update':'Add Medicine'}</>}
          </button>
        </div>
      </div>
    </div>
  );
}
