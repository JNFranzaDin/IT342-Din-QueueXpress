import { useState } from "react";
import Profile from "../Profile/Profile";

function SettingsPanel({ user, currentTicket, onChangePassword }) {
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    if (form.password !== form.confirmPassword) {
      setMessageType("error");
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    const result = await onChangePassword({ password: form.password });
    setMessageType(result.ok ? "ok" : "error");
    setMessage(result.message);
    setLoading(false);

    if (result.ok) {
      setForm({ password: "", confirmPassword: "" });
    }
  };

  return (
    <div className="settings-grid">
      <Profile user={user} currentTicket={currentTicket} />

      <section className="dashboard-section">
        <div className="dashboard-section-head">
          <div>
            <p className="section-kicker">Settings</p>
            <h3>Change password</h3>
          </div>
        </div>

        <form className="settings-form" onSubmit={handleSubmit}>
          <label htmlFor="new-password">New password</label>
          <input
            id="new-password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            minLength={8}
            required
          />

          <label htmlFor="confirm-password">Confirm password</label>
          <input
            id="confirm-password"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            minLength={8}
            required
          />

          {message ? <p className={`form-status ${messageType}`}>{message}</p> : null}

          <button type="submit" className="section-action" disabled={loading}>
            {loading ? "Saving..." : "Update Password"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default SettingsPanel;
