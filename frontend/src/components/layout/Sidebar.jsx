import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Package, ShoppingCart, FileText,
  Warehouse, Users, TrendingUp, ClipboardCheck, LogOut,
  Activity, Building2, Pill, Shield, Receipt, Bell,
  BarChart3, BookOpen, Truck, UserCheck,
} from 'lucide-react';
import { RoleBadge } from '../common/UIComponents';

/*
  STRICT ROLE-BASED NAVIGATION
  ─────────────────────────────
  Admin        → Platform management only
  Manufacturer → Sell: products, orders, invoices, reports
  Distributor  → Buy + sell: products, orders, invoices, inventory, billing, suppliers, customers, reports
  Pharmacy     → Buy: products, orders, invoices, inventory, billing, suppliers, customers, reports
  Hospital     → Buy: products, orders, invoices, inventory, billing, suppliers, reports (no customers)
*/

const NAV = {
  admin: [
    { group: 'Overview', links: [
      { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard'                  },
      { to: '/admin/analytics', icon: TrendingUp,      label: 'Analytics'                  },
      { to: '/notifications',   icon: Bell,            label: 'Notifications', badge: true },
    ]},
    { group: 'Platform Management', links: [
      { to: '/admin/pending',   icon: ClipboardCheck, label: 'Pending Approvals', badge: true },
      { to: '/admin/users',     icon: Users,          label: 'Manage Users'                  },
      { to: '/admin/products',  icon: Package,        label: 'View Products'                 },
      { to: '/admin/orders',    icon: ShoppingCart,   label: 'All Orders'                    },
      { to: '/admin/invoices',  icon: Receipt,        label: 'All Invoices'                  },
    ]},
  ],

  manufacturer: [
    { group: 'My Business', links: [
      { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard'                      },
      { to: '/my-products',  icon: Package,         label: 'My Products'                    },
      { to: '/orders',       icon: ShoppingCart,    label: 'Received Orders'                },
      { to: '/invoices',     icon: FileText,        label: 'Invoices'                       },
      { to: '/notifications',icon: Bell,            label: 'Notifications', badge: true     },
    ]},
    { group: 'Finance', links: [
      { to: '/reports',      icon: BarChart3,       label: 'Sales Reports'                  },
    ]},
  ],

  distributor: [
    { group: 'Trading', links: [
      { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard'                      },
      { to: '/products',     icon: Pill,            label: 'Browse & Order Medicines'       },
      { to: '/orders',       icon: ShoppingCart,    label: 'B2B Orders'                     },
      { to: '/invoices',     icon: FileText,        label: 'B2B Invoices'                   },
      { to: '/notifications',icon: Bell,            label: 'Notifications', badge: true     },
    ]},
    { group: 'Warehouse', links: [
      { to: '/inventory',          icon: Warehouse,      label: 'Medicine Database'          },
      { to: '/inventory/batches',  icon: Package,        label: 'Stock & Batches'            },
      { to: '/inventory/expiry',   icon: ClipboardCheck, label: 'Expiry Management'          },
    ]},
    { group: 'Operations', links: [
      { to: '/billing',    icon: Receipt,    label: 'Billing / POS'                         },
      { to: '/purchase',   icon: Truck,      label: 'Suppliers & Purchase'                  },
      { to: '/customers',  icon: UserCheck,  label: 'Customers'                             },
    ]},
    { group: 'Finance', links: [
      { to: '/reports',    icon: BarChart3,  label: 'Reports'                               },
      { to: '/accounting', icon: BookOpen,   label: 'Accounting'                            },
    ]},
  ],

  pharmacy: [
    { group: 'Procurement', links: [
      { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard'                      },
      { to: '/products',     icon: Pill,            label: 'Browse Medicines'               },
      { to: '/orders',       icon: ShoppingCart,    label: 'Purchase Orders'                },
      { to: '/invoices',     icon: FileText,        label: 'Purchase Invoices'              },
      { to: '/notifications',icon: Bell,            label: 'Notifications', badge: true     },
    ]},
    { group: 'Stock Management', links: [
      { to: '/inventory',         icon: Warehouse,      label: 'Medicine Inventory'         },
      { to: '/inventory/batches', icon: Package,        label: 'Batches & Stock'            },
      { to: '/inventory/expiry',  icon: ClipboardCheck, label: 'Expiry Tracking'            },
    ]},
    { group: 'Retail', links: [
      { to: '/billing',    icon: Receipt,    label: 'Billing / POS'                         },
      { to: '/purchase',   icon: Truck,      label: 'Suppliers'                             },
      { to: '/customers',  icon: UserCheck,  label: 'Customer Records'                      },
    ]},
    { group: 'Finance', links: [
      { to: '/reports',    icon: BarChart3,  label: 'Reports'                               },
      { to: '/accounting', icon: BookOpen,   label: 'Accounting'                            },
    ]},
  ],

  hospital: [
    { group: 'Procurement', links: [
      { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard'                      },
      { to: '/products',     icon: Pill,            label: 'Procure Medicines'              },
      { to: '/orders',       icon: ShoppingCart,    label: 'Purchase Orders'                },
      { to: '/invoices',     icon: FileText,        label: 'Purchase Invoices'              },
      { to: '/notifications',icon: Bell,            label: 'Notifications', badge: true     },
    ]},
    { group: 'Medicine Store', links: [
      { to: '/inventory',         icon: Warehouse,      label: 'Medicine Store'             },
      { to: '/inventory/batches', icon: Package,        label: 'Batches & Stock'            },
      { to: '/inventory/expiry',  icon: ClipboardCheck, label: 'Expiry Tracking'            },
    ]},
    { group: 'Dispensing', links: [
      { to: '/billing',    icon: Receipt,    label: 'Patient Billing'                       },
      { to: '/purchase',   icon: Truck,      label: 'Suppliers'                             },
    ]},
    { group: 'Finance', links: [
      { to: '/reports',    icon: BarChart3,  label: 'Reports'                               },
      { to: '/accounting', icon: BookOpen,   label: 'Accounting'                            },
    ]},
  ],
};

function SideLink({ to, icon: Icon, label, badge, count, onClose }) {
  return (
    <NavLink
      to={to}
      onClick={onClose}
      className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
    >
      <Icon className="w-4 h-4 flex-shrink-0"/>
      <span className="flex-1 text-sm">{label}</span>
      {badge && count > 0 && (
        <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500
          text-white text-[10px] font-bold flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </NavLink>
  );
}

export default function Sidebar({ onClose, pendingCount = 0, notifCount = 0 }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const groups = NAV[user?.role] || [];

  const getCount = (to) => {
    if (to.includes('pending'))       return pendingCount;
    if (to.includes('notifications')) return notifCount;
    return 0;
  };

  return (
    <aside className="flex flex-col h-full bg-slate-900 border-r border-white/5 w-64 flex-shrink-0">

      {/* Logo */}
      <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center
          shadow-lg shadow-brand-500/30">
          <Activity className="w-5 h-5 text-white"/>
        </div>
        <div>
          <p className="text-lg font-bold font-display text-white leading-none">MedChain</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">B2B Platform</p>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03]">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold
            text-sm font-display flex-shrink-0
            ${user?.role === 'admin'
              ? 'bg-red-500/20 text-red-400'
              : 'bg-brand-500/20 text-brand-400'}`}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate leading-none">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate mt-0.5">{user?.company?.name}</p>
            <div className="mt-1"><RoleBadge role={user?.role}/></div>
          </div>
          {user?.role === 'admin' && (
            <Shield className="w-4 h-4 text-red-400 flex-shrink-0"/>
          )}
        </div>

        {!user?.isApproved && user?.role !== 'admin' && (
          <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-yellow-500/10
            border border-yellow-500/20 text-xs text-yellow-400">
            ⏳ Pending admin approval
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {groups.map(({ group, links }) => (
          <div key={group}>
            <p className="text-[10px] uppercase tracking-widest text-slate-600
              font-semibold px-3 mb-1.5">{group}</p>
            <div className="space-y-0.5">
              {links.map(l => (
                <SideLink
                  key={l.to}
                  {...l}
                  count={getCount(l.to)}
                  onClose={onClose}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom links */}
      <div className="px-3 py-3 border-t border-white/5 space-y-0.5">
        <NavLink
          to="/profile"
          onClick={onClose}
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Building2 className="w-4 h-4"/>
          <span>Profile & Company</span>
        </NavLink>
        <button
          onClick={() => {
            logout();
            navigate(user?.role === 'admin' ? '/admin/login' : '/login');
          }}
          className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <LogOut className="w-4 h-4"/>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
