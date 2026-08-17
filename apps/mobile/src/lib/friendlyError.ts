/**
 * Never show a raw error.message straight to a user — on Android,
 * React Native's fetch surfaces raw native/Java exception text
 * unmodified (e.g. "fetch failed: java.net.UnknownHostException:
 * Unable to resolve host ... No address associated with hostname"
 * for a plain DNS/connectivity failure). Supabase's client just
 * passes whatever the underlying fetch threw straight through, so
 * every screen calling supabase.auth.* or a table query inherited
 * this same risk.
 *
 * This is deliberately conservative: known-clear Supabase Auth
 * messages pass through unchanged (a user genuinely benefits from
 * seeing "Invalid login credentials", it's not technical noise), but
 * anything unrecognized or exception-shaped gets replaced with a
 * generic, actionable fallback rather than risking another raw
 * stack-trace-looking string slipping through.
 */
export function getFriendlyErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const lower = raw.toLowerCase();

  const networkPatterns = [
    "unknownhostexception",
    "unable to resolve host",
    "network request failed",
    "failed to fetch",
    "no address associated with hostname",
    "fetch failed",
    "timeout",
    "timed out",
    "connection reset",
    "socket",
  ];
  if (networkPatterns.some((pattern) => lower.includes(pattern))) {
    return "No internet connection. Check your network and try again.";
  }

  const knownClearMessages = [
    "invalid login credentials",
    "user already registered",
    "already registered",
    "email not confirmed",
    "email rate limit exceeded",
    "password should be at least",
    "token has expired",
    "invalid or expired",
    "new password should be different",
    "expired or invalid",
    "otp",
  ];
  if (knownClearMessages.some((pattern) => lower.includes(pattern))) {
    return raw;
  }

  // Exception/stack-trace shaped text — even if it didn't match a known
  // network pattern above, still shouldn't reach the screen verbatim.
  const looksTechnical =
    raw.length > 120 ||
    /exception|stacktrace|at\s+\w+\.\w+\(|\.java:\d+|\.kt:\d+/i.test(raw);
  if (looksTechnical) {
    return "Something went wrong. Please try again.";
  }

  return raw;
}
