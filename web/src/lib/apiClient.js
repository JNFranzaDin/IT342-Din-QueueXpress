const API_BASE = process.env.REACT_APP_API_BASE || "";

export const toReadableError = (error, serviceLabel) => {
  const raw = (error && error.message) || "";
  if (/failed to fetch|networkerror|network error/i.test(raw)) {
    return `Cannot reach ${serviceLabel}. Check internet/server and try again.`;
  }
  return raw || "Request failed.";
};

const requestJson = async (path, method, body) => {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    throw new Error(toReadableError(error, `backend API${API_BASE ? ` at ${API_BASE}` : ""}`));
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      (Array.isArray(payload.details) && payload.details.join(" | ")) ||
      payload.message ||
      "Request failed.";
    throw new Error(message);
  }

  return payload;
};

export const getJson = async (path) => requestJson(path, "GET");

export const postJson = async (path, body) => requestJson(path, "POST", body);

export const putJson = async (path, body) => requestJson(path, "PUT", body);

export { API_BASE };
