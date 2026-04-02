import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsAPI, ordersAPI } from '../utils/api';
import { StatCard, PageLoader, StatusBadge, ErrorBox } from '../components/common/UIComponents';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  ShoppingCart, DollarSign, TrendingUp, CheckCircle,
  ClipboardList, Package, Pill, ArrowRight, AlertTriangle,
  Receipt, Warehouse, FileText,
} from 'lucide-react';
import { format } from 'date-fns';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmt    = v => `₹${Number(v || 0).toLocaleString('en-IN')}`;

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color || '#1e9daa' }}>
          {p.name}: {typeof p.value === 'number' && p.value > 100 ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

// ── Getting started guide per role ────────────────────────
const GUIDES = {
  manufacturer: [
    { icon: Package,      text: 'Add your medicines to the product catalogue', to: '/my-products', btn: 'Add Products'    },
    { icon: ShoppingCart, text: 'Process incoming orders from buyers',          to: '/orders',      btn: 'View Orders'     },
    { icon: FileText,     text: 'Generate invoices for delivered orders',       to: '/invoices',    btn: 'View Invoices'   },
  ],
  distributor: [
    { icon: Pill,         text: 'Browse and order medicines from manufacturers', to: '/products',  btn: 'Browse Medicines' },
    { icon: Warehouse,    text: 'Add stock to your warehouse inventory',         to: '/inventory', btn: 'Add Inventory'    },
    { icon: Receipt,      text: 'Start billing retail customers',                to: '/billing',   btn: 'Open Billing'     },
  ],
  pharmacy: [
    { icon: Pill,         text: 'Order medicines directly from manufacturers',  to: '/products',  btn: 'Browse Medicines' },
    { icon: Warehouse,    text: 'Set up your pharmacy medicine inventory',      to: '/inventory', btn: 'Add Inventory'    },
    { icon: Receipt,      text: 'Start retail billing with GST calculation',   to: '/billing',   btn: 'Open Billing/POS' },
  ],
  hospital: [
    { icon: Pill,         text: 'Procure medicines in bulk from manufacturers', to: '/products',  btn: 'Procure Medicines' },
    { icon: Warehouse,    text: 'Manage your hospital medicine store',          to: '/inventory', btn: 'Medicine Store'    },
    { icon: Receipt,      text: 'Dispense medicines and bill patients',         to: '/billing',   btn: 'Patient Billing'   },
  ],
};

function GettingStarted({ role }) {
  const steps = GUIDES[role] || GUIDES.pharmacy;
  const titles = {
    manufacturer: 'Start selling medicines B2B',
    distributor:  'Set up your distribution business',
    pharmacy:     'Set up your pharmacy',
    hospital:     'Set up hospital procurement',
  };
  return (
    <div className="card border-brand-500/20 bg-brand-500/5">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-brand-400"/>
        </div>
        <div>
          <h3 className="text-sm font-bold text-white font-display">{titles[role]}</h3>
          <p className="text-xs text-slate-500">Follow these steps to get started</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {steps.map(({ icon: Icon, text, to, btn }, i) => (
          <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col gap-3">
            <div className="flex items-start gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-brand-500/20 text-brand-400 text-xs
                font-bold flex items-center justify-center flex-shrink-0 mt-0.5 font-display">
                {i + 1}
              </span>
              <p className="text-sm text-slate-300 leading-snug">{text}</p>
            </div>
            <Link to={to} className="btn-primary btn-sm justify-center mt-auto">
              {btn} <ArrowRight className="w-3.5 h-3.5"/>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Manufacturer-specific dashboard ──────────────────────
function ManufacturerDashboard({ data, orders }) {
  const stats = {
    delivered:  data?.orderStats?.find(s => s._id === 'delivered'),
    pending:    data?.orderStats?.find(s => s._id === 'pending'),
    processing: data?.orderStats?.find(s => s._id === 'processing'),
    shipped:    data?.orderStats?.find(s => s._id === 'shipped'),
  };
  const monthly = (data?.monthlyRevenue || []).map(m => ({
    name:    MONTHS[(m._id?.month || 1) - 1],
    revenue: m.revenue || 0,
    orders:  m.orders  || 0,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue"    value={fmt(data?.totalRevenue || 0)} icon={DollarSign}   color="teal"  />
        <StatCard title="Delivered Orders" value={stats.delivered?.count  || 0} icon={CheckCircle}  color="green" />
        <StatCard title="Pending Orders"   value={stats.pending?.count    || 0} icon={ClipboardList}color="yellow"/>
        <StatCard title="In Processing"    value={(stats.processing?.count || 0) + (stats.shipped?.count || 0)} icon={ShoppingCart} color="blue"/>
      </div>

      {monthly.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card">
            <h3 className="text-sm font-semibold text-white font-display mb-4">Revenue — Last 6 Months</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#1e9daa" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#1e9daa" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fill: '#566880', fontSize: 11 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill: '#566880', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}/>
                <Tooltip content={<ChartTip/>}/>
                <Area type="monotone" dataKey="revenue" name="Revenue"
                  stroke="#1e9daa" strokeWidth={2} fill="url(#rg)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3 className="text-sm font-semibold text-white font-display mb-4">Orders by Status</h3>
            <div className="space-y-3 pt-2">
              {(data?.orderStats || []).map(s => {
                const colors = {
                  delivered:'text-green-400 bg-green-500/10',
                  pending:  'text-yellow-400 bg-yellow-500/10',
                  processing:'text-blue-400 bg-blue-500/10',
                  shipped:  'text-teal-400 bg-teal-500/10',
                  cancelled:'text-red-400 bg-red-500/10',
                };
                return (
                  <div key={s._id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
                    <span className={`text-xs font-medium capitalize px-2.5 py-1 rounded-full ${colors[s._id] || 'text-slate-400 bg-white/5'}`}>
                      {s._id}
                    </span>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">{s.count}</p>
                      <p className="text-xs text-slate-500">{fmt(s.revenue)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {data?.topProducts?.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-white font-display mb-4">Top Selling Products</h3>
          <div className="space-y-2">
            {data.topProducts.map((p, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02]">
                <div className="w-7 h-7 rounded-lg bg-brand-500/10 flex items-center justify-center
                  text-brand-400 font-bold text-xs flex-shrink-0 font-display">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{p.product?.name || '—'}</p>
                  <p className="text-xs text-slate-500">{p.totalQty} units sold</p>
                </div>
                <p className="text-sm font-mono font-bold text-brand-400">{fmt(p.totalRevenue)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Buyer dashboard (distributor / pharmacy / hospital) ───
function BuyerDashboard({ data, orders, role }) {
  const stats = {
    delivered: data?.orderStats?.find(s => s._id === 'delivered'),
    pending:   data?.orderStats?.find(s => s._id === 'pending'),
    shipped:   data?.orderStats?.find(s => s._id === 'shipped'),
  };
  const monthly = (data?.monthlySpend || []).map(m => ({
    name:   MONTHS[(m._id?.month || 1) - 1],
    spent:  m.spent  || 0,
    orders: m.orders || 0,
  }));

  const quickLinks = {
    distributor: [
      { to: '/products',  icon: Pill,      label: 'Order Medicines',    color: 'teal'   },
      { to: '/billing',   icon: Receipt,   label: 'Open Billing/POS',  color: 'blue'   },
      { to: '/inventory', icon: Warehouse, label: 'Check Inventory',   color: 'green'  },
      { to: '/reports',   icon: TrendingUp,label: 'View Reports',      color: 'yellow' },
    ],
    pharmacy: [
      { to: '/products',  icon: Pill,      label: 'Order Medicines',   color: 'teal'   },
      { to: '/billing',   icon: Receipt,   label: 'Open Billing/POS', color: 'blue'   },
      { to: '/inventory', icon: Warehouse, label: 'Medicine Inventory',color: 'green'  },
      { to: '/customers', icon: Package,   label: 'Customer Records',  color: 'yellow' },
    ],
    hospital: [
      { to: '/products',  icon: Pill,      label: 'Procure Medicines', color: 'teal'   },
      { to: '/billing',   icon: Receipt,   label: 'Patient Billing',  color: 'blue'   },
      { to: '/inventory', icon: Warehouse, label: 'Medicine Store',    color: 'green'  },
      { to: '/reports',   icon: TrendingUp,label: 'View Reports',      color: 'yellow' },
    ],
  };

  const links = quickLinks[role] || quickLinks.pharmacy;
  const colorCls = {
    teal:  'bg-teal-500/10 border-teal-500/20 text-teal-400',
    blue:  'bg-blue-500/10 border-blue-500/20 text-blue-400',
    green: 'bg-green-500/10 border-green-500/20 text-green-400',
    yellow:'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Spent"    value={fmt(data?.totalSpent || 0)} icon={DollarSign}   color="teal"  />
        <StatCard title="Total Orders"   value={data?.totalOrders    || 0}  icon={ShoppingCart} color="blue"  />
        <StatCard title="Delivered"      value={stats.delivered?.count || 0}icon={CheckCircle}  color="green" />
        <StatCard title="Pending"        value={stats.pending?.count   || 0}icon={ClipboardList}color="yellow"/>
      </div>

      {/* Quick action tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {links.map(({ to, icon: Icon, label, color }) => (
          <Link key={to} to={to}
            className={`card card-hover flex flex-col items-center gap-3 p-4 text-center
              border ${colorCls[color]} group cursor-pointer`}>
            <Icon className="w-6 h-6"/>
            <span className="text-xs font-medium text-white">{label}</span>
          </Link>
        ))}
      </div>

      {monthly.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-white font-display mb-4">
            Spending — Last 6 Months
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#1e9daa" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#1e9daa" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fill: '#566880', fontSize: 11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill: '#566880', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}/>
              <Tooltip content={<ChartTip/>}/>
              <Area type="monotone" dataKey="spent" name="Spent"
                stroke="#1e9daa" strokeWidth={2} fill="url(#sg)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {data?.topSuppliers?.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-white font-display mb-4">Top Suppliers</h3>
          <div className="space-y-2">
            {data.topSuppliers.map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02]">
                <div className="w-7 h-7 rounded-lg bg-brand-500/10 flex items-center justify-center
                  text-brand-400 font-bold text-xs flex-shrink-0 font-display">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">
                    {s.seller?.company?.name || s.seller?.name || '—'}
                  </p>
                  <p className="text-xs text-slate-500">{s.orderCount} orders</p>
                </div>
                <p className="text-sm font-mono font-bold text-brand-400">{fmt(s.totalSpent)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────
export default function DashboardPage() {
  const { user, isRole } = useAuth();

  // All hooks before any conditional return
  const [data,    setData]    = useState(null);
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const isAdmin        = user?.role === 'admin';
  const isManufacturer = user?.role === 'manufacturer';

  useEffect(() => {
    if (!user || isAdmin) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const [ar, or] = await Promise.allSettled([
        isManufacturer ? analyticsAPI.seller() : analyticsAPI.buyer(),
        ordersAPI.getAll({ limit: 5 }),
      ]);
      if (ar.status === 'fulfilled') setData(ar.value.data.data);
      else setError('Could not load dashboard data');
      if (or.status === 'fulfilled') setOrders(or.value.data.data || []);
      setLoading(false);
    })();
  }, [user?.role]);

  // Admin belongs on /admin/dashboard
  if (isAdmin)  return <Navigate to="/admin/dashboard" replace/>;
  if (loading)  return <PageLoader/>;

  const role = user?.role;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {new Date().getHours() < 12 ? 'Good morning' : 'Good afternoon'},{' '}
            {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="page-subtitle capitalize">
            {role} · {user?.company?.name} · {format(new Date(), 'EEEE, dd MMM yyyy')}
          </p>
        </div>
        {isManufacturer && (
          <Link to="/my-products" className="btn-primary btn-sm">
            <Package className="w-4 h-4"/> My Products
          </Link>
        )}
        {isRole('pharmacy', 'hospital', 'distributor') && (
          <Link to="/products" className="btn-primary btn-sm">
            <Pill className="w-4 h-4"/> Browse Medicines
          </Link>
        )}
      </div>

      {/* Approval warning */}
      {!user?.isApproved && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0"/>
          <div>
            <p className="text-sm font-semibold text-yellow-300">Account Pending Approval</p>
            <p className="text-xs text-yellow-500 mt-0.5">
              Your account is under review. An admin will activate your full access shortly.
            </p>
          </div>
        </div>
      )}

      {error && <ErrorBox message={error} onRetry={() => window.location.reload()}/>}

      {/* Role-specific content */}
      {orders.length === 0 && !error ? (
        <GettingStarted role={role}/>
      ) : isManufacturer ? (
        <ManufacturerDashboard data={data} orders={orders}/>
      ) : (
        <BuyerDashboard data={data} orders={orders} role={role}/>
      )}

      {/* Recent orders table — always shown when orders exist */}
      {orders.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white font-display">Recent Orders</h3>
            <Link to="/orders" className="text-xs text-brand-400 hover:text-brand-300">
              View all →
            </Link>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>{isManufacturer ? 'Buyer' : 'Seller'}</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o._id}>
                    <td>
                      <Link to={`/orders/${o._id}`}
                        className="font-mono text-xs text-brand-400 hover:text-brand-300">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="text-slate-300 text-sm">
                      {isManufacturer
                        ? o.buyer?.company?.name  || o.buyer?.name  || '—'
                        : o.seller?.company?.name || o.seller?.name || '—'}
                    </td>
                    <td className="font-mono text-sm">{fmt(o.grandTotal)}</td>
                    <td><StatusBadge status={o.status}/></td>
                    <td className="text-slate-500 text-xs">
                      {o.createdAt ? format(new Date(o.createdAt), 'dd MMM yyyy') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
