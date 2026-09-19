import { expect, it, vi } from "vitest";
import { getLearningRoutePreference } from "./learning-route-server";

it("isolates the account query and handles absent or unavailable preferences", async () => {
  const maybeSingle = vi.fn().mockResolvedValue({
    data: { ml_learning_route: "challenge" },
    error: null,
  });
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  const client = { from } as unknown as Parameters<
    typeof getLearningRoutePreference
  >[0];
  expect(await getLearningRoutePreference(client, null)).toEqual({
    route: null,
    unavailable: false,
  });
  expect(from).not.toHaveBeenCalled();
  expect(await getLearningRoutePreference(client, "alice")).toEqual({
    route: "challenge",
    unavailable: false,
  });
  expect(eq).toHaveBeenLastCalledWith("id", "alice");
  expect(select).toHaveBeenLastCalledWith("ml_learning_route");
  maybeSingle.mockResolvedValue({ data: null, error: { code: "42703" } });
  expect(await getLearningRoutePreference(client, "bob")).toEqual({
    route: null,
    unavailable: true,
  });
  maybeSingle.mockResolvedValue({
    data: { ml_learning_route: "stale" },
    error: null,
  });
  expect(await getLearningRoutePreference(client, "bob")).toEqual({
    route: null,
    unavailable: false,
  });
});
