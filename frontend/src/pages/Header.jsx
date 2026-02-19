import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const Header = () => {
  const { user, isLoggedIn, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      // Error handled in context, still redirect
      navigate("/login");
    }
  };

  return (
    <header className="header">
      <h1 className="logo">My App</h1>
      <nav>
        <ul className="nav-list">
          {!isLoggedIn && (
            <>
              <li><Link to="/" className="nav-link">Register</Link></li>
              <li><Link to="/login" className="nav-link">Login</Link></li>
            </>
          )}
          <li><Link to="/forgot-password" className="nav-link">Forgot Password</Link></li>
          {isLoggedIn && (
            <>
              <li className="nav-user">
                Welcome, {user?.email || "User"}
              </li>
              <li>
                <button 
                  className="nav-link auth-logout"
                  onClick={handleLogout}
                  disabled={isLoading}
                >
                  {isLoading ? "Logging out..." : "Logout"}
                </button>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
};
