function Profile({ user, currentTicket }) {
  return (
    <section className="profile-card">
      <div className="profile-card-head">
        <div>
          <p className="profile-kicker">Profile</p>
          <h3>{user.name}</h3>
        </div>
        <div className="profile-avatar" aria-hidden="true">
          {user.name?.charAt(0)?.toUpperCase() || "U"}
        </div>
      </div>

      <dl className="profile-list">
        <div>
          <dt>Email</dt>
          <dd>{user.email}</dd>
        </div>
        <div>
          <dt>Current Ticket</dt>
          <dd>{currentTicket?.ticket || "No active ticket"}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{currentTicket?.status || "Idle"}</dd>
        </div>
      </dl>
    </section>
  );
}

export default Profile;