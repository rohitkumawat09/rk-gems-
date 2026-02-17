import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../axios";

const ForgotResetPassword = () => {
  const [step, setStep] = useState("forgot"); 
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
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
    try {
      const res = await API.post("/forgot-password", { email });
      setMessage(res.data.message);
      setStep("reset");
      setTimer(300); 
    } catch (err) {
      setMessage(err.response?.data?.message || "Error sending OTP");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/reset-password", { email, otp, newPassword });
      setMessage(res.data.message);
      // after successful reset, navigate to login so user can sign in
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setMessage(err.response?.data?.message || "Error resetting password");
    }
  };

  return (
    <div className="auth-container">
      <h2 className="auth-title">Forgot / Reset Password</h2>

      {step === "forgot" && (
        <form className="auth-form" onSubmit={handleSendOtp}>
          <input
            type="email"
            placeholder="Enter your email"
            className="auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" className="auth-button">Send OTP</button>
        </form>
      )}

      {step === "reset" && (
        <form className="auth-form" onSubmit={handleResetPassword}>
          <input
            type="text"
            placeholder="Enter OTP"
            className="auth-input"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <input
            type="password"
            placeholder="New Password"
            className="auth-input"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button
            type="submit"
            className="auth-button"
            disabled={timer <= 0}
          >
            Reset Password
          </button>
        </form>
      )}

      {step === "reset" && (
        timer > 0 ? (
          <p className="auth-timer">⏳ OTP valid for {formatTime(timer)}</p>
        ) : (
          <p className="auth-message error">OTP expired. Please request again.</p>
        )
      )}

      {message && <p className="auth-message">{message}</p>}
    </div>
  );
};

export default ForgotResetPassword;
