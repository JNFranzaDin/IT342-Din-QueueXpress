import { useState } from "react";
import "./App.css";
import Register from "./components/Register";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

const API_BASE = process.env.REACT_APP_API_BASE || "";

function App() {
  const [activeTab, setActiveTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("auth");
  const [activeOffice, setActiveOffice] = useState("Accounting");

  const postJson = async (path, body) => {
    const response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message =
        (Array.isArray(payload.details) && payload.details.join(" | ")) ||
        payload.message ||
        "Request failed.";
      throw new Error(message);
    }

    return payload;
  };

  const handleRegister = async (form) => {
    setLoading(true);
    setStatus({ type: "", message: "" });
    try {
      const payload = await postJson("/api/auth/register", form);
      setStatus({ type: "ok", message: payload.message || "Registration successful." });
      setActiveTab("login");
      return true;
    } catch (error) {
      setStatus({ type: "error", message: error.message });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (form) => {
    setLoading(true);
    setStatus({ type: "", message: "" });
    try {
      const payload = await postJson("/api/auth/login", form);
      setUser(payload);
      setStatus({ type: "ok", message: payload.message || "Login successful." });
      setScreen("office");
    } catch (error) {
      setUser(null);
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setStatus({ type: "", message: "Logged out." });
    setActiveTab("login");
    setScreen("auth");
  };

  const openQueue = (officeName) => {
    setActiveOffice(officeName);
    setScreen("queue");
  };

  const backToOffice = () => {
    setScreen("office");
  };

  if (screen === "auth" || !user) {
    return (
      <main className="auth-shell">
        <section className="auth-hero">
          <p className="hero-kicker">QueueXpress</p>
          <h1>Queueing made calm and clear.</h1>
          <p>
            Create your account to manage office queues, then sign in to access service counters and
            live ticket flow.
          </p>
          <ul className="hero-points">
            <li>Secure registration with email uniqueness check</li>
            <li>BCrypt-hashed passwords stored in Supabase PostgreSQL</li>
            <li>Fast switch between offices and counters</li>
          </ul>
        </section>

        <section className="auth-panel">
          <div className="auth-tabs">
            <button
              type="button"
              className={activeTab === "login" ? "auth-tab active" : "auth-tab"}
              onClick={() => {
                setStatus({ type: "", message: "" });
                setActiveTab("login");
              }}
            >
              Login
            </button>
            <button
              type="button"
              className={activeTab === "register" ? "auth-tab active" : "auth-tab"}
              onClick={() => {
                setStatus({ type: "", message: "" });
                setActiveTab("register");
              }}
            >
              Register
            </button>
          </div>

          <p className={`status ${status.type}`}>{status.message}</p>

          {activeTab === "login" ? (
            <Login
              onLogin={handleLogin}
              loading={loading}
              onSwitchToRegister={() => {
                setStatus({ type: "", message: "" });
                setActiveTab("register");
              }}
            />
          ) : (
            <Register
              onRegister={handleRegister}
              loading={loading}
              onSwitchToLogin={() => {
                setStatus({ type: "", message: "" });
                setActiveTab("login");
              }}
            />
          )}
        </section>
      </main>
    );
  }

  return (
    <Dashboard
      user={user}
      view={screen}
      activeOffice={activeOffice}
      onSelectOffice={openQueue}
      onBackToOffice={backToOffice}
      onLogout={handleLogout}
    />
  );
}

export default App;
