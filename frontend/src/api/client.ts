const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(/\/$/, "");

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
  });

  if (!response.ok) {
    const responseText = await response.text();
    let body: { detail?: unknown } | null = null;
    try {
      body = responseText ? JSON.parse(responseText) as { detail?: unknown } : null;
    } catch {
      body = null;
    }
    const detail = body?.detail;
    const message = typeof detail === "string"
      ? detail
      : Array.isArray(detail) && typeof detail[0]?.msg === "string"
        ? detail[0].msg
        : responseText.trim() || `Request failed (${response.status}). Please try again.`;
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  const responseText = await response.text();
  if (!responseText.trim()) {
    throw new Error("The server returned an empty response. Check the API URL and deployment.");
  }
  try {
    return JSON.parse(responseText) as T;
  } catch {
    throw new Error("The server returned an invalid response. Check the API URL and deployment.");
  }
}

export function jsonBody(value: unknown): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(value),
  };
}