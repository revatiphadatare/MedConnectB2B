import { useEffect, useState } from 'react';
import { analyticsAPI } from '../../utils/api';
import { PageLoader, ErrorBox, StatCard } from '../../components/common/UIComponents';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Users, ShoppingCart, Package } from 'lucide-react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const COLORS = ['#3b82f6','#1e9daa','#22c55e','#f59e0b','#ef4444'];
const fmt = v => `₹${Number(v||0).toLocaleString('en-IN')}`;

export default function AdminAnalyticsPage() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    analyticsAPI.admin()
      .then(r => setData(r.data.data))
      .catch(e => setError(e.response?.data?.message||'Failed'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader/>;
  if (error)   return <ErrorBox message={error}/>;

  const monthly = (data?.monthlyOrders||[]).map(m => ({
    name: MONTHS[(m._id?.month||1)-1],
    orders: m.count||0,
    revenue: m.revenue||0,
  }));

  const roleData = (data?.roleBreakdown||[]).map(r => ({ name:r._id, value:r.count }));

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Platform Analytics</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users"     value={data?.totalUsers||0}    icon={Users}       color="blue"  />
        <StatCard title="Total Orders"    value={data?.totalOrders||0}   icon={ShoppingCart}color="teal"  />
        <StatCard title="Total Products"  value={data?.totalProducts||0} icon={Package}     color="green" />
        <StatCard title="Total Revenue"   value={fmt(data?.totalRevenue||0)} icon={DollarSign} color="yellow"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-semibold text-white font-display mb-4">Monthly Orders & Revenue</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthly}>
              <XAxis dataKey="name" tick={{ fill:'#566880', fontSize:11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill:'#566880', fontSize:11 }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ background:'#1e293b', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', fontSize:'12px' }}/>
              <Bar dataKey="orders" name="Orders" fill="#1e9daa" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-white font-display mb-4">Users by Role</h3>
          {roleData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={roleData} cx="50%" cy="50%" outerRadius={70} dataKey="value" paddingAngle={3}>
                    {roleData.map((_, i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Pie>
                  <Tooltip contentStyle={{ background:'#1e293b', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', fontSize:'12px' }}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1.5">
                {roleData.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background:COLORS[i%COLORS.length] }}/>
                      <span className="text-slate-400 capitalize">{r.name}</span>
                    </div>
                    <span className="font-mono text-white">{r.value} users</span>
                  </div>
                ))}
              </div>
            </>
          ) : <p className="text-slate-500 text-sm text-center py-10">No user data yet</p>}
        </div>
      </div>
    </div>
  );
}
