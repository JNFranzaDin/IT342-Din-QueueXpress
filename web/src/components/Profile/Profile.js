function Profile({ user, currentTickets = [] }) {
  const ticketList = Array.isArray(currentTickets) ? currentTickets : [];

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
          <dt>Current Tickets</dt>
          <dd>
            {ticketList.length === 0 ? (
              "No active ticket"
            ) : (
              <ul className="profile-ticket-list">
                {ticketList.map((ticket) => (
                  <li key={`${ticket.officeName}-${ticket.ticket}`}>
                    {ticket.officeName}: {ticket.ticket} ({ticket.status || "waiting"})
                  </li>
                ))}
              </ul>
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}

export default Profile;