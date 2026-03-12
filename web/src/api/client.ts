/**
 * Fetch with Authorization: Bearer <token> when user is logged in.
 * Use for all API calls that require authentication (cookbooks, recipes, account).
 */
export function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(url, { ...options, headers });
}
