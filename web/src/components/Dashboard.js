const OFFICES = ["Accounting", "ETO", "Clinic"];

const LEFT_COUNTERS = [
  "Counter 1",
  "Counter 2",
  "Counter 3",
  "Counter 4",
  "Counter 5",
  "Counter 6",
  "Counter 7",
  "Counter 8",
];

const RIGHT_COUNTERS = [
  "Counter 9",
  "Counter 10",
  "Counter A",
  "Counter B",
  "Counter C",
  "Counter D",
  "Counter E",
  "Counter F",
];

function CounterRow({ label }) {
  return (
    <div className="counter-row">
      <span className="counter-label">{label}:</span>
      <span className="ticket-pill">62, 64, 68, 70, 73</span>
    </div>
  );
}

function Dashboard({ user, view, activeOffice, onSelectOffice, onBackToOffice, onLogout }) {
  if (!user) {
    return null;
  }

  const isQueueView = view === "queue";

  return (
    <main className="workspace-shell">
      <header className="workspace-header">
        <div>
          <p className="workspace-kicker">QueueXpress</p>
          <h1>{isQueueView ? "Queue Overview" : "Office Services"}</h1>
          <p className="workspace-subtitle">Signed in as {user.name} ({user.email})</p>
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
              <button
                key={office}
                type="button"
                className="office-card"
                onClick={() => onSelectOffice(office)}
              >
                <span>{office}</span>
                <small>View counters and tickets</small>
              </button>
            ))}
          </section>
        ) : (
          <section className="queue-panel">
            <h3 className="queue-title">{activeOffice} Counters</h3>
            <div className="queue-grid">
              <div className="queue-column">
                {LEFT_COUNTERS.map((counter) => (
                  <CounterRow key={counter} label={counter} />
                ))}
              </div>
              <div className="queue-column">
                {RIGHT_COUNTERS.map((counter) => (
                  <CounterRow key={counter} label={counter} />
                ))}
              </div>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

export default Dashboard;
