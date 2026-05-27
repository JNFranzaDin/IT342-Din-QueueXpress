function NotificationsPanel({ notifications, onMarkNotificationsRead, onRemoveNotification, onDeleteNotification, onDeleteAllNotifications }) {
  return (
    <section className="dashboard-section">
      <div className="dashboard-section-head">
        <div>
          <p className="section-kicker">Notifications</p>
          <h3>Recent activity</h3>
        </div>
        <div className="section-actions">
          <button type="button" className="section-action" onClick={onMarkNotificationsRead}>
            Mark all read
          </button>
          {onDeleteAllNotifications ? (
            <button type="button" className="section-action section-action--danger" onClick={onDeleteAllNotifications}>
              Delete All
            </button>
          ) : null}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="dashboard-empty-state">
          <h4>No notifications yet</h4>
          <p>Updates about your ticket will appear here.</p>
        </div>
      ) : (
        <ul className="notification-list">
          {notifications.map((item) => (
            <li
              key={item.id}
              className={["notification-item", item.read ? "" : "is-unread", item.removed ? "is-removed" : ""].filter(Boolean).join(" ")}
            >
              <div className="notification-item-body">
                <p>{item.message}</p>
                <small>
                  {item.ticket} • {item.officeName}
                  {item.counterName ? ` • ${item.counterName}` : ""}
                </small>
                <small>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</small>
                {item.removed ? <small className="notification-flag">Removed</small> : null}
              </div>

              <div className="notification-actions">
                {onRemoveNotification ? (
                  <button type="button" className="notification-action-btn is-remove" onClick={() => onRemoveNotification(item.id)}>
                    Read
                  </button>
                ) : null}
                {onDeleteNotification ? (
                  <button type="button" className="notification-action-btn is-delete" onClick={() => onDeleteNotification(item.id)}>
                    Delete
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default NotificationsPanel;
