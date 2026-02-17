import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../axios";

const LoginForm = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/login", form);
      setMessage(res.data.message || "OTP sent");
      if (res.data?.success) setOtpSent(true);
    } catch (err) {
      setMessage(err.response?.data?.message || "Error");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/verify-otp", { email: form.email, otp });
      if (res.data?.accessToken) {
        localStorage.setItem("accessToken", res.data.accessToken);
        localStorage.setItem("user", JSON.stringify(res.data.user || {}));
        setMessage("Verified — logged in");
        navigate("/");
      } else {
        setMessage(res.data.message || "Verification failed");
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "OTP verification error");
    }
  };

  const handleResendOtp = async () => {
    if (!form.email) return setMessage("Enter email first");
    try {
      await API.post("/request-otp", { email: form.email });
      setMessage("OTP resent to email");
      setResendDisabled(true);
      setTimeout(() => setResendDisabled(false), 10000); // enable after 10s
    } catch (err) {
      setMessage(err.response?.data?.message || "Error resending OTP");
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
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="auth-input"
            value={form.password}
            onChange={handleChange}
          />
          <button type="submit" className="auth-button">Login</button>
        </form>
      )}

      {otpSent && (
        <form className="auth-form" onSubmit={handleVerifyOtp}>
          <p className="auth-message">OTP sent to {form.email}. Enter it below:</p>
          <input
            type="text"
            name="otp"
            placeholder="Enter OTP"
            className="auth-input"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button type="submit" className="auth-button">Verify OTP</button>
            <button
              type="button"
              className="auth-button"
              onClick={handleResendOtp}
              disabled={resendDisabled}
            >
              {resendDisabled ? "Resend (wait)" : "Resend OTP"}
            </button>
          </div>
        </form>
      )}

      {message && <p className="auth-message">{message}</p>}
    </div>
  );
};

export default LoginForm;
