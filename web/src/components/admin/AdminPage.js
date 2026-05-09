import { OFFICES, sortOfficeCounters } from "../queueManagement/queueConfig";

function AdminPage({
  user,
  status,
  activeOffice,
  officeStatus,
  officeQueues,
  onSelectOffice,
  onToggleOffice,
  onToggleCounter,
  onRemoveTicket,
  onServeTicket,
  onLogout,
}) {
  const officeRecord = officeStatus?.[activeOffice] || { isOpen: false, openCounters: [] };
  const counters = sortOfficeCounters(activeOffice, officeRecord.openCounters || []);

  return (
    <main className="workspace-shell centered-shell">
      <section className="workspace-main">
        <header className="workspace-header">
          <div>
            <p className="workspace-kicker">QueueXpress Admin</p>
            <h1>Office Controls</h1>
            <p className="workspace-subtitle">
              Signed in as {user?.name} ({user?.email})
            </p>
          </div>
          <button type="button" className="section-action" onClick={onLogout}>
            Logout
          </button>
        </header>

        {status?.message ? <p className={`status ${status.type || ""}`}>{status.message}</p> : null}

        <section className="workspace-panel">
          <header className="workspace-nav">
            <nav className="office-tabs" aria-label="Admin office selector">
              {OFFICES.map((office) => (
                <button
                  key={office}
                  type="button"
                  className={`office-tab ${activeOffice === office ? "is-active" : ""}`}
                  onClick={() => onSelectOffice?.(office)}
                >
                  {office}
                </button>
              ))}
            </nav>
          </header>

          <section className="queue-panel">
            <div className="queue-head">
              <div>
                <h3 className="queue-title">{activeOffice} Controls</h3>
                <p className="queue-subtitle">
                  {officeRecord.isOpen ? "Office is open" : "Office is closed"}
                </p>
              </div>
              <button type="button" className="section-action" onClick={() => onToggleOffice?.(activeOffice)}>
                {officeRecord.isOpen ? "Close Office" : "Open Office"}
              </button>
            </div>

            {officeRecord.isOpen ? (
              <div className="queue-grid">
                {counters.map((counterName) => {
                  const tickets = officeQueues?.[activeOffice]?.[counterName] || [];
                  return (
                    <div key={counterName} className="queue-column">
                      <div className="counter-row">
                        <span className="counter-label">{counterName}</span>
                        <button
                          type="button"
                          className="section-action"
                          onClick={() => onToggleCounter?.(activeOffice, counterName)}
                        >
                          Close Counter
                        </button>
                      </div>

                      {tickets.length === 0 ? (
                        <p className="workspace-subtitle">No tickets in queue.</p>
                      ) : (
                        tickets.map((ticket) => (
                          <div key={ticket} className="counter-row">
                            <span className="ticket-pill">{ticket}</span>
                            <div className="office-actions">
                              <button
                                type="button"
                                className="view-queue-btn"
                                onClick={() => onServeTicket?.(activeOffice, counterName)}
                              >
                                Serve
                              </button>
                              <button
                                type="button"
                                className="clear-queue-btn"
                                onClick={() => onRemoveTicket?.(activeOffice, counterName, ticket)}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="office-empty-state">
                <h3>{activeOffice} is currently closed</h3>
                <p>Open this office to manage counters and tickets.</p>
              </div>
            )}
          </section>
        </section>
      </section>
    </main>
  );
}

export default AdminPage;
