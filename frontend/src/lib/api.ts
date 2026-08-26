/** Centralized API client with consistent error shape. */

/**
 * In production (Vercel), Next.js rewrites proxy /api/* to the backend.
 * In development, hit localhost directly.
 */
const isBrowser = typeof window !== "undefined";
export const API_URL = isBrowser ? "" : (process.env.API_BACKEND_URL ?? "http://localhost:4000");

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const init: RequestInit = {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers ?? {}),
    },
  };
  if (process.env.NODE_ENV !== "production") {
    console.debug(`[api] ${options.method ?? "GET"} ${path}`);
  }
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api${path}`, init);
  } catch {
    throw new ApiError(
      "NETWORK",
      "Could not reach the service. Check your connection and try again.",
      0
    );
  }

  if (!res.ok) {
    let code = "ERROR";
    let message = res.statusText || "Something went wrong. Please try again.";
    try {
      const data = await res.json();
      if (data?.error) {
        code = data.error.code ?? code;
        message = data.error.message ?? message;
        if (process.env.NODE_ENV !== "production") {
          console.debug(`[api] ${options.method ?? "GET"} ${path} → ${res.status} ${code}`, data.error.fields ?? "");
        }
      }
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(code, message, res.status);
  }
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string, token?: string | null) =>
    request<T>(path, { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
  post: <T>(path: string, body?: unknown, token?: string | null) =>
    request<T>(path, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
};
