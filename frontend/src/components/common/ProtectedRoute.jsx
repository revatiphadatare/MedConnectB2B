import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Spinner from './Spinner';

export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <Spinner size="lg"/>
    </div>
  );

  // Not logged in → send to appropriate login
  if (!user) {
    const isAdminPath = location.pathname.startsWith('/admin');
    return <Navigate
      to={isAdminPath ? '/admin/login' : '/login'}
      state={{ from: location }}
      replace
    />;
  }

  // No role restriction — just needs to be logged in
  if (!roles || roles.length === 0) return <Outlet/>;

  // Admin bypasses ALL role checks (except admin-only routes)
  if (user.role === 'admin') return <Outlet/>;

  // User has the required role
  if (roles.includes(user.role)) return <Outlet/>;

  // Wrong role → send to correct home
  return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace/>;
}
