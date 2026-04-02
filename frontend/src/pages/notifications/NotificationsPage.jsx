import { useEffect, useState } from 'react';
import { notificationsAPI } from '../../utils/api';
import { PageLoader, EmptyState } from '../../components/common/UIComponents';
import {
  Bell, CheckCheck, AlertTriangle, Package,
  DollarSign, ShoppingCart, RefreshCw, Info
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const TYPE_CONFIG = {
  low_stock: { icon: Package,       color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  expiry:    { icon: AlertTriangle, color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20'   },
  payment:   { icon: DollarSign,    color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20' },
  order:     { icon: ShoppingCart,  color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20'  },
  sale:      { icon: DollarSign,    color: 'text-teal-400',   bg: 'bg-teal-500/10',   border: 'border-teal-500/20'  },
  system:    { icon: Info,          color: 'text-slate-400',  bg: 'bg-white/5',       border: 'border-white/10'     },
};

const PRIORITY_COLOR = {
  critical: 'bg-red-500',
  high:     'bg-orange-500',
  medium:   'bg-yellow-500',
  low:      'bg-slate-500',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [generating,  setGenerating]  = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter,      setFilter]      = useState('all');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const params = { limit: 100 };
      if (filter === 'unread') params.unread = 'true';
      const r = await notificationsAPI.getAll(params);
      setNotifications(r.data.data       || []);
      setUnreadCount(r.data.unreadCount  || 0);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load notifications');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const markRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications(ns => ns.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications(ns => ns.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch { toast.error('Failed'); }
  };

  const generateAlerts = async () => {
    setGenerating(true);
    try {
      const r = await notificationsAPI.generate();
      toast.success(r.data.message || 'Alerts scanned successfully');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Scan failed');
    } finally { setGenerating(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">
            {unreadCount > 0 ? `${unreadCount} unread · ` : ''}{notifications.length} total
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={generateAlerts} disabled={generating} className="btn-secondary btn-sm">
            <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`}/>
            {generating ? 'Scanning...' : 'Scan Alerts'}
          </button>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="btn-secondary btn-sm">
              <CheckCheck className="w-4 h-4"/>Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Info box explaining what alerts are */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-brand-500/5 border border-brand-500/20">
        <Info className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5"/>
        <div className="text-sm text-slate-400">
          <span className="text-brand-400 font-medium">How alerts work: </span>
          Click <strong className="text-white">Scan Alerts</strong> to check your inventory for low stock and near-expiry medicines.
          Alerts are also auto-generated when you make a sale.
          You need to add medicines and batches in Inventory first.
        </div>
      </div>

      <div className="flex gap-2">
        {[['all','All'],['unread','Unread']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`btn btn-sm ${filter === v ? 'btn-primary' : 'btn-secondary'}`}>{l}</button>
        ))}
      </div>

      {loading ? <PageLoader/> : error ? (
        <div className="card border-red-500/20 bg-red-500/5 flex items-center gap-4 py-6">
          <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0"/>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-300">Failed to load notifications</p>
            <p className="text-xs text-red-400 mt-0.5">{error}</p>
          </div>
          <button onClick={load} className="btn-secondary btn-sm"><RefreshCw className="w-4 h-4"/>Retry</button>
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No Notifications Yet"
          description="Click 'Scan Alerts' to check for low stock and near-expiry warnings in your inventory."
          action={
            <button onClick={generateAlerts} disabled={generating} className="btn-primary">
              <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`}/>
              {generating ? 'Scanning...' : 'Scan Now'}
            </button>
          }
        />
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const cfg  = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
            const Icon = cfg.icon;
            return (
              <div
                key={n._id}
                onClick={() => !n.isRead && markRead(n._id)}
                className={`card border ${cfg.border} flex items-start gap-4 transition-all
                  ${!n.isRead
                    ? `${cfg.bg} cursor-pointer hover:opacity-90`
                    : 'bg-white/[0.01] opacity-60'
                  }`}
              >
                <div className={`w-10 h-10 rounded-xl ${cfg.bg} border ${cfg.border}
                  flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <Icon className={`w-5 h-5 ${cfg.color}`}/>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="text-sm font-semibold text-white">{n.title}</p>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_COLOR[n.priority] || 'bg-slate-500'}`}/>
                      <span className="text-xs text-slate-500 capitalize">{n.priority}</span>
                    </div>
                    {!n.isRead && (
                      <span className="badge-blue text-[10px]">New</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{n.message}</p>
                  <p className="text-xs text-slate-600 mt-1.5">
                    {n.createdAt ? format(new Date(n.createdAt), 'dd MMM yyyy, hh:mm a') : ''}
                    {!n.isRead && (
                      <span className="ml-2 text-brand-500">· Click to mark as read</span>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
