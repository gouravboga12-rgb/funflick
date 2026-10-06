import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * Enforces dedicated administrator authentication for all /admin routes.
 * A normal logged-in user in the user app NEVER has 'funflick_admin_token'
 * and is redirected to /admin/login.
 */
export const AdminRouteGuard = ({ children }) => {
  const location = useLocation();
  const adminToken = localStorage.getItem('funflick_admin_token');

  if (!adminToken) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
};
