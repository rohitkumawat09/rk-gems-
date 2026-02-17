import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../axios";

export const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      setIsLoggedIn(!!localStorage.getItem("accessToken"));
    } catch (e) {
      setIsLoggedIn(false);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await API.post("/logout");
    } catch (err) {
      // ignore errors, proceed to clear local state
    }
    try {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
    } catch (e) {}
    setIsLoggedIn(false);
    navigate("/login");
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
            <li>
              <button className="nav-link auth-logout" onClick={handleLogout}>Logout</button>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
};
