import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import { Building2, User, Lock, Save, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [saving,  setSaving]  = useState(false);
  const [pwSaving,setPwSaving]= useState(false);
  const [showPw,  setShowPw]  = useState(false);

  const [profile, setProfile] = useState({
    name: '', company: { name:'', gstNumber:'', licenseNumber:'', phone:'',
      address:{ street:'', city:'', state:'', pincode:'' } },
    contactPerson: { name:'', phone:'', designation:'' },
  });

  const [pw, setPw] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        company: {
          name:          user.company?.name          || '',
          gstNumber:     user.company?.gstNumber     || '',
          licenseNumber: user.company?.licenseNumber || '',
          phone:         user.company?.phone         || '',
          address: {
            street:  user.company?.address?.street  || '',
            city:    user.company?.address?.city    || '',
            state:   user.company?.address?.state   || '',
            pincode: user.company?.address?.pincode || '',
          },
        },
        contactPerson: {
          name:        user.contactPerson?.name        || '',
          phone:       user.contactPerson?.phone       || '',
          designation: user.contactPerson?.designation || '',
        },
      });
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await authAPI.updateProfile(profile);
      await refreshUser();
      toast.success('Profile updated!');
    } catch (e) { toast.error(e.response?.data?.message || 'Update failed'); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!pw.currentPassword || !pw.newPassword) { toast.error('Fill all password fields'); return; }
    if (pw.newPassword.length < 6) { toast.error('New password must be at least 6 characters'); return; }
    if (pw.newPassword !== pw.confirmPassword) { toast.error('Passwords do not match'); return; }
    setPwSaving(true);
    try {
      await authAPI.changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      toast.success('Password changed!');
      setPw({ currentPassword:'', newPassword:'', confirmPassword:'' });
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setPwSaving(false); }
  };

  const setC = (k, v) => setProfile(p => ({ ...p, company: { ...p.company, [k]: v } }));
  const setA = (k, v) => setProfile(p => ({ ...p, company: { ...p.company, address: { ...p.company.address, [k]: v } } }));
  const setCP = (k, v) => setProfile(p => ({ ...p, contactPerson: { ...p.contactPerson, [k]: v } }));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile & Company</h1>
          <p className="page-subtitle">Update your account and company information</p>
        </div>
      </div>

      {/* Personal */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20
            flex items-center justify-center">
            <User className="w-5 h-5 text-brand-400"/>
          </div>
          <h2 className="text-sm font-bold text-white font-display">Personal Information</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group col-span-2">
            <label className="label">Full Name</label>
            <input className="input" value={profile.name}
              onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}/>
          </div>
          <div className="form-group">
            <label className="label">Email</label>
            <input className="input opacity-60" value={user?.email || ''} disabled/>
          </div>
          <div className="form-group">
            <label className="label">Role</label>
            <input className="input opacity-60 capitalize" value={user?.role || ''} disabled/>
          </div>
        </div>
      </div>

      {/* Company */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20
            flex items-center justify-center">
            <Building2 className="w-5 h-5 text-brand-400"/>
          </div>
          <h2 className="text-sm font-bold text-white font-display">Company Details</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            ['Company Name',    'name',          'Ramesh Pharmaceuticals Ltd'],
            ['GST Number',      'gstNumber',     '27XXXXX0000X1ZX'],
            ['Drug License No.','licenseNumber', 'MH-XXXX-2024'],
            ['Phone',           'phone',         '+91 98765 43210'],
          ].map(([l, k, ph]) => (
            <div key={k} className="form-group">
              <label className="label">{l}</label>
              <input className="input" value={profile.company[k]||''} placeholder={ph}
                onChange={e => setC(k, e.target.value)}/>
            </div>
          ))}
          <div className="form-group col-span-2">
            <label className="label">Street Address</label>
            <input className="input" value={profile.company.address.street||''}
              onChange={e => setA('street', e.target.value)}/>
          </div>
          {[['City','city'],['State','state'],['PIN Code','pincode']].map(([l, k]) => (
            <div key={k} className="form-group">
              <label className="label">{l}</label>
              <input className="input" value={profile.company.address[k]||''}
                onChange={e => setA(k, e.target.value)}/>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Person */}
      <div className="card">
        <h2 className="text-sm font-bold text-white font-display mb-5">Contact Person</h2>
        <div className="grid grid-cols-3 gap-4">
          {[['Name','name'],['Phone','phone'],['Designation','designation']].map(([l, k]) => (
            <div key={k} className="form-group">
              <label className="label">{l}</label>
              <input className="input" value={profile.contactPerson[k]||''}
                onChange={e => setCP(k, e.target.value)}/>
            </div>
          ))}
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary">
        {saving ? <Spinner size="sm"/> : <><Save className="w-4 h-4"/> Save Changes</>}
      </button>

      {/* Change Password */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20
            flex items-center justify-center">
            <Lock className="w-5 h-5 text-red-400"/>
          </div>
          <h2 className="text-sm font-bold text-white font-display">Change Password</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 max-w-md">
          {[
            ['Current Password','currentPassword'],
            ['New Password',    'newPassword'],
            ['Confirm Password','confirmPassword'],
          ].map(([l, k]) => (
            <div key={k} className="form-group">
              <label className="label">{l}</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className="input pr-11"
                  value={pw[k]} onChange={e => setPw(p => ({ ...p, [k]: e.target.value }))}/>
                <button type="button" onClick={() => setShowPw(x => !x)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                  {showPw ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </button>
              </div>
            </div>
          ))}
          <button onClick={handleChangePassword} disabled={pwSaving} className="btn-danger w-fit">
            {pwSaving ? <Spinner size="sm"/> : <><Lock className="w-4 h-4"/> Update Password</>}
          </button>
        </div>
      </div>
    </div>
  );
}
