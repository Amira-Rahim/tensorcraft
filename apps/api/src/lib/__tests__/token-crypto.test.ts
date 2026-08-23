import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { encryptToken, decryptToken, isEncrypted } from "../token-crypto";

/**
 * Encryption at rest for `profiles.github_token`.
 *
 * The column stores a live GitHub credential in plaintext, and the row-level
 * RLS policy carries no column restriction, so `select("github_token")`
 * returns it to the browser for your own row. Encrypting it means a database
 * disclosure, a backup, or a mis-scoped select yields ciphertext instead of a
 * usable credential.
 *
 * Two properties matter more than the cipher choice. It must be able to read
 * rows written BEFORE encryption existed, or every connected account breaks
 * on deploy. And it must degrade honestly when the key is absent rather than
 * writing something that looks encrypted and is not.
 */
describe("token crypto", () => {
  beforeEach(() => {
    vi.stubEnv("GITHUB_TOKEN_ENC_KEY", "a-test-key-that-is-long-enough");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("round-trips a token", () => {
    const stored = encryptToken("gho_secret_value");

    expect(stored).not.toContain("gho_secret_value");
    expect(decryptToken(stored)).toBe("gho_secret_value");
  });

  it("produces a different ciphertext each time", () => {
    // A fresh IV per write. Identical ciphertexts would leak that two
    // accounts share a token.
    expect(encryptToken("gho_same")).not.toBe(encryptToken("gho_same"));
  });

  /**
   * Rows written before this existed are bare tokens. They must keep working
   * until they are rewritten, or every already-connected account breaks the
   * moment this deploys.
   */
  it("reads a legacy plaintext row unchanged", () => {
    expect(isEncrypted("gho_legacy_plaintext")).toBe(false);
    expect(decryptToken("gho_legacy_plaintext")).toBe("gho_legacy_plaintext");
  });

  it("recognises its own envelope", () => {
    expect(isEncrypted(encryptToken("gho_x"))).toBe(true);
  });

  it("rejects a tampered ciphertext rather than returning garbage", () => {
    const stored = encryptToken("gho_secret_value");
    const tampered = stored.slice(0, -4) + "AAAA";

    // GCM authenticates. A silently wrong plaintext would be worse than null.
    expect(decryptToken(tampered)).toBeNull();
  });

  it("cannot read a token encrypted under a different key", () => {
    const stored = encryptToken("gho_secret_value");
    vi.stubEnv("GITHUB_TOKEN_ENC_KEY", "a-completely-different-key-value");

    expect(decryptToken(stored)).toBeNull();
  });

  describe("with no key configured", () => {
    beforeEach(() => {
      vi.stubEnv("GITHUB_TOKEN_ENC_KEY", "");
    });

    /**
     * Deliberately stores plaintext rather than throwing. The key is a new
     * operator step, and refusing to store would break GitHub sign-in for
     * everyone the moment this ships while the var is still unset. The
     * warning is what makes it visible.
     */
    it("stores plaintext so the integration keeps working", () => {
      expect(encryptToken("gho_x")).toBe("gho_x");
    });

    it("still reads plaintext rows", () => {
      expect(decryptToken("gho_x")).toBe("gho_x");
    });

    it("returns null for a row it cannot decrypt, never the envelope", () => {
      vi.stubEnv("GITHUB_TOKEN_ENC_KEY", "a-test-key-that-is-long-enough");
      const stored = encryptToken("gho_x");
      vi.stubEnv("GITHUB_TOKEN_ENC_KEY", "");

      // Key removed after rows were encrypted. Returning the envelope would
      // send ciphertext to GitHub as a bearer token.
      expect(decryptToken(stored)).toBeNull();
    });
  });
});
