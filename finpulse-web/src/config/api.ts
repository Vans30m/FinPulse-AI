// Single source of truth for the backend URL across the entire frontend.
// Dev (Vite proxy) → same-origin "" so /api/* is proxied to the backend
// Dev (direct)     → VITE_API_URL or http://localhost:5000 (backend default port)
// Production       → VITE_API_URL from deployment env
const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  (import.meta.env.DEV ? "" : "http://localhost:3000");

const DEFAULT_FETCH_TIMEOUT_MS = 30_000;

export class ApiRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export async function apiFetch(
  input: string,
  init?: RequestInit,
  timeoutMs = DEFAULT_FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiRequestError(
        "Request timed out. Please check that the backend server is running and try again."
      );
    }
    throw new ApiRequestError(
      "Unable to reach the server. Please check your connection and try again."
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export default API_BASE_URL;
