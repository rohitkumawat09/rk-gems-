import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../axios";

const ForgotResetPassword = () => {
  const [step, setStep] = useState("forgot"); 
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (step === "reset" && timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [step, timer]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    try {
      setIsLoading(true);
      const res = await API.post("/forgot-password", { email });
      setMessage(res.data.message || "OTP sent to your email");
      setStep("otp");
    } catch (err) {
      setError(err.response?.data?.message || "Error sending OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!otp.trim()) {
      setError("OTP is required");
      return;
    }

    try {
      setIsLoading(true);
      await API.post("/verify-reset-otp", { email, otp });
      setMessage("OTP verified. Now set your new password.");
      setStep("reset");
      setTimer(300); // 5 minutes
    } catch (err) {
      setError(err.response?.data?.message || "Error verifying OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setIsLoading(true);
      const res = await API.post("/reset-password", { email, newPassword });
      setMessage(res.data.message || "Password reset successfully");
      // Navigate to login after success
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Error resetting password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2 className="auth-title">Reset Password</h2>

      {step === "forgot" && (
        <form className="auth-form" onSubmit={handleSendOtp}>
          <input
            type="email"
            placeholder="Enter your email"
            className="auth-input"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            disabled={isLoading}
            required
          />
          <button 
            type="submit" 
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? "Sending OTP..." : "Send OTP"}
          </button>
          {error && <p className="auth-error">{error}</p>}
          {message && <p className="auth-message">{message}</p>}
        </form>
      )}

      {step === "otp" && (
        <form className="auth-form" onSubmit={handleVerifyOtp}>
          <p className="auth-message">Enter the 6-digit OTP sent to {email}</p>
          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            className="auth-input"
            value={otp}
            onChange={(e) => {
              setOtp(e.target.value);
              setError("");
            }}
            disabled={isLoading}
            required
            maxLength="6"
          />
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
            onClick={handleSendOtp}
            disabled={isLoading}
            style={{ marginTop: "8px", backgroundColor: "#ccc" }}
          >
            Resend OTP
          </button>
          {error && <p className="auth-error">{error}</p>}
          {message && <p className="auth-message">{message}</p>}
        </form>
      )}

      {step === "reset" && (
        <>
          <form className="auth-form" onSubmit={handleResetPassword}>
            <input
              type="password"
              placeholder="New Password (min 8 characters)"
              className="auth-input"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setError("");
              }}
              disabled={isLoading || timer <= 0}
              required
              minLength="8"
            />
            <input
              type="password"
              placeholder="Confirm Password"
              className="auth-input"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError("");
              }}
              disabled={isLoading || timer <= 0}
              required
              minLength="8"
            />
            <button
              type="submit"
              className="auth-button"
              disabled={isLoading || timer <= 0}
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>
            {error && <p className="auth-error">{error}</p>}
            {message && <p className="auth-message">{message}</p>}
          </form>

          {timer > 0 ? (
            <p className="auth-timer">⏳ OTP valid for {formatTime(timer)}</p>
          ) : (
            <p className="auth-message error">OTP expired. Please start over.</p>
          )}
        </>
      )}
    </div>
  );
};

export default ForgotResetPassword;
