import { Link } from 'react-router-dom';
import {
  Activity, ArrowRight, Shield, Truck, BarChart3,
  Building2, Package, Pill, CheckCircle,
  Users, TrendingUp, Globe, Clock,
} from 'lucide-react';

const FEATURES = [
  { icon:Shield,    title:'Verified Partners',  color:'teal',
    desc:'Every organisation is admin-verified before onboarding on the platform.' },
  { icon:Truck,     title:'Real-Time Tracking', color:'blue',
    desc:'Live order status from placement to delivery across the supply chain.' },
  { icon:BarChart3, title:'Smart Analytics',    color:'purple',
    desc:'Role-specific dashboards with revenue trends and inventory insights.' },
  { icon:Package,   title:'Inventory Alerts',   color:'green',
    desc:'Near-expiry alerts, low stock warnings and automatic reorder tracking.' },
  { icon:Globe,     title:'Pan-India Network',  color:'yellow',
    desc:'Connect with verified pharmaceutical partners across all states.' },
  { icon:Clock,     title:'24/7 Operations',    color:'red',
    desc:'Round-the-clock availability for critical supply chain operations.' },
];

const ROLES = [
  { icon:Pill,      role:'Manufacturer', emoji:'🏭',
    desc:'List products, manage catalogues, set PTR/MRP pricing and track orders.',
    features:['Product catalogue','Batch tracking','Distributor orders','Revenue analytics'] },
  { icon:Truck,     role:'Distributor',  emoji:'🚚',
    desc:'Source from manufacturers, manage bulk inventory and fulfil orders.',
    features:['Bulk procurement','Inventory management','POS billing','Invoice management'] },
  { icon:Building2, role:'Pharmacy',     emoji:'💊',
    desc:'Order directly from manufacturers, manage retail inventory and billing.',
    features:['Direct procurement','Medicine inventory','Retail POS','GST compliance'] },
  { icon:Users,     role:'Hospital',     emoji:'🏥',
    desc:'Procure medicines in bulk, manage hospital inventory and patient dispensing.',
    features:['Bulk procurement','Hospital inventory','Patient billing','Expiry tracking'] },
];

const COLOR = {
  teal:  'bg-teal-500/10   border-teal-500/20   text-teal-400',
  blue:  'bg-blue-500/10   border-blue-500/20   text-blue-400',
  purple:'bg-purple-500/10 border-purple-500/20 text-purple-400',
  green: 'bg-green-500/10  border-green-500/20  text-green-400',
  yellow:'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  red:   'bg-red-500/10    border-red-500/20    text-red-400',
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ── Nav ─────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/90 backdrop-blur-md
        border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center">
              <Activity className="w-4 h-4 text-white"/>
            </div>
            <span className="text-lg font-bold font-display">MedChain</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login"    className="btn-ghost btn-sm">Sign In</Link>
            <Link to="/register" className="btn-primary btn-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(30,157,170,0.12),transparent_70%)]"/>
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
            bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse"/>
            B2B Pharmaceutical Supply Chain Platform
          </div>
          <h1 className="text-5xl lg:text-7xl font-bold font-display leading-tight mb-6">
            Connect the{' '}
            <span className="text-brand-400">Pharma</span>
            <br/>Supply Chain
          </h1>
          <p className="text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto mb-10">
            A unified platform for manufacturers, distributors, pharmacies and hospitals
            to trade medicines, manage inventory and generate GST-compliant invoices.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/register" className="btn-primary btn-lg">
              Start Free <ArrowRight className="w-5 h-5"/>
            </Link>
            <Link to="/login" className="btn-secondary btn-lg">
              Sign In to Account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Role cards ──────────────────────────────────── */}
      <section className="py-20 px-6 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-display mb-3">Built for Every Role</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Each role gets a dedicated dashboard with features tailored to their workflow.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {ROLES.map(({ icon:Icon, role, emoji, desc, features }) => (
              <div key={role} className="card card-hover flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{emoji}</div>
                  <div>
                    <p className="text-base font-bold font-display text-white">{role}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
                <ul className="space-y-1.5 mt-auto">
                  {features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-slate-500">
                      <CheckCircle className="w-3.5 h-3.5 text-brand-400 flex-shrink-0"/>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-display mb-3">Platform Features</h2>
            <p className="text-slate-400">Everything you need to manage pharmaceutical operations</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon:Icon, title, desc, color }) => (
              <div key={title} className="card card-hover flex gap-4">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center
                  flex-shrink-0 ${COLOR[color]}`}>
                  <Icon className="w-5 h-5"/>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white font-display mb-1">{title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-slate-900/50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold font-display mb-4">
            Ready to modernise your supply chain?
          </h2>
          <p className="text-slate-400 mb-8">
            Join manufacturers, distributors and pharmacies already trading on MedChain.
            Registration is free and takes less than 2 minutes.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/register" className="btn-primary btn-lg">
              Create Free Account <ArrowRight className="w-5 h-5"/>
            </Link>
            <Link to="/login" className="btn-secondary btn-lg">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center
          justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-brand-500 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-white"/>
            </div>
            <span className="text-sm font-bold font-display text-white">MedChain</span>
          </div>
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} MedChain B2B Pharmaceutical Platform
          </p>
          <Link to="/admin/login" className="text-xs text-slate-700 hover:text-slate-500 transition-colors">
            Admin Portal
          </Link>
        </div>
      </footer>

    </div>
  );
}
