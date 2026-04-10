import LoginForm from "../Login/LoginForm";
import RegisterForm from "../Registration/RegisterForm";
import "./auth.css";

function AuthPage({ activeTab, status, loading, onTabChange, onLogin, onRegister }) {
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
            onClick={() => onTabChange("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={activeTab === "register" ? "auth-tab active" : "auth-tab"}
            onClick={() => onTabChange("register")}
          >
            Register
          </button>
        </div>

        <p className={`status ${status.type}`}>{status.message}</p>

        {activeTab === "login" ? (
          <LoginForm
            onLogin={onLogin}
            loading={loading}
            onSwitchToRegister={() => onTabChange("register")}
          />
        ) : (
          <RegisterForm
            onRegister={onRegister}
            loading={loading}
            onSwitchToLogin={() => onTabChange("login")}
          />
        )}
      </section>
    </main>
  );
}

export default AuthPage;
