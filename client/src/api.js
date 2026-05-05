const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export async function apiFetch(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  return fetch(url, options);
}

export function buildWebSocketUrl(path) {
  const base = new URL(API_BASE_URL);
  const wsProtocol = base.protocol === "https:" ? "wss:" : "ws:";
  return `${wsProtocol}//${base.host}${path}`;
}

export { API_BASE_URL };
