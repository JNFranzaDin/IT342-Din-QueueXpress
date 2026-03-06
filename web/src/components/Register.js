import { useState } from "react";

function Register({ onRegister, loading, onSwitchToLogin }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
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

    const isSuccess = await onRegister({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
    });

    if (isSuccess) {
      setForm({ name: "", email: "", password: "", confirmPassword: "" });
      setFormError("");
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>Create account</h2>

      <label htmlFor="register-name">Full Name</label>
      <input
        id="register-name"
        name="name"
        value={form.name}
        onChange={handleChange}
        maxLength={100}
        required
      />

      <label htmlFor="register-email">Email</label>
      <input
        id="register-email"
        name="email"
        type="email"
        value={form.email}
        onChange={handleChange}
        maxLength={150}
        required
      />

      <label htmlFor="register-password">Password</label>
      <input
        id="register-password"
        name="password"
        type="password"
        value={form.password}
        onChange={handleChange}
        minLength={8}
        required
      />

      <label htmlFor="register-confirm-password">Confirm Password</label>
      <input
        id="register-confirm-password"
        name="confirmPassword"
        type="password"
        value={form.confirmPassword}
        onChange={handleChange}
        minLength={8}
        required
      />

      {formError && <p className="field-error">{formError}</p>}

      <button type="button" className="switch-link" onClick={onSwitchToLogin}>
        Already have an account? Sign in instead.
      </button>

      <button type="submit" disabled={loading}>
        {loading ? "Creating account..." : "Create Account"}
      </button>
    </form>
  );
}

export default Register;
