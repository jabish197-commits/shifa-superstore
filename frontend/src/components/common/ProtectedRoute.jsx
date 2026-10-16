import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader, Empty } from './UI';
export default function ProtectedRoute({ role }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (role && user.role !== role)
    return (
      <Empty
        title="This page is not available for your account"
        to={user.role === 'admin' ? '/admin-dashboard' : '/'}
        action="Go to your dashboard"
      />
    );
  return <Outlet />;
}
