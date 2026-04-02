import { useEffect, useState } from 'react';
import { ordersAPI } from '../../utils/api';
import { EmptyState, PageLoader, StatusBadge, Pagination, ErrorBox } from '../../components/common/UIComponents';
import { ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';

const STATUSES = ['pending','confirmed','processing','shipped','delivered','cancelled'];
const fmt = v => `₹${Number(v||0).toLocaleString('en-IN')}`;

export default function AdminOrdersPage() {
  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [status,     setStatus]     = useState('');
  const [page,       setPage]       = useState(1);
  const [pagination, setPagination] = useState({ total:0, pages:1 });

  const load = async () => {
    setLoading(true); setError('');
    try {
      const r = await ordersAPI.getAll({ status: status||undefined, page, limit:20 });
      setOrders(r.data.data || []);
      setPagination(r.data.pagination || { total:0, pages:1 });
    } catch (e) { setError(e.response?.data?.message||'Failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [status, page]);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">All Orders</h1>
          <p className="page-subtitle">{pagination.total} total orders on platform</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => { setStatus(''); setPage(1); }}
          className={`btn btn-sm ${!status ? 'btn-primary':'btn-secondary'}`}>All</button>
        {STATUSES.map(s => (
          <button key={s} onClick={() => { setStatus(s); setPage(1); }}
            className={`btn btn-sm capitalize ${status===s ? 'btn-primary':'btn-secondary'}`}>{s}</button>
        ))}
      </div>

      {loading ? <PageLoader/> : error ? <ErrorBox message={error} onRetry={load}/> :
        orders.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="No Orders" description="No orders match the current filter."/>
        ) : (
          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead><tr>
                  <th>Order #</th><th>Buyer</th><th>Seller</th>
                  <th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th>
                </tr></thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o._id}>
                      <td className="font-mono text-xs text-brand-400">{o.orderNumber}</td>
                      <td className="text-sm text-slate-300">{o.buyer?.company?.name||o.buyer?.name||'—'}</td>
                      <td className="text-sm text-slate-300">{o.seller?.company?.name||o.seller?.name||'—'}</td>
                      <td className="text-xs text-slate-500">{o.items?.length||0}</td>
                      <td className="font-mono text-sm">{fmt(o.grandTotal)}</td>
                      <td><StatusBadge status={o.paymentStatus}/></td>
                      <td><StatusBadge status={o.status}/></td>
                      <td className="text-xs text-slate-500">
                        {o.createdAt ? format(new Date(o.createdAt),'dd MMM yyyy') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pages={pagination.pages} onChange={setPage}/>
          </div>
        )}
    </div>
  );
}
