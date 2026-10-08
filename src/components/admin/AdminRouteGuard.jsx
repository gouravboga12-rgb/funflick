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

  if (adminToken === 'local_admin_token_active') {
    return children;
  }

  // Validate JWT expiration strictly against AWS token
  if (adminToken) {
    try {
      const parts = adminToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          localStorage.removeItem('funflick_admin_token');
          return <Navigate to="/admin/login" state={{ from: location, expired: true }} replace />;
        }
      } else {
        localStorage.removeItem('funflick_admin_token');
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
      }
    } catch (e) {
      localStorage.removeItem('funflick_admin_token');
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
  }

  return children;
};
