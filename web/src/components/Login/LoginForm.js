import { useState } from "react";

function LoginForm({ onLogin, loading, onSwitchToRegister }) {
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onLogin({
      email: form.email.trim(),
      password: form.password,
    });
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>Welcome back</h2>

      <label htmlFor="login-email">Email</label>
      <input
        id="login-email"
        name="email"
        type="email"
        value={form.email}
        onChange={handleChange}
        maxLength={150}
        required
      />

      <label htmlFor="login-password">Password</label>
      <input
        id="login-password"
        name="password"
        type="password"
        value={form.password}
        onChange={handleChange}
        required
      />

      <button type="button" className="switch-link" onClick={onSwitchToRegister}>
        New to QueueXpress? Create an account.
      </button>

      <button type="submit" disabled={loading}>
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}

export default LoginForm;
