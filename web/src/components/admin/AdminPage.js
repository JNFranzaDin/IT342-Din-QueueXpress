import { useEffect, useState } from "react";
import { OFFICE_COUNTERS, OFFICES } from "../queueManagement/queueConfig";
import "./admin.css";

function CounterActionRow({
  office,
  counter,
  tickets,
  isOpen,
  selectedTicket,
  onSelectTicket,
  onToggleCounter,
  onServeTicket,
  onRemoveTicket,
}) {
  const isSelectedForThisCounter =
    selectedTicket && selectedTicket.office === office && selectedTicket.counter === counter;

  return (
    <div className={`admin-counter-row ${isOpen ? "is-open" : "is-paused"}`}>
      <div className="admin-counter-meta">
        <strong>{counter}</strong>
        <span>{tickets.length} ticket{tickets.length === 1 ? "" : "s"}</span>
      </div>
      <div className="admin-counter-actions">
        <button type="button" onClick={() => onToggleCounter(office, counter)}>
          {isOpen ? "Pause Queue" : "Add Counter"}
        </button>
        <button
          type="button"
          onClick={() => onServeTicket(office, counter, isSelectedForThisCounter ? selectedTicket.ticket : null)}
          disabled={!isSelectedForThisCounter}
        >
          Serve Ticket
        </button>
        <button
          type="button"
          onClick={() => onRemoveTicket(office, counter, isSelectedForThisCounter ? selectedTicket.ticket : null)}
          disabled={!isSelectedForThisCounter}
        >
          Remove Ticket
        </button>
      </div>

      <div className="admin-counter-tickets">
        {tickets.length > 0 ? (
          <ul className="admin-ticket-list">
            {tickets.map((t) => (
              <li
                key={t}
                className={`admin-ticket-item ${isSelectedForThisCounter && selectedTicket.ticket === t ? "selected" : ""}`}
              >
                <button type="button" onClick={() => onSelectTicket({ office, counter, ticket: t })}>
                  {t}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No queue yet</p>
        )}
      </div>
    </div>
  );
}

function AdminPage({
  user,
  status,
  officeStatus,
  officeQueues,
  onSelectOffice,
  onToggleOffice,
  onToggleCounter,
  onRemoveTicket,
  onServeTicket,
  onLogout,
}) {
  const [selectedOffice, setSelectedOffice] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const activeOfficeRecord = selectedOffice ? officeStatus?.[selectedOffice] || { isOpen: false, openCounters: [] } : null;
  const selectedOpenCounters = selectedOffice ? activeOfficeRecord?.openCounters || [] : [];

  const handleSelectOffice = (office) => {
    setSelectedOffice(office);
    onSelectOffice(office);
  };

  const handleBackToOffices = () => {
    setSelectedOffice("");
  };

  useEffect(() => {
    // clear selection when the currently selected ticket no longer exists
    if (!selectedTicket) return;
    const { office, counter, ticket } = selectedTicket;
    const tickets = officeQueues?.[office]?.[counter] || [];
    if (!tickets.includes(ticket)) {
      setSelectedTicket(null);
    }
  }, [officeQueues, selectedTicket]);

  return (
    <main className="admin-shell centered-shell">
      <header className="admin-header">
        <div>
          <p className="admin-kicker">Admin Console</p>
          <h1>Office and Queue Management</h1>
          <p className="admin-subtitle">
            Signed in as {user.name} ({user.email})
          </p>
        </div>
        <button type="button" className="admin-logout-btn" onClick={onLogout}>
          Log Out
        </button>
      </header>

      {status.message ? <p className={`admin-status ${status.type}`}>{status.message}</p> : null}

      {!selectedOffice ? (
        <section className="admin-office-selector-panel">
          <div className="admin-section-head">
            <div>
              <p className="admin-detail-kicker">Offices</p>
              <h2>Choose an office to manage</h2>
            </div>
          </div>

          <div className="admin-office-grid">
            {OFFICES.map((office) => {
              const officeRecord = officeStatus?.[office] || { isOpen: false, openCounters: [] };
              const openCounterCount = officeRecord.openCounters?.length || 0;

              return (
                <button
                  key={office}
                  type="button"
                  className="admin-office-card"
                  onClick={() => handleSelectOffice(office)}
                >
                  <span>{office}</span>
                  <small>{officeRecord.isOpen ? "Office open" : "Office closed"}</small>
                  <strong>{openCounterCount} counter{openCounterCount === 1 ? "" : "s"} available</strong>
                  <p>Click to view counters and office controls.</p>
                </button>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="admin-detail-panel">
          <header className="admin-detail-head">
            <div>
              <p className="admin-detail-kicker">{selectedOffice}</p>
              <h2>{activeOfficeRecord?.isOpen ? "Office management" : "Office is closed"}</h2>
            </div>
            <div className={`admin-office-state ${activeOfficeRecord?.isOpen ? "is-open" : "is-closed"}`}>
              {activeOfficeRecord?.isOpen ? "Office Open" : "Office Closed"}
            </div>
          </header>

          <div className="admin-detail-actions">
            <button type="button" className="admin-back-btn" onClick={handleBackToOffices}>
              Back to offices
            </button>
            <button type="button" className="admin-office-toggle-btn" onClick={() => onToggleOffice(selectedOffice)}>
              {activeOfficeRecord?.isOpen ? "Close Office" : "Open Office"}
            </button>
          </div>

          <div className="admin-office-summary">
            <p>
              Available counters: <strong>{selectedOpenCounters.length}</strong>
            </p>
            <p>{selectedOpenCounters.length > 0 ? selectedOpenCounters.join(", ") : "No counters are open yet."}</p>
          </div>

          <div className="admin-counter-grid">
            {(OFFICE_COUNTERS[selectedOffice] || []).map((counter) => {
              const tickets = officeQueues?.[selectedOffice]?.[counter] || [];
              const isOpen = activeOfficeRecord?.openCounters?.includes(counter);

              return (
                <CounterActionRow
                  key={counter}
                  office={selectedOffice}
                  counter={counter}
                  tickets={tickets}
                  isOpen={isOpen}
                  selectedTicket={selectedTicket}
                  onSelectTicket={setSelectedTicket}
                  onToggleCounter={onToggleCounter}
                  onRemoveTicket={onRemoveTicket}
                  onServeTicket={onServeTicket}
                />
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}

export default AdminPage;