import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productsAPI } from '../utils/api';
import { EmptyState, PageLoader, SearchBar, Pagination, StatusBadge, ErrorBox } from '../components/common/UIComponents';
import { Pill, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = ['tablet','capsule','syrup','injection','ointment','drops','inhaler','powder','other'];

export default function ProductsPage() {
  const [products,   setProducts]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [search,     setSearch]     = useState('');
  const [category,   setCategory]   = useState('');
  const [page,       setPage]       = useState(1);
  const [pagination, setPagination] = useState({ total:0, pages:1 });

  const load = async () => {
    setLoading(true); setError('');
    try {
      const r = await productsAPI.getAll({
        search: search || undefined,
        category: category || undefined,
        page, limit: 12,
      });
      setProducts(r.data.data || []);
      setPagination(r.data.pagination || { total:0, pages:1 });
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load products');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, category, page]);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Medicine Catalogue</h1>
          <p className="page-subtitle">{pagination.total} products available</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-48">
          <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }}
            placeholder="Search by name, brand, generic..."/>
        </div>
        <select className="input w-40 text-sm" value={category}
          onChange={e => { setCategory(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
        </select>
      </div>

      {loading ? <PageLoader/> : error ? (
        <ErrorBox message={error} onRetry={load}/>
      ) : products.length === 0 ? (
        <EmptyState icon={Pill} title="No Products Found"
          description="No medicines match your search. Try different keywords."
          action={<button onClick={() => { setSearch(''); setCategory(''); }} className="btn-secondary">Clear Filters</button>}/>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map(p => (
              <Link key={p._id} to={`/products/${p._id}`}
                className="card card-hover group cursor-pointer flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/10
                    flex items-center justify-center flex-shrink-0
                    group-hover:bg-brand-500/20 transition-colors">
                    <Pill className="w-6 h-6 text-brand-400"/>
                  </div>
                  <StatusBadge status={p.status}/>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white leading-snug line-clamp-2">{p.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{p.genericName}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{p.brand} · {p.strength}</p>
                </div>
                <div className="flex items-end justify-between border-t border-white/5 pt-3">
                  <div>
                    <p className="text-xs text-slate-500">PTR</p>
                    <p className="text-lg font-bold font-display text-brand-400">
                      ₹{p.pricing?.ptr || 0}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">MRP ₹{p.pricing?.mrp || 0}</p>
                    <p className="text-xs text-slate-600">Min: {p.minOrderQty} units</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <Pagination page={page} pages={pagination.pages} onChange={setPage}/>
        </>
      )}
    </div>
  );
}
