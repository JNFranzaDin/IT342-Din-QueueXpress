import { useEffect, useState } from "react";
import { OFFICE_COUNTERS } from "../queueManagement/queueConfig";
import "../admin/admin.css";

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
            {tickets.map((ticket) => (
              <li
                key={ticket}
                className={`admin-ticket-item ${
                  isSelectedForThisCounter && selectedTicket.ticket === ticket ? "selected" : ""
                }`}
              >
                <button type="button" onClick={() => onSelectTicket({ office, counter, ticket })}>
                  {ticket}
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

function StaffOfficeConsole({
  user,
  status,
  officeName,
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
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    if (officeName && activeOffice !== officeName) {
      onSelectOffice(officeName);
    }
  }, [activeOffice, officeName, onSelectOffice]);

  useEffect(() => {
    if (!selectedTicket) {
      return;
    }

    const tickets = officeQueues?.[selectedTicket.office]?.[selectedTicket.counter] || [];
    if (!tickets.includes(selectedTicket.ticket)) {
      setSelectedTicket(null);
    }
  }, [officeQueues, selectedTicket]);

  if (!officeName) {
    return (
      <main className="admin-shell centered-shell">
        <header className="admin-header">
          <div>
            <p className="admin-kicker">Staff Console</p>
            <h1>No assigned office</h1>
            <p className="admin-subtitle">
              Signed in as {user.name} ({user.email})
            </p>
          </div>
          <button type="button" className="admin-logout-btn" onClick={onLogout}>
            Log Out
          </button>
        </header>

        <section className="admin-empty-panel">
          <h2>Office assignment required</h2>
          <p>Your staff account is not linked to Accounting, ETO, or Clinic yet.</p>
        </section>
      </main>
    );
  }

  const officeRecord = officeStatus?.[officeName] || { isOpen: false, openCounters: [] };
  const openCounters = officeRecord.openCounters || [];

  return (
    <main className="admin-shell centered-shell">
      <header className="admin-header">
        <div>
          <p className="admin-kicker">Staff Console</p>
          <h1>{officeName} Office Management</h1>
          <p className="admin-subtitle">
            Signed in as {user.name} ({user.email})
          </p>
        </div>
        <button type="button" className="admin-logout-btn" onClick={onLogout}>
          Log Out
        </button>
      </header>

      {status?.message ? <p className={`admin-status ${status.type}`}>{status.message}</p> : null}

      <section className="admin-detail-panel">
        <header className="admin-detail-head">
          <div>
            <p className="admin-detail-kicker">{officeName}</p>
            <h2>{officeRecord.isOpen ? "Office management" : "Office is closed"}</h2>
          </div>
          <div className={`admin-office-state ${officeRecord.isOpen ? "is-open" : "is-closed"}`}>
            {officeRecord.isOpen ? "Office Open" : "Office Closed"}
          </div>
        </header>

        <div className="admin-detail-actions">
          <button type="button" className="admin-office-toggle-btn" onClick={() => onToggleOffice(officeName)}>
            {officeRecord.isOpen ? "Close Office" : "Open Office"}
          </button>
        </div>

        <div className="admin-office-summary">
          <p>
            Available counters: <strong>{openCounters.length}</strong>
          </p>
          <p>{openCounters.length > 0 ? openCounters.join(", ") : "No counters are open yet."}</p>
        </div>

        <div className="admin-counter-grid">
          {(OFFICE_COUNTERS[officeName] || []).map((counter) => {
            const tickets = officeQueues?.[officeName]?.[counter] || [];
            const isOpen = officeRecord.openCounters?.includes(counter);

            return (
              <CounterActionRow
                key={counter}
                office={officeName}
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
    </main>
  );
}

export default StaffOfficeConsole;
