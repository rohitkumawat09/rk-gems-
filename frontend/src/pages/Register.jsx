import React, { useState } from "react";
import API from "../../axios";

const RegisterForm = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/register", form);
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.message || "Error");
    }
  };

  return (
    <div className="auth-container">
      <h2 className="auth-title">Register</h2>
      <form className="auth-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Name"
          className="auth-input"
          value={form.name}
          onChange={handleChange}
        />
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
        <button type="submit" className="auth-button">Register</button>
      </form>
      {message && <p className="auth-message">{message}</p>}
    </div>
  );
};

export default RegisterForm;
