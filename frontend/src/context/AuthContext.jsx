import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import API from "../../axios";

// Create Auth Context
const AuthContext = createContext(null);

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Start as true for initial check
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check if user is logged in on mount
  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      // On page load use /me to check the access token (prevents unnecessary rotation)
      console.log("AUTH: checkAuth -> calling GET /me");
      const response = await API.get("/me");
      console.log("AUTH: /me response ->", response.status, response.data?.success);
      if (response.data?.user) {
        setUser(response.data.user);
        setError(null);
      }
    } catch (err) {
      // Not authenticated or error occurred - this is expected for new users
      console.log("AUTH: /me returned error ->", err.response?.status || err.message);
      // Clear user but don't show error message
      setUser(null);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check auth on component mount
  useEffect(() => {
    const initializeAuth = async () => {
      await checkAuth();
      setIsInitialized(true);
    };
    initializeAuth();
  }, [checkAuth]);

  const login = useCallback(async (email, password) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("AUTH: login -> POST /login", { email });
      const response = await API.post("/login", { email, password });
      console.log("AUTH: login response ->", response.data);
      return response.data; // Returns { success: true, message: "OTP sent..." }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Login failed";
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(async (email, otp) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("AUTH: verifyOtp -> POST /verify-otp", { email });
      const response = await API.post("/verify-otp", { email, otp });
      console.log("AUTH: /verify-otp response ->", response.data);
      if (response.data?.user) {
        console.log("AUTH: OTP verified - setting user in context", response.data.user);
        setUser(response.data.user);
      }
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "OTP verification failed";
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await API.post("/register", { name, email, password });
      return response.data; // Returns { message: "Registered successfully" }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Registration failed";
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("AUTH: logout -> POST /logout (clearing local user state)");
      const response = await API.post("/logout");
      console.log("AUTH: /logout response ->", response.data);
      setUser(null);
    } catch (err) {
      // Still clear user even if API call fails
      setUser(null);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = {
    user,
    isLoading,
    error,
    isInitialized,
    checkAuth,
    login,
    verifyOtp,
    register,
    logout,
    isLoggedIn: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook to use Auth Context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
