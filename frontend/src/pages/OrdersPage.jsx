import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ordersAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { EmptyState, Pagination, StatusBadge, PageLoader } from '../components/common/UIComponents';
import { ShoppingCart, AlertTriangle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const STATUSES = ['pending','confirmed','processing','shipped','delivered','cancelled'];

export default function OrdersPage() {
  const { isRole, user } = useAuth();
  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [status,     setStatus]     = useState('');
  const [page,       setPage]       = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const load = async () => {
    setLoading(true); setError('');
    try {
      const r = await ordersAPI.getAll({
        status: status || undefined,
        page,
        limit: 15,
      });
      setOrders(r.data.data       || []);
      setPagination(r.data.pagination || { total: 0, pages: 1 });
    } catch (e) {
      const msg = e.response?.data?.message || e.message || 'Failed to load orders';
      setError(msg);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [status, page]);

  const isSeller = isRole('manufacturer', 'distributor');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">B2B Orders</h1>
          <p className="page-subtitle">{pagination.total} total orders</p>
        </div>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => { setStatus(''); setPage(1); }}
          className={`btn btn-sm ${!status ? 'btn-primary' : 'btn-secondary'}`}>
          All
        </button>
        {STATUSES.map(s => (
          <button key={s} onClick={() => { setStatus(s); setPage(1); }}
            className={`btn btn-sm capitalize ${status === s ? 'btn-primary' : 'btn-secondary'}`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? <PageLoader/> : error ? (
        <div className="card border-red-500/20 bg-red-500/5 flex items-center gap-4 py-6">
          <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0"/>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-300">Failed to load orders</p>
            <p className="text-xs text-red-400 mt-0.5">{error}</p>
          </div>
          <button onClick={load} className="btn-secondary btn-sm">
            <RefreshCw className="w-4 h-4"/>Retry
          </button>
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="No Orders Yet"
          description={
            isSeller
              ? "Orders placed by buyers for your products will appear here."
              : "Browse the Products catalogue and place your first B2B order."
          }
          action={
            !isSeller ? (
              <Link to="/products" className="btn-primary">
                Browse Products →
              </Link>
            ) : null
          }
        />
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>{isSeller ? 'Buyer' : 'Seller'}</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o._id}>
                    <td>
                      <span className="font-mono text-xs text-brand-400">{o.orderNumber}</span>
                    </td>
                    <td className="text-sm text-slate-300">
                      {isSeller
                        ? o.buyer?.company?.name  || o.buyer?.name  || '—'
                        : o.seller?.company?.name || o.seller?.name || '—'}
                    </td>
                    <td className="text-slate-500 text-xs">
                      {o.items?.length || 0} item{o.items?.length !== 1 ? 's' : ''}
                    </td>
                    <td className="font-mono text-sm">
                      ₹{Number(o.grandTotal || 0).toLocaleString('en-IN')}
                    </td>
                    <td><StatusBadge status={o.paymentStatus}/></td>
                    <td><StatusBadge status={o.status}/></td>
                    <td className="text-slate-500 text-xs">
                      {o.createdAt ? format(new Date(o.createdAt), 'dd MMM yyyy') : '—'}
                    </td>
                    <td>
                      <Link to={`/orders/${o._id}`}
                        className="text-xs text-brand-400 hover:text-brand-300 font-medium">
                        View →
                      </Link>
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
