/**
 * Messages for the `github_error` query parameter the API sets when it sends
 * a browser back from the GitHub OAuth callback (apps/api/src/routes/github.ts,
 * 2026-09-20). The code set is closed; an unknown value renders nothing, so
 * the query string is never echoed onto the page.
 */
const MESSAGES: Record<string, string> = {
  access_denied:
    "GitHub connection was cancelled. Connect again when you are ready.",
  state_mismatch:
    "That GitHub sign-in link had expired. Start the connection again.",
  not_configured:
    "GitHub connection is not available right now. Try again later.",
  exchange_failed: "GitHub did not complete the connection. Try again.",
  profile_failed: "GitHub did not complete the connection. Try again.",
  storage_failed: "The GitHub connection could not be saved. Try again.",
};

export function githubConnectMessage(code: string | undefined): string | null {
  if (!code) return null;
  return Object.hasOwn(MESSAGES, code) ? MESSAGES[code]! : null;
}
