import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute Component
 * 
 * Redirects to login if user is not authenticated
 * Use this to wrap routes that require authentication
 * 
 * Example:
 * <ProtectedRoute>
 *   <DashboardPage />
 * </ProtectedRoute>
 */
export const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, isLoading } = useAuth();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <p>Loading...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Render the protected component
  return children;
};

export default ProtectedRoute;
