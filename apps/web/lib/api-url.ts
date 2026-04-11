/**
 * Returns the API base URL. Throws in production if NEXT_PUBLIC_API_URL is not set,
 * falls back to localhost:3001 in development.
 */
export function getApiUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (url) return url;
  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_API_URL is required in production");
  }
  return "http://localhost:3001";
}
