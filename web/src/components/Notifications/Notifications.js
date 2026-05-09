function Notifications({ notifications, onMarkNotificationsRead }) {
  return (
    <section className="dashboard-section">
      <div className="dashboard-section-head">
        <div>
          <p className="section-kicker">Notifications</p>
          <h3>Recent activity</h3>
        </div>
        <button type="button" className="section-action" onClick={onMarkNotificationsRead}>
          Mark all read
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="dashboard-empty-state">
          <h4>No notifications yet</h4>
          <p>Updates about your ticket will appear here.</p>
        </div>
      ) : (
        <ul className="notification-list">
          {notifications.map((item) => (
            <li key={item.id} className={item.read ? "notification-item" : "notification-item is-unread"}>
              <p>{item.message}</p>
              <small>
                {item.ticket} • {item.officeName}
                {item.counterName ? ` • ${item.counterName}` : ""}
              </small>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default Notifications;
