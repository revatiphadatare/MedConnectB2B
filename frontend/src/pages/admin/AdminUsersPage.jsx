import { useEffect, useState } from 'react';
import { usersAPI } from '../../utils/api';
import { RoleBadge, SearchBar, Pagination, ConfirmModal, PageLoader, EmptyState, ErrorBox } from '../../components/common/UIComponents';
import { Users, CheckCircle, XCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [search,     setSearch]     = useState('');
  const [role,       setRole]       = useState('');
  const [page,       setPage]       = useState(1);
  const [pagination, setPagination] = useState({ total:0, pages:1 });
  const [confirm,    setConfirm]    = useState(null);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const r = await usersAPI.getAll({ search: search||undefined, role: role||undefined, page, limit:15 });
      setUsers(r.data.data || []);
      setPagination(r.data.pagination || { total:0, pages:1 });
    } catch (e) { setError(e.response?.data?.message || 'Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, role, page]);

  const handleApprove = async (id, approved) => {
    try {
      await usersAPI.approve(id, { approved });
      toast.success(approved ? 'User approved ✅' : 'User rejected');
      load();
    } catch { toast.error('Action failed'); }
  };

  const handleToggle = async (id) => {
    try {
      await usersAPI.toggleStatus(id);
      toast.success('Status updated');
      load();
    } catch { toast.error('Action failed'); }
    setConfirm(null);
  };

  const ROLES = ['manufacturer','distributor','pharmacy','hospital'];

  return (
    <div className="space-y-6">
      {confirm && (
        <ConfirmModal open title="Toggle User Status"
          message="Are you sure you want to change this user's active status?"
          onConfirm={() => handleToggle(confirm)}
          onCancel={() => setConfirm(null)} danger/>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">{pagination.total} registered users</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-48">
          <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }}
            placeholder="Search name, email, company..."/>
        </div>
        <select className="input w-40 text-sm" value={role}
          onChange={e => { setRole(e.target.value); setPage(1); }}>
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
        </select>
      </div>

      {loading ? <PageLoader/> : error ? <ErrorBox message={error} onRetry={load}/> :
        users.length === 0 ? (
          <EmptyState icon={Users} title="No Users Found"
            description="No users match your search criteria."/>
        ) : (
          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead><tr>
                  <th>User</th><th>Role</th><th>Company</th><th>Joined</th>
                  <th>Status</th><th>Approval</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td>
                        <p className="text-sm font-semibold text-white">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </td>
                      <td><RoleBadge role={u.role}/></td>
                      <td className="text-sm text-slate-300">{u.company?.name || '—'}</td>
                      <td className="text-xs text-slate-500">
                        {u.createdAt ? format(new Date(u.createdAt), 'dd MMM yyyy') : '—'}
                      </td>
                      <td>
                        <span className={`badge capitalize ${u.isActive ? 'badge-green' : 'badge-red'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge capitalize ${u.isApproved ? 'badge-green' : 'badge-yellow'}`}>
                          {u.isApproved ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          {!u.isApproved && (
                            <>
                              <button onClick={() => handleApprove(u._id, true)}
                                className="btn-secondary btn-sm text-green-400 hover:bg-green-500/20 text-xs">
                                <CheckCircle className="w-3.5 h-3.5"/> Approve
                              </button>
                              <button onClick={() => handleApprove(u._id, false)}
                                className="btn-secondary btn-sm text-red-400 hover:bg-red-500/20 text-xs">
                                <XCircle className="w-3.5 h-3.5"/> Reject
                              </button>
                            </>
                          )}
                          {u.role !== 'admin' && (
                            <button onClick={() => setConfirm(u._id)}
                              className="btn-ghost btn-sm text-xs">
                              {u.isActive
                                ? <ToggleRight className="w-4 h-4 text-green-400"/>
                                : <ToggleLeft className="w-4 h-4 text-slate-500"/>}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pages={pagination.pages} onChange={setPage}/>
          </div>
        )}
    </div>
  );
}
