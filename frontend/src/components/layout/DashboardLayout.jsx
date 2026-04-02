import { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { usersAPI, notificationsAPI } from '../../utils/api';

export default function DashboardLayout() {
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [notifCount,   setNotifCount]   = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    notificationsAPI.getAll({ unread:'true', limit:1 })
      .then(r => setNotifCount(r.data.unreadCount || 0))
      .catch(() => {});
    if (user.role === 'admin') {
      usersAPI.getPending()
        .then(r => setPendingCount(r.data.count || 0))
        .catch(() => {});
    }
  }, [user?._id]);

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}/>
      )}
      <div className={`fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto
        transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <Sidebar onClose={() => setSidebarOpen(false)}
          pendingCount={pendingCount} notifCount={notifCount}/>
      </div>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 flex items-center justify-between px-4 lg:px-6
          border-b border-white/5 bg-slate-950/90 backdrop-blur-md flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden btn-ghost p-2">
            <Menu className="w-5 h-5"/>
          </button>
          <div className="flex-1"/>
          <div className="flex items-center gap-3">
            {user?.role === 'admin' && (
              <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1
                rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"/>
                Super Admin
              </span>
            )}
            <Link to="/notifications" className="btn-ghost p-2 relative">
              <Bell className="w-5 h-5"/>
              {notifCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500
                  text-white text-[9px] font-bold flex items-center justify-center">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </Link>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold
              text-sm font-display
              ${user?.role === 'admin' ? 'bg-red-500/20 text-red-400' : 'bg-brand-500/20 text-brand-400'}`}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 animate-fade-in">
          <Outlet/>
        </main>
      </div>
    </div>
  );
}
