import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { roleHomePath } from '../utils/roleHome.js';

export function ProtectedRoute() {
  const { token, loading } = useAuth();
  if (loading) return null;
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function RoleRoute({ roles }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    // "/" is now the public landing page, so send wrong-role users to their own dashboard
    return <Navigate to={roleHomePath(user.role)} replace />;
  }
  return <Outlet />;
}

export function GuestRoute() {
  const { user, token, loading } = useAuth();
  if (loading) return null;
  if (user && token) {
    return <Navigate to={roleHomePath(user.role)} replace />;
  }
  return <Outlet />;
}

export function AdminRoute() {
  return <RoleRoute roles={["admin"]} />;
}

export function DeliveryAgentRoute() {
  return <RoleRoute roles={["agent"]} />;
}

export function CustomerRoute() {
  return <RoleRoute roles={["customer"]} />;
}