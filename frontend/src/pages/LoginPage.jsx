import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Eye, EyeOff, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';

export default function LoginPage() {
  const [form,    setForm]    = useState({ email: '', password: '' });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);

  const { login }  = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email.trim())    { toast.error('Email is required');    return; }
    if (!form.password.trim()) { toast.error('Password is required'); return; }

    setLoading(true);
    try {
      const data = await login(form.email.trim(), form.password);
      toast.success(`Welcome back, ${data.name?.split(' ')[0]}!`);
      const from = location.state?.from?.pathname;
      navigate((from && !from.startsWith('/admin')) ? from : '/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">

      {/* Left decorative panel */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 items-center justify-center
        p-12 relative overflow-hidden border-r border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(30,157,170,0.1),transparent_60%)]"/>
        <div className="relative text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center
            mx-auto mb-6 shadow-2xl shadow-brand-500/30">
            <Activity className="w-8 h-8 text-white"/>
          </div>
          <h1 className="text-4xl font-bold font-display text-white mb-2">MedChain</h1>
          <p className="text-slate-400 mb-10">B2B Pharmaceutical Supply Chain Platform</p>
          <div className="grid grid-cols-2 gap-3 text-left">
            {[
              ['🏭','Manufacturers','List & sell medicines in bulk'],
              ['🚚','Distributors', 'Source and supply across regions'],
              ['💊','Pharmacies',   'Direct procurement from makers'],
              ['🏥','Hospitals',    'Enterprise medicine sourcing'],
            ].map(([e, r, d]) => (
              <div key={r} className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="text-xl mb-1.5">{e}</div>
                <p className="text-sm font-semibold text-white font-display">{r}</p>
                <p className="text-xs text-slate-500 mt-0.5">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center">
              <Activity className="w-4 h-4 text-white"/>
            </div>
            <span className="text-lg font-bold font-display text-white">MedChain</span>
          </div>

          <h2 className="text-3xl font-bold font-display text-white mb-1">Sign In</h2>
          <p className="text-slate-500 mb-8">Enter your credentials to access your account</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="form-group">
              <label className="label">Email Address</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="Enter your registered email"
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pr-11"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button type="button" tabIndex={-1}
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPw ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center btn-lg">
              {loading ? <Spinner size="sm"/> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            New to MedChain?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium">
              Create account
            </Link>
          </p>

          {/* Admin portal link — subtle, not prominent */}
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <Link to="/admin/login"
              className="inline-flex items-center gap-1.5 text-xs text-slate-600
                hover:text-slate-400 transition-colors">
              <Shield className="w-3.5 h-3.5"/>
              Admin Portal
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
