import { AlertTriangle, CheckCircle, Clock, Package, Truck, X, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import Spinner from './Spinner';

// ── StatCard ──────────────────────────────────────────────
export function StatCard({ title, value, icon: Icon, color = 'teal', subtitle }) {
  const colors = {
    teal:   { bg:'bg-teal-500/10',   border:'border-teal-500/20',   text:'text-teal-400'   },
    blue:   { bg:'bg-blue-500/10',   border:'border-blue-500/20',   text:'text-blue-400'   },
    green:  { bg:'bg-green-500/10',  border:'border-green-500/20',  text:'text-green-400'  },
    yellow: { bg:'bg-yellow-500/10', border:'border-yellow-500/20', text:'text-yellow-400' },
    red:    { bg:'bg-red-500/10',    border:'border-red-500/20',    text:'text-red-400'    },
    purple: { bg:'bg-purple-500/10', border:'border-purple-500/20', text:'text-purple-400' },
  };
  const c = colors[color] || colors.teal;
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-6 h-6 ${c.text}`}/>
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-white font-display truncate">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{title}</p>
        {subtitle && <p className="text-xs text-slate-600 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ── StatusBadge ───────────────────────────────────────────
export function StatusBadge({ status }) {
  const map = {
    pending:        'badge-yellow',
    confirmed:      'badge-blue',
    processing:     'badge-blue',
    shipped:        'badge-teal',
    delivered:      'badge-green',
    cancelled:      'badge-red',
    returned:       'badge-red',
    paid:           'badge-green',
    partially_paid: 'badge-yellow',
    overdue:        'badge-red',
    active:         'badge-green',
    inactive:       'badge-gray',
    discontinued:   'badge-red',
    out_of_stock:   'badge-red',
    approved:       'badge-green',
    rejected:       'badge-red',
  };
  return (
    <span className={`${map[status] || 'badge-gray'} capitalize`}>
      {status?.replace(/_/g,' ') || '—'}
    </span>
  );
}

// ── RoleBadge ─────────────────────────────────────────────
export function RoleBadge({ role }) {
  const map = {
    admin:'badge-red', manufacturer:'badge-blue',
    distributor:'badge-teal', pharmacy:'badge-green', hospital:'badge-yellow',
  };
  return <span className={`${map[role]||'badge-gray'} capitalize text-[10px]`}>{role}</span>;
}

// ── PageLoader ────────────────────────────────────────────
export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <Spinner size="lg"/>
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-slate-600"/>
      </div>
      <h3 className="text-base font-semibold text-white font-display">{title}</h3>
      {description && <p className="text-sm text-slate-500 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────
export function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-2 pt-4 mt-2 border-t border-white/5">
      <p className="text-xs text-slate-500">Page {page} of {pages}</p>
      <div className="flex gap-1">
        <button onClick={() => onChange(page-1)} disabled={page<=1}
          className="btn-ghost btn-sm p-1.5 disabled:opacity-30">
          <ChevronLeft className="w-4 h-4"/>
        </button>
        {Array.from({ length: Math.min(5, pages) }, (_, i) => {
          const p = pages <= 5 ? i+1 : Math.max(1, page-2) + i;
          if (p > pages) return null;
          return (
            <button key={p} onClick={() => onChange(p)}
              className={`btn btn-sm px-3 py-1.5 text-xs ${p===page?'btn-primary':'btn-ghost'}`}>
              {p}
            </button>
          );
        })}
        <button onClick={() => onChange(page+1)} disabled={page>=pages}
          className="btn-ghost btn-sm p-1.5 disabled:opacity-30">
          <ChevronRight className="w-4 h-4"/>
        </button>
      </div>
    </div>
  );
}

// ── SearchBar ─────────────────────────────────────────────
export function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="relative">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"/>
      <input
        className="input pl-10"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button onClick={() => onChange('')}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
          <X className="w-4 h-4"/>
        </button>
      )}
    </div>
  );
}

// ── ConfirmModal ──────────────────────────────────────────
export function ConfirmModal({ open, title, message, onConfirm, onCancel, danger }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="card w-full max-w-sm border-white/10 shadow-2xl">
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
            ${danger ? 'bg-red-500/10 border border-red-500/20' : 'bg-brand-500/10 border border-brand-500/20'}`}>
            <AlertTriangle className={`w-5 h-5 ${danger ? 'text-red-400' : 'text-brand-400'}`}/>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-display">{title}</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onCancel} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={onConfirm}
            className={`flex-1 justify-center ${danger ? 'btn-danger' : 'btn-primary'} btn`}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ErrorBox ──────────────────────────────────────────────
export function ErrorBox({ message, onRetry }) {
  return (
    <div className="card border-red-500/20 bg-red-500/5 flex items-center gap-4 py-6">
      <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0"/>
      <div className="flex-1">
        <p className="text-sm font-semibold text-red-300">Something went wrong</p>
        <p className="text-xs text-red-400 mt-0.5">{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary btn-sm">Retry</button>
      )}
    </div>
  );
}
