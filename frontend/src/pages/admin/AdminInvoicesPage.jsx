import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { invoicesAPI } from '../../utils/api';
import { EmptyState, PageLoader, StatusBadge, Pagination, ErrorBox } from '../../components/common/UIComponents';
import { FileText, Eye } from 'lucide-react';
import { format } from 'date-fns';

const fmt = v => `₹${Number(v||0).toLocaleString('en-IN')}`;

export default function AdminInvoicesPage() {
  const [invoices,   setInvoices]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [page,       setPage]       = useState(1);
  const [pagination, setPagination] = useState({ total:0, pages:1 });

  const load = async () => {
    setLoading(true); setError('');
    try {
      const r = await invoicesAPI.getAll({ page, limit:20 });
      setInvoices(r.data.data || []);
      setPagination(r.data.pagination || { total:0, pages:1 });
    } catch (e) { setError(e.response?.data?.message||'Failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page]);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">All Invoices</h1>
          <p className="page-subtitle">{pagination.total} invoices on platform</p>
        </div>
      </div>

      {loading ? <PageLoader/> : error ? <ErrorBox message={error} onRetry={load}/> :
        invoices.length === 0 ? (
          <EmptyState icon={FileText} title="No Invoices" description="Invoices appear once sellers generate them from delivered orders."/>
        ) : (
          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead><tr>
                  <th>Invoice #</th><th>Seller</th><th>Buyer</th>
                  <th>Total</th><th>Paid</th><th>Due</th><th>Status</th><th>Date</th><th></th>
                </tr></thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv._id}>
                      <td className="font-mono text-xs text-brand-400">{inv.invoiceNumber}</td>
                      <td className="text-sm text-slate-300">{inv.seller?.company?.name||inv.seller?.name||'—'}</td>
                      <td className="text-sm text-slate-300">{inv.buyer?.company?.name||inv.buyer?.name||'—'}</td>
                      <td className="font-mono text-sm font-bold">{fmt(inv.grandTotal)}</td>
                      <td className="font-mono text-sm text-green-400">{fmt(inv.amountPaid)}</td>
                      <td className={`font-mono text-sm ${inv.amountDue>0?'text-red-400':'text-slate-500'}`}>{fmt(inv.amountDue)}</td>
                      <td><StatusBadge status={inv.paymentStatus}/></td>
                      <td className="text-xs text-slate-500">{inv.createdAt?format(new Date(inv.createdAt),'dd MMM yyyy'):'—'}</td>
                      <td>
                        <Link to={`/invoices/${inv._id}`} className="btn-ghost btn-sm text-xs">
                          <Eye className="w-3.5 h-3.5"/> View
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
