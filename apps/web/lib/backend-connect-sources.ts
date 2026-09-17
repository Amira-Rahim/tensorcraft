/** CSP sources for the explicitly configured application backends. */
export function backendConnectSources(
  apiUrl?: string,
  supabaseUrl?: string,
): string[] {
  const sources = new Set<string>();
  for (const [name, value] of [
    ["NEXT_PUBLIC_API_URL", apiUrl],
    ["NEXT_PUBLIC_SUPABASE_URL", supabaseUrl],
  ]) {
    if (!value) continue;
    const url = new URL(value);
    const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (
      url.username ||
      url.password ||
      (url.protocol !== "https:" && !(loopback && url.protocol === "http:"))
    ) {
      throw new Error(`${name} must use HTTPS, or HTTP on a loopback host`);
    }
    sources.add(url.origin);
    if (name === "NEXT_PUBLIC_SUPABASE_URL") {
      url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
      sources.add(url.origin);
    }
  }
  return [...sources];
}
