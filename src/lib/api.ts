// ---------------------------------------------------------------------------
// api.ts — the backend's base URL, in one place.
//
// This literal used to be copy-pasted into eight files (data.ts, the contact
// page, the Studio login, both modals and all three Studio clients). Every one
// of them carried the same `?? "https://theshutterbug.onrender.com"` fallback,
// so a change of host meant eight edits and any missed copy would keep
// silently pointing at the old deployment.
//
// NEXT_PUBLIC_ is required, not optional: these calls are made from Client
// Components as well as from Server Components, so the value has to survive
// into the browser bundle.
// ---------------------------------------------------------------------------

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://theshutterbug.onrender.com";

/**
 * Build an absolute API URL from a leading-slash path.
 * `apiUrl("/api/photos")` → "https://…/api/photos".
 */
export function apiUrl(path: string): string {
  return `${API_URL}${path}`;
}
