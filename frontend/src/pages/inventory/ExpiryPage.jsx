import { useEffect, useState } from 'react';
import { reportsAPI } from '../../utils/api';
import { PageLoader } from '../../components/common/UIComponents';
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const Section = ({ title, batches, color }) => {
  if (!batches || batches.length === 0) return null;
  return (
    <div className="card">
      <h3 className={`text-sm font-bold font-display mb-4 ${color}`}>{title} ({batches.length})</h3>
      <div className="table-wrapper">
        <table>
          <thead><tr><th>Medicine</th><th>Batch #</th><th>Available Qty</th><th>Expiry Date</th><th>Days Left</th></tr></thead>
          <tbody>
            {batches.map(b => {
              const days = Math.ceil((new Date(b.expiryDate) - Date.now()) / 86400000);
              return (
                <tr key={b._id}>
                  <td>
                    <p className="text-sm font-medium text-white">{b.medicine?.name || '—'}</p>
                    <p className="text-xs text-slate-500">{b.medicine?.brand}</p>
                  </td>
                  <td className="font-mono text-xs text-slate-300">{b.batchNumber}</td>
                  <td className="font-mono text-sm text-yellow-400">{b.availableQty}</td>
                  <td className={`text-sm font-medium ${days < 0 ? 'text-red-400' : days <= 30 ? 'text-orange-400' : 'text-yellow-400'}`}>
                    {b.expiryDate ? format(new Date(b.expiryDate), 'dd MMM yyyy') : '—'}
                  </td>
                  <td>
                    {days < 0
                      ? <span className="badge-red">Expired {Math.abs(days)}d ago</span>
                      : <span className="badge-yellow">{days} days left</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function ExpiryPage() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const r = await reportsAPI.expiry();
      setData(r.data.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load expiry data');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const total = data ? (data.expired?.length || 0) + (data.within30?.length || 0) + (data.within60?.length || 0) + (data.within90?.length || 0) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Expiry Management</h1><p className="page-subtitle">{total} batches need attention</p></div>
        <button onClick={load} className="btn-secondary btn-sm"><RefreshCw className="w-4 h-4"/>Refresh</button>
      </div>

      {loading ? <PageLoader/> : error ? (
        <div className="card border-red-500/20 bg-red-500/5 flex items-center gap-4 py-6">
          <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0"/>
          <div className="flex-1"><p className="text-sm text-red-300">{error}</p></div>
          <button onClick={load} className="btn-secondary btn-sm"><RefreshCw className="w-4 h-4"/>Retry</button>
        </div>
      ) : total === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mb-4"/>
          <h3 className="text-lg font-bold font-display text-white">All Clear!</h3>
          <p className="text-slate-500 mt-1">No medicines expiring within 90 days.</p>
          <p className="text-slate-600 text-sm mt-2">Add batches in Batches & Stock to track expiry dates.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { l: 'Expired',     v: data?.expired?.length  || 0, color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20'    },
              { l: 'Within 30d',  v: data?.within30?.length || 0, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20'  },
              { l: 'Within 60d',  v: data?.within60?.length || 0, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20'  },
              { l: 'Within 90d',  v: data?.within90?.length || 0, color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20'    },
            ].map(({ l, v, color, bg, border }) => (
              <div key={l} className={`card ${bg} border ${border}`}>
                <p className={`text-2xl font-bold font-display ${color}`}>{v}</p>
                <p className="text-xs text-slate-400 mt-1">{l}</p>
              </div>
            ))}
          </div>
          <Section title="🔴 Expired — Remove from Shelf"  batches={data?.expired}  color="text-red-400"/>
          <Section title="🟠 Expiring Within 30 Days"      batches={data?.within30} color="text-orange-400"/>
          <Section title="🟡 Expiring Within 60 Days"      batches={data?.within60} color="text-yellow-400"/>
          <Section title="⚪ Expiring Within 90 Days"      batches={data?.within90} color="text-slate-400"/>
        </>
      )}
    </div>
  );
}
