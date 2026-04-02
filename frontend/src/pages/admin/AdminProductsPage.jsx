import { useEffect, useState } from 'react';
import { productsAPI } from '../../utils/api';
import { EmptyState, PageLoader, StatusBadge, Pagination, SearchBar, ErrorBox } from '../../components/common/UIComponents';
import { Package } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminProductsPage() {
  const [products,   setProducts]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [search,     setSearch]     = useState('');
  const [page,       setPage]       = useState(1);
  const [pagination, setPagination] = useState({ total:0, pages:1 });

  const load = async () => {
    setLoading(true); setError('');
    try {
      const r = await productsAPI.getAll({ search: search||undefined, page, limit:20 });
      setProducts(r.data.data || []);
      setPagination(r.data.pagination || { total:0, pages:1 });
    } catch (e) { setError(e.response?.data?.message||'Failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, page]);

  const fmt = v => `₹${Number(v||0).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">All Products</h1>
          <p className="page-subtitle">{pagination.total} products on platform</p>
        </div>
      </div>

      <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search products..."/>

      {loading ? <PageLoader/> : error ? <ErrorBox message={error} onRetry={load}/> :
        products.length === 0 ? (
          <EmptyState icon={Package} title="No Products" description="Products added by manufacturers appear here."/>
        ) : (
          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead><tr>
                  <th>Product</th><th>Brand</th><th>Category</th><th>Manufacturer</th>
                  <th>MRP</th><th>PTR</th><th>Stock</th><th>Status</th>
                </tr></thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p._id}>
                      <td>
                        <p className="text-sm font-semibold text-white">{p.name}</p>
                        <p className="text-xs text-slate-500">{p.genericName} · {p.strength}</p>
                      </td>
                      <td className="text-sm text-slate-300">{p.brand}</td>
                      <td><span className="badge-gray capitalize text-xs">{p.category}</span></td>
                      <td className="text-sm text-slate-300">{p.manufacturer?.company?.name||p.manufacturer?.name||'—'}</td>
                      <td className="font-mono text-sm">{fmt(p.pricing?.mrp)}</td>
                      <td className="font-mono text-sm">{fmt(p.pricing?.ptr)}</td>
                      <td className="font-mono text-sm">{p.stock||0}</td>
                      <td><StatusBadge status={p.status}/></td>
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
