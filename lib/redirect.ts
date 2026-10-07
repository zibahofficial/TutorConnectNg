/**
 * Shared navigation helpers for role-based redirects.
 * ---------------------------------------------------------------------------
 * `next`-style query parameters must never be trusted blindly: a value like
 * `//evil.com` or `https://evil.com` would turn a login redirect into an
 * open redirect off the site.
 */

/**
 * Returns `raw` only when it is a safe same-origin relative path.
 *
 * Accepts:  `/dashboard/admin`, `/tutors?search=maths`
 * Rejects:  `//evil.com` (protocol-relative), `https://evil.com` (absolute),
 *           `\/evil.com` (backslash trick), `evil.com`, and empty values.
 */
export function safeInternalRedirect(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value.startsWith("/")) return null; // absolute URLs / bare hosts
  if (value.startsWith("//")) return null; // protocol-relative → other origin
  if (value.includes("\\")) return null; // backslash normalizes to "/" in URLs
  return value;
}

/**
 * Each role's own dashboard. Used to send people somewhere they are
 * actually allowed to be (e.g. a non-admin who opens the admin URL).
 */
export function dashboardPathForRole(role: string | null | undefined): string {
  switch (role) {
    case "tutor":
      return "/dashboard/tutor";
    case "parent":
      return "/dashboard/parent";
    case "admin":
      return "/dashboard/admin";
    default:
      return "/dashboard/student";
  }
}
