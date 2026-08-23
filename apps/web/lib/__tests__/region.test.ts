import { describe, it, expect } from "vitest";
import { REGION_GATED_COOKIE, isRegionGatedCookie } from "../region";

/**
 * The pricing page is statically rendered with `revalidate = 3600`, so it
 * cannot read request headers without becoming dynamic on every hit. The
 * country is therefore resolved once in middleware and handed to the client
 * as a cookie. This is presentation only: the API gate is the enforcement,
 * so a visitor who deletes the cookie gets a buy button that 403s.
 */
describe("isRegionGatedCookie", () => {
  it("reads the flag when set", () => {
    expect(isRegionGatedCookie(`${REGION_GATED_COOKIE}=1`)).toBe(true);
  });

  it("finds the flag among other cookies", () => {
    expect(
      isRegionGatedCookie(`tc_world=deep-orbit; ${REGION_GATED_COOKIE}=1; a=b`),
    ).toBe(true);
  });

  it("is false when absent, which is the ungated default", () => {
    expect(isRegionGatedCookie("tc_world=deep-orbit")).toBe(false);
    expect(isRegionGatedCookie("")).toBe(false);
  });

  it("is false when explicitly cleared to 0", () => {
    expect(isRegionGatedCookie(`${REGION_GATED_COOKIE}=0`)).toBe(false);
  });

  /**
   * A cookie whose NAME merely ends with the flag name must not match, or
   * any unrelated cookie could switch the notice on.
   */
  it("does not match a cookie that only ends with the flag name", () => {
    expect(isRegionGatedCookie(`x_${REGION_GATED_COOKIE}=1`)).toBe(false);
  });
});
