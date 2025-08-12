import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">正在驗證身份...</p>
        </div>
      </div>
    );
  }

  // Only redirect after loading is complete and user is not authenticated
  if (!user || user.role !== 'admin') {
    console.log('[ProtectedRoute] User not authenticated or not admin, redirecting to login');
    console.log('[ProtectedRoute] Current user:', user);
    console.log('[ProtectedRoute] Has token in localStorage:', !!localStorage.getItem('token'));
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  console.log('[ProtectedRoute] User authenticated:', { username: user.username, role: user.role });
  return <>{children}</>;
};

export default ProtectedRoute; 