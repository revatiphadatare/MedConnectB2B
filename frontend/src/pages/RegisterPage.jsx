import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';

const ROLES = [
  { value: 'manufacturer', label: 'Manufacturer', desc: 'I manufacture medicines'           },
  { value: 'distributor',  label: 'Distributor',  desc: 'I distribute medicines in bulk'    },
  { value: 'pharmacy',     label: 'Pharmacy',     desc: 'I run a retail pharmacy'           },
  { value: 'hospital',     label: 'Hospital',     desc: 'I manage hospital procurement'     },
];

const EMPTY_FORM = {
  name:            '',
  email:           '',
  password:        '',
  confirmPassword: '',
  role:            'pharmacy',
  company: {
    name:          '',
    gstNumber:     '',
    licenseNumber: '',
    phone:         '',
    address: {
      street:  '',
      city:    '',
      state:   '',
      pincode: '',
    },
  },
};

export default function RegisterPage() {
  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [form,    setForm]    = useState(EMPTY_FORM);

  const { register } = useAuth();
  const navigate     = useNavigate();

  const set  = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setC = (k, v) => setForm(p => ({ ...p, company: { ...p.company, [k]: v } }));
  const setA = (k, v) => setForm(p => ({
    ...p,
    company: { ...p.company, address: { ...p.company.address, [k]: v } },
  }));

  const validateStep = () => {
    if (step === 1) {
      if (!form.name.trim())             { toast.error('Full name is required');           return false; }
      if (!form.email.trim())            { toast.error('Email address is required');       return false; }
      if (!/\S+@\S+\.\S+/.test(form.email)) { toast.error('Enter a valid email address'); return false; }
      if (form.password.length < 6)      { toast.error('Password must be at least 6 characters'); return false; }
      if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return false; }
    }
    if (step === 2) {
      if (!form.company.name.trim())     { toast.error('Company name is required');        return false; }
    }
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await register({
        name:     form.name.trim(),
        email:    form.email.trim().toLowerCase(),
        password: form.password,
        role:     form.role,
        company:  form.company,
      });
      toast.success('Registration successful! Awaiting admin approval.');
      navigate('/dashboard');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const STEPS = ['Account', 'Company', 'Review'];

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center">
            <Activity className="w-4 h-4 text-white"/>
          </div>
          <span className="text-lg font-bold font-display text-white">MedChain</span>
        </div>

        {/* Step progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center
                text-xs font-bold transition-all
                ${step > i+1  ? 'bg-green-500 text-white'
                : step === i+1 ? 'bg-brand-500 text-white'
                               : 'bg-white/5 text-slate-500'}`}>
                {step > i+1 ? <Check className="w-3.5 h-3.5"/> : i+1}
              </div>
              <span className={`text-xs font-medium transition-colors
                ${step === i+1 ? 'text-white' : 'text-slate-500'}`}>
                {s}
              </span>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-px bg-white/5 mx-1"/>
              )}
            </div>
          ))}
        </div>

        <div className="card">

          {/* ── Step 1: Account Details ──────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold font-display text-white mb-1">Create Your Account</h2>
              <p className="text-sm text-slate-500 mb-5">Fill in your personal details to get started</p>

              <div className="form-group">
                <label className="label">Full Name *</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="Your full name"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="label">Email Address *</label>
                <input
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="your@email.com"
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label className="label">Select Your Role *</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {ROLES.map(r => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => set('role', r.value)}
                      className={`p-3 rounded-xl border text-left transition-all
                        ${form.role === r.value
                          ? 'border-brand-500 bg-brand-500/10'
                          : 'border-white/10 bg-white/[0.02] hover:border-white/20'}`}
                    >
                      <p className={`text-sm font-semibold leading-none
                        ${form.role === r.value ? 'text-brand-400' : 'text-white'}`}>
                        {r.label}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{r.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="label">Password *</label>
                  <input
                    type="password"
                    className="input"
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    placeholder="Min 6 characters"
                    autoComplete="new-password"
                  />
                </div>
                <div className="form-group">
                  <label className="label">Confirm Password *</label>
                  <input
                    type="password"
                    className="input"
                    value={form.confirmPassword}
                    onChange={e => set('confirmPassword', e.target.value)}
                    placeholder="Repeat password"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Company Details ───────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold font-display text-white mb-1">Company Details</h2>
              <p className="text-sm text-slate-500 mb-5">Tell us about your business</p>

              <div className="form-group">
                <label className="label">Company / Firm Name *</label>
                <input
                  className="input"
                  value={form.company.name}
                  onChange={e => setC('name', e.target.value)}
                  placeholder="Your company or firm name"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="label">GST Number</label>
                  <input
                    className="input"
                    value={form.company.gstNumber}
                    onChange={e => setC('gstNumber', e.target.value)}
                    placeholder="15-digit GST number"
                  />
                </div>
                <div className="form-group">
                  <label className="label">Drug License No.</label>
                  <input
                    className="input"
                    value={form.company.licenseNumber}
                    onChange={e => setC('licenseNumber', e.target.value)}
                    placeholder="License number"
                  />
                </div>
                <div className="form-group">
                  <label className="label">Phone Number</label>
                  <input
                    className="input"
                    value={form.company.phone}
                    onChange={e => setC('phone', e.target.value)}
                    placeholder="10-digit mobile number"
                  />
                </div>
                <div className="form-group">
                  <label className="label">City</label>
                  <input
                    className="input"
                    value={form.company.address.city}
                    onChange={e => setA('city', e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div className="form-group">
                  <label className="label">State</label>
                  <input
                    className="input"
                    value={form.company.address.state}
                    onChange={e => setA('state', e.target.value)}
                    placeholder="State"
                  />
                </div>
                <div className="form-group">
                  <label className="label">PIN Code</label>
                  <input
                    className="input"
                    value={form.company.address.pincode}
                    onChange={e => setA('pincode', e.target.value)}
                    placeholder="6-digit PIN"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Review ────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold font-display text-white mb-1">Review & Submit</h2>
              <p className="text-sm text-slate-500 mb-5">Confirm your details before submitting</p>

              <div className="rounded-xl border border-white/5 overflow-hidden">
                {[
                  ['Full Name',   form.name],
                  ['Email',       form.email],
                  ['Role',        form.role],
                  ['Company',     form.company.name],
                  ['GST Number',  form.company.gstNumber     || 'Not provided'],
                  ['Drug License',form.company.licenseNumber || 'Not provided'],
                  ['Phone',       form.company.phone         || 'Not provided'],
                  ['City',        form.company.address.city  || 'Not provided'],
                  ['State',       form.company.address.state || 'Not provided'],
                ].map(([label, value], i) => (
                  <div key={label}
                    className={`flex justify-between items-center px-4 py-3 text-sm
                      ${i % 2 === 0 ? 'bg-white/[0.01]' : 'bg-transparent'}
                      border-b border-white/5 last:border-0`}>
                    <span className="text-slate-500">{label}</span>
                    <span className="text-white font-medium capitalize">{value}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-xs text-yellow-400 leading-relaxed">
                  <strong className="text-yellow-300">Important:</strong> Your account will require
                  approval from an admin before you can place orders or access full features.
                  You will be able to log in immediately but trading access is granted after approval.
                </p>
              </div>
            </div>
          )}

          {/* ── Navigation buttons ────────────────────────── */}
          <div className="flex gap-3 mt-6 pt-5 border-t border-white/5">
            {step > 1 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="btn-secondary flex-1 justify-center"
              >
                <ChevronLeft className="w-4 h-4"/> Back
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={() => { if (validateStep()) setStep(s => s + 1); }}
                className="btn-primary flex-1 justify-center"
              >
                Continue <ChevronRight className="w-4 h-4"/>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary flex-1 justify-center"
              >
                {loading
                  ? <Spinner size="sm"/>
                  : <><Check className="w-4 h-4"/> Submit Registration</>
                }
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">
            Sign in here
          </Link>
        </p>

      </div>
    </div>
  );
}
