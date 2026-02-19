import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoginForm = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  
  const { login, verifyOtp, isLoading, error } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(form.email, form.password);
      setOtpSent(true);
    } catch (err) {
      // Error is handled by AuthContext
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      await verifyOtp(form.email, otp);
      navigate("/");
    } catch (err) {
      // Error is handled by AuthContext
    }
  };

  const handleResendOtp = async () => {
    if (!form.email) return;
    try {
      setResendDisabled(true);
      setResendTimer(30);
      await login(form.email, form.password);
      
      // Start countdown timer
      const interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setResendDisabled(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setResendDisabled(false);
      setResendTimer(0);
    }
  };

  return (
    <div className="auth-container">
      <h2 className="auth-title">Login</h2>

      {!otpSent && (
        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="auth-input"
            value={form.email}
            onChange={handleChange}
            disabled={isLoading}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="auth-input"
            value={form.password}
            onChange={handleChange}
            disabled={isLoading}
            required
          />
          <button 
            type="submit" 
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
          {error && <p className="auth-error">{error}</p>}
        </form>
      )}

      {otpSent && (
        <form className="auth-form" onSubmit={handleVerifyOtp}>
          <p className="auth-message">OTP sent to {form.email}. Enter it below:</p>
          <input
            type="text"
            name="otp"
            placeholder="Enter 6-digit OTP"
            className="auth-input"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            disabled={isLoading}
            required
            maxLength="6"
          />
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button 
              type="submit" 
              className="auth-button"
              disabled={isLoading}
            >
              {isLoading ? "Verifying..." : "Verify OTP"}
            </button>
            <button
              type="button"
              className="auth-button"
              onClick={handleResendOtp}
              disabled={resendDisabled || isLoading}
            >
              {resendDisabled ? `Resend (${resendTimer}s)` : "Resend OTP"}
            </button>
          </div>
          {error && <p className="auth-error">{error}</p>}
        </form>
      )}
    </div>
  );
};

export default LoginForm;
