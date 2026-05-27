import { useCallback, useEffect, useState } from "react";

function UserManagementPanel({ apiBase = "" }) {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState("");

  const fetchPendingUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${apiBase}/api/admin/users/pending`);
      const payload = await response.json().catch(() => []);

      if (!response.ok) {
        throw new Error(payload.message || "Failed to load pending users.");
      }

      setPendingUsers(Array.isArray(payload) ? payload : []);
    } catch (fetchError) {
      setPendingUsers([]);
      setError(fetchError.message || "Failed to load pending users.");
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    fetchPendingUsers();
    const intervalId = window.setInterval(fetchPendingUsers, 3000);

    return () => window.clearInterval(intervalId);
  }, [fetchPendingUsers]);

  const handleAction = async (userId, action) => {
    setActionLoadingId(userId);
    setError("");

    try {
      const response = await fetch(`${apiBase}/api/admin/users/${userId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.message || `Failed to ${action} user.`);
      }

      setPendingUsers((prev) => prev.filter((user) => user.userId !== userId));
    } catch (actionError) {
      setError(actionError.message || `Failed to ${action} user.`);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <section className="admin-user-panel">
      <div className="admin-section-head">
        <div>
          <p className="admin-detail-kicker">User Management</p>
          <h2>Pending registrations</h2>
        </div>
        <button type="button" className="admin-refresh-btn" onClick={fetchPendingUsers}>
          Refresh
        </button>
      </div>

      {loading ? <div className="admin-empty-panel"><p>Loading pending registrations...</p></div> : null}
      {error ? <p className="admin-status error">{error}</p> : null}

      {!loading && pendingUsers.length === 0 ? (
        <div className="admin-empty-panel">
          <h2>No pending accounts</h2>
          <p>All registrations have already been reviewed.</p>
        </div>
      ) : null}

      <div className="admin-user-list">
        {pendingUsers.map((user) => (
          <article key={user.userId} className="admin-user-card">
            <div>
              <strong>{user.name}</strong>
              <p>{user.email}</p>
              <small>
                {user.role}{user.office ? ` • ${user.office}` : ""} • {user.approvalStatus}
              </small>
            </div>
            <div className="admin-user-actions">
              <button
                type="button"
                className="admin-approve-btn"
                onClick={() => handleAction(user.userId, "approve")}
                disabled={actionLoadingId === user.userId}
              >
                Approve
              </button>
              <button
                type="button"
                className="admin-decline-btn"
                onClick={() => handleAction(user.userId, "decline")}
                disabled={actionLoadingId === user.userId}
              >
                Decline
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default UserManagementPanel;
