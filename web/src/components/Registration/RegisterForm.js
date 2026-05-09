import { useState } from "react";
import "../auth/auth.css";

function RegisterForm({ onRegister, loading, onSwitchToLogin }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [formError, setFormError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formError) {
      setFormError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    if (!onRegister) {
      return;
    }

    const isSuccess = await onRegister({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
    });

    if (isSuccess) {
      setForm({ name: "", email: "", password: "", confirmPassword: "" });
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label>
        Full Name
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
        />
      </label>

      <label>
        Email
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
        />
      </label>

      <label>
        Password
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          minLength={8}
          required
        />
      </label>

      <label>
        Confirm Password
        <input
          type="password"
          name="confirmPassword"
          value={form.confirmPassword}
          onChange={handleChange}
          minLength={8}
          required
        />
      </label>

      {formError ? <p className="field-error">{formError}</p> : null}

      <div className="auth-actions">
        <button type="submit" disabled={loading} className="primary-btn">
          {loading ? "Creating account..." : "Create account"}
        </button>
        <button type="button" className="link-btn" onClick={onSwitchToLogin}>
          Back to login
        </button>
      </div>
    </form>
  );
}

export default RegisterForm;
