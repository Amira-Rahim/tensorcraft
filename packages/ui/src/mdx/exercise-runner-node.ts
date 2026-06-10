/**
 * Node-side runner, used by Vitest (and any SSR path) where web Worker is
 * not available. Uses `node:worker_threads` so `worker.terminate()` actually
 * kills sync infinite loops in user code.
 */

import { Worker as NodeWorker } from "node:worker_threads";
import {
  parseAndRunTestsWith,
  WORKER_BODY_STRING,
  type TestRunOutcome,
  type WorkerHandle,
  type WorkerReply,
} from "./exercise-runner";

function spawnNodeWorker(): Promise<WorkerHandle> {
  const w = new NodeWorker(WORKER_BODY_STRING, { eval: true });
  return Promise.resolve({
    send: (m) => w.postMessage(m),
    onReply: (cb) => {
      w.on("message", (data: WorkerReply) => cb(data));
    },
    terminate: async () => {
      await w.terminate();
    },
  });
}

export async function parseAndRunTests(
  userCode: string,
  testCode: string,
  timeoutMs = 10_000,
): Promise<TestRunOutcome> {
  return parseAndRunTestsWith(spawnNodeWorker, userCode, testCode, timeoutMs);
}
