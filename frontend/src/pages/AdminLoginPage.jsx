import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';

export default function AdminLoginPage() {
  const [form,    setForm]    = useState({ email: '', password: '' });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);

  const { adminLogin } = useAuth();
  const navigate       = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email.trim())    { toast.error('Email is required');    return; }
    if (!form.password.trim()) { toast.error('Password is required'); return; }

    setLoading(true);
    try {
      await adminLogin(form.email.trim(), form.password);
      toast.success('Admin access granted');
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/30
            flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-400"/>
          </div>
          <h1 className="text-2xl font-bold font-display text-white">Admin Portal</h1>
          <p className="text-slate-500 mt-1">Restricted access — authorised personnel only</p>
        </div>

        {/* Warning banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-6">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"/>
          <p className="text-xs text-red-400 leading-relaxed">
            This is a restricted admin area. Only authorised system administrators
            can access this portal. Unauthorised access attempts are logged.
          </p>
        </div>

        {/* Login form */}
        <div className="card border-red-500/10">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="form-group">
              <label className="label">Admin Email</label>
              <input
                type="email"
                className="input border-red-500/20 focus:border-red-500"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="Enter admin email"
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="label">Admin Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pr-11 border-red-500/20 focus:border-red-500"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Enter admin password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPw ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn w-full justify-center btn-lg
                bg-red-500 text-white hover:bg-red-400 active:scale-[0.98]
                shadow-lg shadow-red-500/20 disabled:opacity-50"
            >
              {loading ? <Spinner size="sm"/> : <><Shield className="w-4 h-4"/> Access Admin Panel</>}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-600 mt-6">
          Not an admin?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300">
            Go to user login
          </Link>
        </p>

      </div>
    </div>
  );
}
