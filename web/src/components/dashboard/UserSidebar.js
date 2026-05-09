function UserSidebar({ activeSection, unreadNotifications, onNavigateSection, onLogout }) {
  return (
    <aside className="user-sidebar">
      <div className="user-sidebar-brand">
        <p className="sidebar-kicker">QueueXpress</p>
        <h2>Menu</h2>
      </div>

      <nav className="user-sidebar-nav" aria-label="User sections">
        <button
          type="button"
          className={activeSection === "home" ? "sidebar-link is-active" : "sidebar-link"}
          onClick={() => onNavigateSection("home")}
        >
          Home
        </button>
        <button
          type="button"
          className={activeSection === "notifications" ? "sidebar-link is-active" : "sidebar-link"}
          onClick={() => onNavigateSection("notifications")}
        >
          Notifications
          {unreadNotifications > 0 ? <span className="sidebar-badge">{unreadNotifications}</span> : null}
        </button>
        <button
          type="button"
          className={activeSection === "settings" ? "sidebar-link is-active" : "sidebar-link"}
          onClick={() => onNavigateSection("settings")}
        >
          Settings
        </button>
      </nav>

      <button type="button" className="sidebar-logout" onClick={onLogout}>
        Log out
      </button>
    </aside>
  );
}

export default UserSidebar;
