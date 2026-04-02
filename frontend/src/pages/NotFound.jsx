import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home } from 'lucide-react';

export default function NotFound() {
  const { user } = useAuth();
  const home = user?.role === 'admin' ? '/admin/dashboard' : user ? '/dashboard' : '/';
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-6">
      <p className="text-8xl font-bold font-display text-brand-500/30">404</p>
      <h1 className="text-2xl font-bold text-white font-display mt-4">Page Not Found</h1>
      <p className="text-slate-500 mt-2 mb-8">The page you're looking for doesn't exist.</p>
      <Link to={home} className="btn-primary btn-lg"><Home className="w-5 h-5"/> Go Home</Link>
    </div>
  );
}
