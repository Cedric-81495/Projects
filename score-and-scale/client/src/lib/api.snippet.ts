// Reference only — merge into your existing client/src/lib/api.ts,
// which already has your base URL + credentials setup. Shown here so
// PaymentForm.tsx's api.get(...) / api.post(...) calls have a known shape.

const BASE_URL = import.meta.env.VITE_API_URL as string;

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include", // sends the httpOnly JWT cookie
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }

  return data;
}

export const api = {
  get: (path: string) => request(path, { method: "GET" }),
  post: (path: string, body?: unknown) =>
    request(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
};
