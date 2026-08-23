import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { logger } from "./logger";

/**
 * Encryption at rest for `profiles.github_token`.
 *
 * That column holds a live GitHub credential in plaintext, and the RLS policy
 * on `profiles` is row-level with no column restriction, so
 * `select("github_token")` returns it to the browser for your own row.
 * Encrypting means a database disclosure, a backup, or a mis-scoped select
 * yields ciphertext rather than a usable credential.
 *
 * AES-256-GCM, fresh IV per write, authenticated so tampering is detected
 * rather than silently decrypting to garbage.
 *
 * The stored envelope is `v1:<iv>:<tag>:<ciphertext>`, all base64. It is
 * self-identifying on purpose: rows written before this existed are bare
 * tokens, and they must keep working until they are rewritten.
 */

const ENVELOPE_PREFIX = "v1:";

let warnedNoKey = false;

/**
 * 32-byte key derived from whatever the operator set. Hashing rather than
 * requiring exact base64 length is a deliberate ergonomics choice: a
 * wrong-length key would fail at runtime on the GitHub path, and this is a
 * secret a human pastes into a dashboard.
 */
function keyOrNull(): Buffer | null {
  const raw = process.env.GITHUB_TOKEN_ENC_KEY?.trim();
  if (!raw) return null;
  return createHash("sha256").update(raw).digest();
}

/** Whether a stored value is one of our envelopes rather than a legacy token. */
export function isEncrypted(stored: string): boolean {
  return stored.startsWith(ENVELOPE_PREFIX);
}

/**
 * Encrypt for storage.
 *
 * With no key configured this returns the token unchanged rather than
 * throwing. The key is a new operator step, and refusing to store would break
 * GitHub sign-in for everyone the moment this ships while the variable is
 * still unset. The warning is what makes that state visible.
 */
export function encryptToken(plain: string): string {
  const key = keyOrNull();
  if (!key) {
    if (!warnedNoKey) {
      warnedNoKey = true;
      logger.warn(
        { source: "token-crypto" },
        "GITHUB_TOKEN_ENC_KEY is unset: GitHub tokens are being stored in plaintext",
      );
    }
    return plain;
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    ENVELOPE_PREFIX + iv.toString("base64"),
    tag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(":");
}

/**
 * Decrypt a stored value.
 *
 * Returns the input unchanged for a legacy plaintext row, and NULL when an
 * envelope cannot be opened (no key, wrong key, tampering). Null is the safe
 * answer: returning the envelope would send ciphertext to GitHub as a bearer
 * token, and the caller already handles a missing token as "not connected".
 */
export function decryptToken(stored: string): string | null {
  if (!isEncrypted(stored)) return stored;

  const key = keyOrNull();
  if (!key) {
    logger.error(
      { source: "token-crypto" },
      "Stored GitHub token is encrypted but GITHUB_TOKEN_ENC_KEY is unset; treating as disconnected",
    );
    return null;
  }

  try {
    const [ivPart, tagPart, ctPart] = stored
      .slice(ENVELOPE_PREFIX.length)
      .split(":");
    if (!ivPart || !tagPart || !ctPart) return null;

    const decipher = createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(ivPart, "base64"),
    );
    decipher.setAuthTag(Buffer.from(tagPart, "base64"));
    return (
      decipher.update(Buffer.from(ctPart, "base64")).toString("utf8") +
      decipher.final("utf8")
    );
  } catch {
    // Wrong key or tampered payload. GCM authentication failing here is the
    // mechanism working, not an error to paper over.
    return null;
  }
}
