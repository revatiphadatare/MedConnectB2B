import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { analyticsAPI, usersAPI, ordersAPI } from '../../utils/api';
import { StatCard, PageLoader, StatusBadge, RoleBadge, ErrorBox } from '../../components/common/UIComponents';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Users, ShoppingCart, Package, DollarSign, TrendingUp,
  ClipboardCheck, CheckCircle, Shield, AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const ROLE_COLORS = {
  manufacturer:'#3b82f6', distributor:'#1e9daa',
  pharmacy:'#22c55e', hospital:'#f59e0b',
};
const fmt = v => `₹${Number(v||0).toLocaleString('en-IN')}`;
const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color||'#1e9daa' }}>
          {p.name}: {p.value > 100 ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState(null);
  const [pending,   setPending]   = useState([]);
  const [orders,    setOrders]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [ar, pr, or] = await Promise.allSettled([
          analyticsAPI.admin(),
          usersAPI.getPending(),
          ordersAPI.getAll({ limit: 5 }),
        ]);
        if (ar.status === 'fulfilled') setAnalytics(ar.value.data.data);
        if (pr.status === 'fulfilled') setPending(pr.value.data.data || []);
        if (or.status === 'fulfilled') setOrders(or.value.data.data  || []);
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <PageLoader/>;

  const monthly = (analytics?.monthlyOrders||[]).map(m => ({
    name:    MONTHS[(m._id?.month||1)-1],
    revenue: m.revenue||0,
    orders:  m.count||0,
  }));

  const roleData = (analytics?.roleBreakdown||[]).map(r => ({
    name:  r._id,
    value: r.count,
  }));

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Shield className="w-6 h-6 text-red-400"/> Admin Dashboard
          </h1>
          <p className="page-subtitle">Platform overview · {format(new Date(),'EEEE dd MMM yyyy')}</p>
        </div>
      </div>

      {error && <ErrorBox message={error}/>}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users"    value={analytics?.totalUsers||0}    icon={Users}       color="blue"  />
        <StatCard title="Total Orders"   value={analytics?.totalOrders||0}   icon={ShoppingCart}color="teal"  />
        <StatCard title="Active Products"value={analytics?.totalProducts||0} icon={Package}     color="green" />
        <StatCard title="Platform Revenue" value={fmt(analytics?.totalRevenue||0)} icon={DollarSign} color="yellow"/>
      </div>

      {/* Pending approvals alert */}
      {pending.length > 0 && (
        <div className="card border-yellow-500/20 bg-yellow-500/5 flex items-center gap-4">
          <AlertTriangle className="w-8 h-8 text-yellow-400 flex-shrink-0"/>
          <div className="flex-1">
            <p className="text-sm font-semibold text-yellow-300">
              {pending.length} user{pending.length>1?'s':''} waiting for approval
            </p>
            <p className="text-xs text-yellow-500 mt-0.5">Review and approve new registrations</p>
          </div>
          <Link to="/admin/pending" className="btn-primary btn-sm">
            Review Now
          </Link>
        </div>
      )}

      {/* Charts */}
      {monthly.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card lg:col-span-2">
            <h3 className="text-sm font-semibold text-white font-display mb-4">Monthly Revenue</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#1e9daa" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#1e9daa" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fill:'#566880', fontSize:11 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:'#566880', fontSize:11 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `₹${(v/1000).toFixed(0)}k`}/>
                <Tooltip content={<Tip/>}/>
                <Area type="monotone" dataKey="revenue" name="revenue"
                  stroke="#1e9daa" strokeWidth={2} fill="url(#rg)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3 className="text-sm font-semibold text-white font-display mb-4">Users by Role</h3>
            {roleData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={roleData} cx="50%" cy="50%" innerRadius={35} outerRadius={60}
                      dataKey="value" paddingAngle={3}>
                      {roleData.map((r, i) => (
                        <Cell key={i} fill={ROLE_COLORS[r.name] || '#64748b'}/>
                      ))}
                    </Pie>
                    <Tooltip content={<Tip/>}/>
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1.5">
                  {roleData.map((r, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: ROLE_COLORS[r.name]||'#64748b' }}/>
                        <span className="text-slate-400 capitalize">{r.name}</span>
                      </div>
                      <span className="font-mono text-white">{r.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-40">
                <p className="text-slate-600 text-sm">No users yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { to:'/admin/pending',  icon:ClipboardCheck, label:'Approve Users',  count:pending.length, color:'yellow' },
          { to:'/admin/users',    icon:Users,          label:'All Users',       count:analytics?.totalUsers||0, color:'blue'   },
          { to:'/admin/orders',   icon:ShoppingCart,   label:'All Orders',      count:analytics?.totalOrders||0, color:'teal'   },
          { to:'/admin/products', icon:Package,        label:'All Products',    count:analytics?.totalProducts||0, color:'green'  },
        ].map(({ to, icon:Icon, label, count, color }) => (
          <Link key={to} to={to}
            className="card card-hover flex flex-col items-center gap-2 p-4 text-center group cursor-pointer">
            <Icon className={`w-6 h-6 ${
              color==='yellow'?'text-yellow-400':
              color==='blue'?'text-blue-400':
              color==='teal'?'text-teal-400':'text-green-400'}`}/>
            <p className="text-lg font-bold text-white font-display">{count}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      {orders.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white font-display">Recent Orders</h3>
            <Link to="/admin/orders" className="text-xs text-brand-400 hover:text-brand-300">View all →</Link>
          </div>
          <div className="table-wrapper">
            <table>
              <thead><tr>
                <th>Order #</th><th>Buyer</th><th>Seller</th><th>Amount</th><th>Status</th>
              </tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o._id}>
                    <td className="font-mono text-xs text-brand-400">{o.orderNumber}</td>
                    <td className="text-sm text-slate-300">{o.buyer?.company?.name||o.buyer?.name||'—'}</td>
                    <td className="text-sm text-slate-300">{o.seller?.company?.name||o.seller?.name||'—'}</td>
                    <td className="font-mono text-sm">{fmt(o.grandTotal)}</td>
                    <td><StatusBadge status={o.status}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {orders.length === 0 && !error && (
        <div className="card border-brand-500/20 bg-brand-500/5 text-center py-10">
          <TrendingUp className="w-12 h-12 text-brand-400/30 mx-auto mb-3"/>
          <p className="text-slate-400 font-semibold">Platform is ready!</p>
          <p className="text-slate-600 text-sm mt-1">
            Revenue and order analytics will appear once users start placing orders.
          </p>
          <Link to="/admin/pending" className="btn-primary btn-sm mt-4 inline-flex">
            Approve Users to Get Started
          </Link>
        </div>
      )}
    </div>
  );
}
