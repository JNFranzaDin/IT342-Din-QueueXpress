import { OFFICES, OFFICE_COUNTERS } from "./queueConfig";
import "./dashboard.css";

function CounterRow({ label, tickets }) {
  const queueText = tickets.length > 0 ? tickets.join(", ") : "No queue yet";

  return (
    <div className="counter-row">
      <span className="counter-label">{label}:</span>
      <span className={`ticket-pill ${tickets.length === 0 ? "is-empty" : ""}`}>{queueText}</span>
    </div>
  );
}

function DashboardPage({
  user,
  view,
  activeOffice,
  officeQueues,
  onSelectOffice,
  onGetQueue,
  onBackToOffice,
  onLogout,
}) {
  if (!user) {
    return null;
  }

  const isQueueView = view === "queue";
  const activeOfficeQueues = officeQueues?.[activeOffice] || {};
  const counters = OFFICE_COUNTERS[activeOffice] || [];
  const leftCounters = counters.slice(0, Math.ceil(counters.length / 2));
  const rightCounters = counters.slice(Math.ceil(counters.length / 2));

  return (
    <main className="workspace-shell">
      <header className="workspace-header">
        <div>
          <p className="workspace-kicker">QueueXpress</p>
          <h1>{isQueueView ? "Queue Overview" : "Office Services"}</h1>
          <p className="workspace-subtitle">
            Signed in as {user.name} ({user.email})
          </p>
        </div>
        <button type="button" className="logout-btn" onClick={onLogout}>
          Log Out
        </button>
      </header>

      <section className="workspace-panel">
        <header className="workspace-nav">
          <button
            type="button"
            className="back-arrow"
            onClick={isQueueView ? onBackToOffice : onLogout}
            aria-label={isQueueView ? "Back to office list" : "Logout"}
          >
            {isQueueView ? "Back" : "Exit"}
          </button>

          <nav className="office-tabs" aria-label="Office selector">
            {OFFICES.map((office) => (
              <button
                key={office}
                type="button"
                className={`office-tab ${isQueueView && activeOffice === office ? "is-active" : ""}`}
                onClick={() => onSelectOffice(office)}
              >
                {office}
              </button>
            ))}
          </nav>
        </header>

        {!isQueueView ? (
          <section className="office-list">
            {OFFICES.map((office) => (
              <article key={office} className="office-card">
                <span>{office}</span>
                <small>View counters and tickets</small>
                <div className="office-actions">
                  <button type="button" className="get-queue-btn" onClick={() => onGetQueue(office)}>
                    Get Queue
                  </button>
                  <button type="button" className="view-queue-btn" onClick={() => onSelectOffice(office)}>
                    View Queue
                  </button>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="queue-panel">
            <h3 className="queue-title">{activeOffice} Counters</h3>
            <div className="queue-grid">
              <div className="queue-column">
                {leftCounters.map((counter) => (
                  <CounterRow key={counter} label={counter} tickets={activeOfficeQueues[counter] || []} />
                ))}
              </div>
              <div className="queue-column">
                {rightCounters.map((counter) => (
                  <CounterRow key={counter} label={counter} tickets={activeOfficeQueues[counter] || []} />
                ))}
              </div>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

export default DashboardPage;
