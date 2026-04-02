import { useEffect, useState } from 'react';
import { usersAPI } from '../../utils/api';
import { PageLoader, EmptyState, RoleBadge, ErrorBox } from '../../components/common/UIComponents';
import { ClipboardCheck, CheckCircle, XCircle, Building2, Mail, Phone } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function AdminPendingPage() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [acting,  setActing]  = useState(null);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const r = await usersAPI.getPending();
      setUsers(r.data.data || []);
    } catch (e) { setError(e.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handle = async (id, approved) => {
    setActing(id);
    try {
      await usersAPI.approve(id, { approved });
      toast.success(approved ? 'User approved!' : 'User rejected');
      load();
    } catch { toast.error('Action failed'); }
    finally { setActing(null); }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pending Approvals</h1>
          <p className="page-subtitle">{users.length} users waiting for review</p>
        </div>
      </div>

      {loading ? <PageLoader/> : error ? <ErrorBox message={error} onRetry={load}/> :
        users.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="All Clear!"
            description="No pending approvals. All registered users have been reviewed."/>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map(u => (
              <div key={u._id} className="card flex flex-col gap-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-white">{u.name}</p>
                    <RoleBadge role={u.role}/>
                  </div>
                  <span className="badge-yellow text-[10px]">Pending</span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-600 flex-shrink-0"/>
                    <span className="truncate">{u.company?.name || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-600 flex-shrink-0"/>
                    <span className="truncate">{u.email}</span>
                  </div>
                  {u.company?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-600 flex-shrink-0"/>
                      <span>{u.company.phone}</span>
                    </div>
                  )}
                  <p className="text-slate-600">
                    Registered {u.createdAt ? format(new Date(u.createdAt), 'dd MMM yyyy') : '—'}
                  </p>
                </div>

                {u.company?.gstNumber && (
                  <div className="px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5">
                    <p className="text-[10px] text-slate-600 uppercase tracking-wide">GST</p>
                    <p className="text-xs font-mono text-slate-300">{u.company.gstNumber}</p>
                  </div>
                )}

                <div className="flex gap-2 mt-auto pt-3 border-t border-white/5">
                  <button onClick={() => handle(u._id, false)} disabled={acting === u._id}
                    className="btn-danger flex-1 justify-center text-xs">
                    <XCircle className="w-3.5 h-3.5"/> Reject
                  </button>
                  <button onClick={() => handle(u._id, true)} disabled={acting === u._id}
                    className="btn-primary flex-1 justify-center text-xs">
                    <CheckCircle className="w-3.5 h-3.5"/> Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
