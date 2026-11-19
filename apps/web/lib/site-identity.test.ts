import { describe, expect, it } from "vitest";
import { serializeJsonLd } from "./site-identity";

describe("site identity", () => {
  it("preserves content without allowing an authored script closing tag", () => {
    const content = { name: "</script><script>alert(1)</script>" };
    const serialized = serializeJsonLd(content);
    expect(serialized).not.toContain("<");
    expect(JSON.parse(serialized)).toEqual(content);
  });
});
