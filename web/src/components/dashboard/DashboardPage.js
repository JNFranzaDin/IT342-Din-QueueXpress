import { OFFICES } from "../queueManagement/queueConfig";
import { useState } from "react";
import Notifications from "../Notifications/Notifications";
import SettingsPanel from "../Settings/SettingsPanel";
import UserSidebar from "./UserSidebar";
import GetTicketModal from "../Ticket/GetTicketModal";
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
  section,
  activeOffice,
  officeQueues,
  officeStatus,
  currentTicket,
  notifications,
  unreadNotifications,
  onSelectOffice,
  onGetQueue,
  onClearQueue,
  onBackToOffice,
  onNavigateSection,
  onMarkNotificationsRead,
  onChangePassword,
  onLogout,
}) {
  const [showGetModal, setShowGetModal] = useState(false);
  const [modalOffice, setModalOffice] = useState(null);

  if (!user) {
    return null;
  }

  const isQueueView = view === "queue";
  const activeOfficeQueues = officeQueues?.[activeOffice] || {};
  const activeOfficeRecord = officeStatus?.[activeOffice];
  const counters = activeOfficeRecord?.isOpen ? activeOfficeRecord.openCounters || [] : [];
  const leftCounters = counters.slice(0, Math.ceil(counters.length / 2));
  const rightCounters = counters.slice(Math.ceil(counters.length / 2));
  const activeQueueCount = counters.reduce(
    (total, counter) => total + (activeOfficeQueues[counter]?.length || 0),
    0
  );
  const visibleOffices = OFFICES.filter((office) => officeStatus?.[office]?.isOpen);
  const pageTitle = isQueueView ? `${activeOffice} Office` : "Office Services";

  return (
    <main className="workspace-shell centered-shell">
      <UserSidebar
        activeSection={section}
        unreadNotifications={unreadNotifications}
        onNavigateSection={onNavigateSection}
        onLogout={onLogout}
      />

      <section className="workspace-main">
        <header className="workspace-header">
          <div>
            <p className="workspace-kicker">QueueXpress</p>
            <h1>{pageTitle}</h1>
            <p className="workspace-subtitle">
              Signed in as {user.name} ({user.email})
            </p>
          </div>
        </header>

        {section === "home" ? (
          <section className="workspace-panel">
            <header className="workspace-nav">
              <button
                type="button"
                className="back-arrow"
                onClick={isQueueView ? onBackToOffice : undefined}
                aria-label={isQueueView ? "Back to office list" : "Current home view"}
                disabled={!isQueueView}
              >
                {isQueueView ? "Back" : "Home"}
              </button>

              <nav className="office-tabs" aria-label="Office selector">
                {visibleOffices.map((office) => (
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
                {visibleOffices.length === 0 ? (
                  <div className="office-empty-state">
                    <h3>No offices are open</h3>
                    <p>Please wait for the admin to open a counter.</p>
                  </div>
                ) : (
                  visibleOffices.map((office) => (
                    <article key={office} className="office-card">
                      <span>{office}</span>
                      <small>View counters and tickets</small>
                      <div className="office-actions">
                        <button
                          type="button"
                          className="get-ticket-btn"
                          onClick={() => {
                            setModalOffice(office);
                            setShowGetModal(true);
                          }}
                        >
                          Get Ticket
                        </button>
                        <button type="button" className="view-queue-btn" onClick={() => onSelectOffice(office)}>
                          View Queue
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </section>
            ) : (
              <section className="queue-panel">
                <div className="queue-head">
                  <div>
                    <h3 className="queue-title">{activeOffice} Counters</h3>
                    <p className="queue-subtitle">
                      {activeOfficeRecord?.isOpen
                        ? `${activeQueueCount} ticket${activeQueueCount === 1 ? "" : "s"} active`
                        : "This office is closed."}
                    </p>
                  </div>
                  {onClearQueue ? (
                    <button type="button" className="clear-queue-btn" onClick={() => onClearQueue(activeOffice)}>
                      Clear Queue
                    </button>
                  ) : null}
                </div>
                {activeOfficeRecord?.isOpen ? (
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
                ) : (
                  <div className="office-empty-state">
                    <h3>{activeOffice} is closed</h3>
                    <p>No counters are visible until the admin opens this office.</p>
                  </div>
                )}
              </section>
            )}
          </section>
        ) : section === "notifications" ? (
          <Notifications notifications={notifications} onMarkNotificationsRead={onMarkNotificationsRead} />
        ) : (
          <SettingsPanel user={user} currentTicket={currentTicket} onChangePassword={onChangePassword} />
        )}

        {showGetModal && modalOffice ? (
          <GetTicketModal
            office={modalOffice}
            onClose={() => setShowGetModal(false)}
            onSubmit={(form) => {
              setShowGetModal(false);
              onGetQueue(modalOffice, form);
            }}
          />
        ) : null}
      </section>
    </main>
  );
}

export default DashboardPage;
