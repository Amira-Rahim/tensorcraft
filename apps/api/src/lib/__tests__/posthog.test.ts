import { describe, it, expect, beforeEach, vi } from "vitest";

const captureMock = vi.fn();
const shutdownMock = vi.fn().mockResolvedValue(undefined);

vi.mock("posthog-node", () => {
  class PostHog {
    capture = captureMock;
    shutdown = shutdownMock;
  }
  return { PostHog };
});

import {
  __resetForTests,
  captureServer,
  captureServerEvent,
  getPostHog,
  SERVER_EVENTS,
} from "../posthog";

describe("api/lib/posthog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    __resetForTests();
  });

  it("returns null when POSTHOG_KEY is absent", () => {
    vi.stubEnv("POSTHOG_KEY", "");
    expect(getPostHog()).toBeNull();
  });

  it("captureServerEvent no-ops when client is null", () => {
    vi.stubEnv("POSTHOG_KEY", "");
    captureServerEvent("user-1", "payment_completed", { amount: 49 });
    expect(captureMock).not.toHaveBeenCalled();
  });

  it("captureServer forwards to PostHog with distinctId", () => {
    vi.stubEnv("POSTHOG_KEY", "phc_server");

    captureServer(
      SERVER_EVENTS.PAYMENT_COMPLETED,
      {
        planId: "single",
        themeIds: ["deep-orbit"],
        amount: 49,
        sessionId: "cs_test_1",
      },
      "user-42",
    );

    expect(captureMock).toHaveBeenCalledWith({
      distinctId: "user-42",
      event: "payment_completed",
      properties: {
        planId: "single",
        themeIds: ["deep-orbit"],
        amount: 49,
        sessionId: "cs_test_1",
      },
    });
  });

  it("SERVER_EVENTS names are all snake_case", () => {
    const SNAKE = /^[a-z]+(_[a-z]+)*$/;
    for (const name of Object.values(SERVER_EVENTS)) {
      expect(name, name).toMatch(SNAKE);
    }
  });

  it("captureServer forwards code_pushed with expected shape", () => {
    vi.stubEnv("POSTHOG_KEY", "phc_server");

    captureServer(
      SERVER_EVENTS.CODE_PUSHED,
      {
        themeId: "deep-orbit",
        lessonId: "intro-tensors",
        exerciseSlug: "intro-tensors",
        commitSha: "abc1234",
      },
      "user-77",
    );

    expect(captureMock).toHaveBeenCalledWith({
      distinctId: "user-77",
      event: "code_pushed",
      properties: {
        themeId: "deep-orbit",
        lessonId: "intro-tensors",
        exerciseSlug: "intro-tensors",
        commitSha: "abc1234",
      },
    });
  });
});
