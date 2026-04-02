import { useEffect, useState } from 'react';
import { reportsAPI } from '../../utils/api';
import { PageLoader, StatCard } from '../../components/common/UIComponents';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, DollarSign, Package, AlertTriangle, BarChart3, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const fmt   = v  => `₹${Number(v || 0).toLocaleString('en-IN')}`;
const COLORS = ['#1e9daa','#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6'];

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color || '#1e9daa' }}>
          {p.name}: {typeof p.value === 'number' && p.value > 99 ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function ReportsPage() {
  const [tab,     setTab]     = useState('sales');
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [range,   setRange]   = useState({ start: '', end: '' });

  const load = async () => {
    setLoading(true); setError('');
    try {
      const p = { startDate: range.start || undefined, endDate: range.end || undefined };
      let r;
      if      (tab === 'sales')  r = await reportsAPI.sales(p);
      else if (tab === 'pl')     r = await reportsAPI.profitLoss(p);
      else if (tab === 'stock')  r = await reportsAPI.stock();
      else if (tab === 'expiry') r = await reportsAPI.expiry();
      setData(r.data.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load report');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [tab, range.start, range.end]);

  const TABS = [['sales','Sales'],['pl','Profit & Loss'],['stock','Stock'],['expiry','Expiry']];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Reports & Analytics</h1><p className="page-subtitle">Business insights and performance</p></div>
        <div className="flex gap-2 flex-wrap">
          <input type="date" className="input text-sm w-36" value={range.start} onChange={e => setRange(p => ({ ...p, start: e.target.value }))}/>
          <input type="date" className="input text-sm w-36" value={range.end}   onChange={e => setRange(p => ({ ...p, end:   e.target.value }))}/>
          {(range.start || range.end) && (
            <button onClick={() => setRange({ start: '', end: '' })} className="btn-secondary btn-sm">Clear</button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`btn btn-sm ${tab === v ? 'btn-primary' : 'btn-secondary'}`}>{l}</button>
        ))}
      </div>

      {loading ? <PageLoader/> : error ? (
        <div className="card border-red-500/20 bg-red-500/5 flex items-center gap-4 py-6">
          <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0"/>
          <div className="flex-1"><p className="text-sm text-red-300">{error}</p></div>
          <button onClick={load} className="btn-secondary btn-sm"><RefreshCw className="w-4 h-4"/>Retry</button>
        </div>
      ) : (
        <>
          {/* Sales Report */}
          {tab === 'sales' && data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Sales"    value={fmt(data.totals?.totalSales)}    icon={DollarSign} color="teal"  />
                <StatCard title="Total Bills"    value={data.totals?.count || 0}          icon={BarChart3}  color="blue"  />
                <StatCard title="Discounts"      value={fmt(data.totals?.totalDiscount)} icon={TrendingUp} color="yellow"/>
                <StatCard title="GST Collected"  value={fmt(data.totals?.totalGst)}      icon={DollarSign} color="green" />
              </div>

              {data.daily?.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="card">
                    <h3 className="text-sm font-semibold text-white font-display mb-4">Daily Sales</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={data.daily}>
                        <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1e9daa" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#1e9daa" stopOpacity={0}/>
                        </linearGradient></defs>
                        <XAxis dataKey="_id" tick={{ fill: '#566880', fontSize: 10 }} axisLine={false} tickLine={false}/>
                        <YAxis tick={{ fill: '#566880', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`}/>
                        <Tooltip content={<Tip/>}/>
                        <Area type="monotone" dataKey="sales" name="sales" stroke="#1e9daa" strokeWidth={2} fill="url(#sg)"/>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="card">
                    <h3 className="text-sm font-semibold text-white font-display mb-4">Payment Methods</h3>
                    {data.byPayment?.length > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height={130}>
                          <PieChart><Pie data={data.byPayment} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="total" paddingAngle={3}>
                            {data.byPayment.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                          </Pie><Tooltip content={<Tip/>}/></PieChart>
                        </ResponsiveContainer>
                        <div className="mt-2 space-y-1">
                          {data.byPayment.map((p, i) => (
                            <div key={p._id} className="flex justify-between text-xs">
                              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }}/><span className="text-slate-400 capitalize">{p._id}</span></div>
                              <span className="font-mono text-white">{fmt(p.total)}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : <p className="text-sm text-slate-500 text-center py-8">No payment data</p>}
                  </div>
                </div>
              ) : (
                <div className="card text-center py-12">
                  <BarChart3 className="w-12 h-12 text-slate-700 mx-auto mb-3"/>
                  <p className="text-slate-400 font-semibold">No sales data yet</p>
                  <p className="text-slate-500 text-sm mt-1">Go to Billing / POS and create your first bill to see reports here.</p>
                </div>
              )}

              {data.topMedicines?.length > 0 && (
                <div className="card">
                  <h3 className="text-sm font-semibold text-white font-display mb-4">Top Medicines by Revenue</h3>
                  <div className="table-wrapper"><table>
                    <thead><tr><th>#</th><th>Medicine</th><th>Qty Sold</th><th>Revenue</th></tr></thead>
                    <tbody>{data.topMedicines.map((m, i) => (
                      <tr key={i}>
                        <td className="text-slate-500">{i + 1}</td>
                        <td className="text-sm text-white">{m.name}</td>
                        <td className="font-mono text-sm">{m.qty}</td>
                        <td className="font-mono text-sm text-brand-400">{fmt(m.revenue)}</td>
                      </tr>
                    ))}</tbody>
                  </table></div>
                </div>
              )}
            </div>
          )}

          {/* Profit & Loss */}
          {tab === 'pl' && data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  ['Revenue',      data.revenue,       'text-green-400',  'bg-green-500/10',  'border-green-500/20' ],
                  ['Cost of Goods',data.cogs,          'text-red-400',    'bg-red-500/10',    'border-red-500/20'   ],
                  ['Gross Profit', data.grossProfit,   'text-blue-400',   'bg-blue-500/10',   'border-blue-500/20'  ],
                  ['Expenses',     data.totalExpenses, 'text-yellow-400', 'bg-yellow-500/10', 'border-yellow-500/20'],
                  ['Net Profit',   data.netProfit,     data.netProfit >= 0 ? 'text-green-400' : 'text-red-400', 'bg-white/5', 'border-white/10'],
                  ['GST',          data.gst,           'text-teal-400',   'bg-teal-500/10',   'border-teal-500/20'  ],
                ].map(([l, v, c, bg, border]) => (
                  <div key={l} className={`card ${bg} border ${border}`}>
                    <p className={`text-2xl font-bold font-display ${c}`}>{fmt(v)}</p>
                    <p className="text-xs text-slate-400 mt-1">{l}</p>
                  </div>
                ))}
              </div>
              {data.revenue === 0 && (
                <div className="card text-center py-10">
                  <p className="text-slate-400">No sales recorded yet. Create bills in Billing / POS to see P&L.</p>
                </div>
              )}
            </div>
          )}

          {/* Stock Report */}
          {tab === 'stock' && data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Medicines"  value={data.medicines?.length || 0}   icon={Package}       color="teal"  />
                <StatCard title="Low Stock"         value={data.lowStockCount || 0}        icon={AlertTriangle} color="yellow"/>
                <StatCard title="Out of Stock"      value={data.outOfStockCount || 0}      icon={Package}       color="red"   />
                <StatCard title="Inventory Value"   value={fmt(data.totalInventoryValue)}  icon={DollarSign}    color="green" />
              </div>
              {data.medicines?.length === 0 ? (
                <div className="card text-center py-10">
                  <p className="text-slate-400">No medicines in inventory yet. Go to Inventory to add medicines.</p>
                </div>
              ) : (
                <>
                  {data.outOfStock?.length > 0 && (
                    <div className="card border-red-500/20">
                      <h3 className="text-sm font-semibold text-red-400 font-display mb-3">🔴 Out of Stock ({data.outOfStock.length})</h3>
                      <div className="flex flex-wrap gap-2">{data.outOfStock.map(m => <span key={m._id} className="badge-red">{m.name}</span>)}</div>
                    </div>
                  )}
                  {data.lowStock?.length > 0 && (
                    <div className="card">
                      <h3 className="text-sm font-semibold text-yellow-400 font-display mb-3">🟡 Low Stock ({data.lowStock.length})</h3>
                      <div className="table-wrapper"><table>
                        <thead><tr><th>Medicine</th><th>Current Stock</th><th>Reorder Level</th></tr></thead>
                        <tbody>{data.lowStock.map(m => (
                          <tr key={m._id}>
                            <td className="text-sm text-white">{m.name}</td>
                            <td className="font-mono text-sm text-yellow-400">{m.currentStock} {m.unit}</td>
                            <td className="font-mono text-sm text-slate-500">{m.reorderLevel}</td>
                          </tr>
                        ))}</tbody>
                      </table></div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Expiry Report */}
          {tab === 'expiry' && data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[['Expired',data.expired?.length||0,'text-red-400','bg-red-500/10','border-red-500/20'],
                  ['≤30 Days',data.within30?.length||0,'text-orange-400','bg-orange-500/10','border-orange-500/20'],
                  ['≤60 Days',data.within60?.length||0,'text-yellow-400','bg-yellow-500/10','border-yellow-500/20'],
                  ['≤90 Days',data.within90?.length||0,'text-blue-400','bg-blue-500/10','border-blue-500/20']].map(([l,v,c,bg,border])=>(
                  <div key={l} className={`card ${bg} border ${border}`}>
                    <p className={`text-2xl font-bold font-display ${c}`}>{v}</p>
                    <p className="text-xs text-slate-400 mt-1">{l}</p>
                  </div>
                ))}
              </div>
              {(data.expired?.length + data.within30?.length + data.within60?.length) === 0 ? (
                <div className="card text-center py-12">
                  <p className="text-green-400 text-lg">✅ No medicines expiring soon!</p>
                  <p className="text-slate-500 text-sm mt-1">All batches have more than 60 days before expiry.</p>
                </div>
              ) : (
                [['🔴 Expired',data.expired||[]],['🟠 ≤30 Days',data.within30||[]],['🟡 ≤60 Days',data.within60||[]]].map(([title,batches])=>(
                  batches.length > 0 && (
                    <div key={title} className="card">
                      <h3 className="text-sm font-semibold text-white font-display mb-4">{title} ({batches.length})</h3>
                      <div className="table-wrapper"><table>
                        <thead><tr><th>Medicine</th><th>Batch #</th><th>Qty Available</th><th>Expiry Date</th></tr></thead>
                        <tbody>{batches.map(b=>(
                          <tr key={b._id}>
                            <td className="text-sm text-white">{b.medicine?.name||'—'}</td>
                            <td className="font-mono text-xs text-slate-300">{b.batchNumber}</td>
                            <td className="font-mono text-sm text-yellow-400">{b.availableQty}</td>
                            <td className="text-sm text-red-400">{b.expiryDate ? new Date(b.expiryDate).toLocaleDateString('en-IN') : '—'}</td>
                          </tr>
                        ))}</tbody>
                      </table></div>
                    </div>
                  )
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
