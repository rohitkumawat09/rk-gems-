import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RegisterForm = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState("");

  const { register, isLoading, error } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setValidationError("");
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    setValidationError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (!form.name.trim()) {
      setValidationError("Name is required");
      return;
    }

    if (!form.email.trim()) {
      setValidationError("Email is required");
      return;
    }

    if (form.password.length < 8) {
      setValidationError("Password must be at least 8 characters");
      return;
    }

    if (form.password !== confirmPassword) {
      setValidationError("Passwords do not match");
      return;
    }

    try {
      await register(form.name, form.email, form.password);
      // Redirect to login after successful registration
      navigate("/login");
    } catch (err) {
      // Error is handled by AuthContext
    }
  };

  const displayError = validationError || error;

  return (
    <div className="auth-container">
      <h2 className="auth-title">Register</h2>
      <form className="auth-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          className="auth-input"
          value={form.name}
          onChange={handleChange}
          disabled={isLoading}
          required
        />
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
          placeholder="Password (min 8 characters)"
          className="auth-input"
          value={form.password}
          onChange={handleChange}
          disabled={isLoading}
          required
          minLength="8"
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          className="auth-input"
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
          disabled={isLoading}
          required
          minLength="8"
        />
        <button 
          type="submit" 
          className="auth-button"
          disabled={isLoading}
        >
          {isLoading ? "Registering..." : "Register"}
        </button>
        {displayError && <p className="auth-error">{displayError}</p>}
      </form>
      <p className="auth-message">
        Already have an account? <a href="/login" className="auth-link">Login here</a>
      </p>
    </div>
  );
};

export default RegisterForm;
