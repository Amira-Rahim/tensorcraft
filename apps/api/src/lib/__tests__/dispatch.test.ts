import { describe, it, expect, vi, beforeEach } from "vitest";

// Gates for the DISPATCH milestone producer (2026-07-13): module sizes must
// come from the shared constant (browser-runtimes = 6, not 5), milestones
// must fire exactly at completion, and the subject dedup must hold.

const rpcSpy = vi.fn().mockResolvedValue({ data: "msg-id", error: null });
const tables: Record<string, { data: unknown; error: null }> = {};

function chain(table: string) {
  const builder: Record<string, unknown> = {};
  for (const m of ["select", "eq", "limit"]) {
    builder[m] = () => builder;
  }
  builder.then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve(tables[table]).then(resolve);
  return builder;
}

vi.mock("@tensorcraft/supabase", () => ({
  getSupabaseAdminClient: () => ({
    from: (t: string) => chain(t),
    rpc: rpcSpy,
  }),
}));
vi.mock("../logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { fireMilestonesForCompletion } from "../dispatch";

const rows = (moduleId: string, n: number) =>
  Array.from({ length: n }, () => ({ module_id: moduleId }));

beforeEach(() => {
  rpcSpy.mockClear();
  tables["dispatch_messages"] = { data: [], error: null };
});

describe("fireMilestonesForCompletion", () => {
  it("fires the module milestone at exactly 5/5 for a standard module", async () => {
    tables["theme_progress"] = { data: rows("foundations", 5), error: null };
    await fireMilestonesForCompletion({
      userId: "u1",
      themeId: "deep-orbit",
      moduleId: "foundations",
    });
    expect(rpcSpy).toHaveBeenCalledTimes(1);
    const [fn, args] = rpcSpy.mock.calls[0];
    expect(fn).toBe("dispatch_milestone");
    expect(args.p_user_id).toBe("u1");
    expect(args.p_subject).toBe("DISPATCH · module cleared: Foundations");
    expect(args.p_cta_href).toBe("/themes/deep-orbit");
  });

  it("stays silent at 4/5", async () => {
    tables["theme_progress"] = { data: rows("foundations", 4), error: null };
    await fireMilestonesForCompletion({
      userId: "u1",
      themeId: "deep-orbit",
      moduleId: "foundations",
    });
    expect(rpcSpy).not.toHaveBeenCalled();
  });

  it("uses the shared override for browser-runtimes (6 lessons, not 5)", async () => {
    tables["theme_progress"] = {
      data: rows("browser-runtimes", 5),
      error: null,
    };
    await fireMilestonesForCompletion({
      userId: "u1",
      themeId: "deep-orbit",
      moduleId: "browser-runtimes",
    });
    expect(rpcSpy).not.toHaveBeenCalled();

    tables["theme_progress"] = {
      data: rows("browser-runtimes", 6),
      error: null,
    };
    await fireMilestonesForCompletion({
      userId: "u1",
      themeId: "deep-orbit",
      moduleId: "browser-runtimes",
    });
    expect(rpcSpy).toHaveBeenCalledTimes(1);
  });

  it("dedups on subject: an existing message means no second send", async () => {
    tables["theme_progress"] = { data: rows("foundations", 5), error: null };
    tables["dispatch_messages"] = { data: [{ id: "existing" }], error: null };
    await fireMilestonesForCompletion({
      userId: "u1",
      themeId: "deep-orbit",
      moduleId: "foundations",
    });
    expect(rpcSpy).not.toHaveBeenCalled();
  });

  it("fires module AND theme milestones when the 56th lesson completes", async () => {
    tables["theme_progress"] = {
      data: [...rows("capstone", 5), ...rows("other-modules", 51)],
      error: null,
    };
    await fireMilestonesForCompletion({
      userId: "u1",
      themeId: "deep-orbit",
      moduleId: "capstone",
    });
    expect(rpcSpy).toHaveBeenCalledTimes(2);
    const subjects = rpcSpy.mock.calls.map((c) => c[1].p_subject);
    expect(subjects).toContain("DISPATCH · module cleared: Capstone");
    expect(subjects).toContain("DISPATCH · board clear: Deep Orbit");
  });
});
