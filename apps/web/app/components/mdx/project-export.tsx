"use client";

import { useRef, useState } from "react";
import type { ProjectTarget } from "@tensorcraft/shared";
import { apiFetch } from "@/lib/api-fetch";
import { readProjectFolder } from "@/lib/project-export";

const buttonClass =
  "rounded border border-interactive px-3 py-2 text-sm hover:bg-surface disabled:opacity-50 focus-visible:outline focus-visible:outline-2";
export function ProjectExport() {
  const [selection, setSelection] = useState<Awaited<
    ReturnType<typeof readProjectFolder>
  > | null>(null);
  const [target, setTarget] = useState<ProjectTarget | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const lock = useRef(false);

  async function api(method: "GET" | "POST") {
    const response = await apiFetch("/api/github/project-export", {
      method,
      timeoutMs: 120_000,
      ...(method === "POST"
        ? {
            body: JSON.stringify({
              files: selection?.files,
              repositoryId: target?.repositoryId,
              private: target?.private,
            }),
          }
        : {}),
    });
    const body = await response.json();
    if (!response.ok)
      throw new Error(
        response.status === 401
          ? "Sign in or reconnect GitHub in Settings, then retry."
          : body.error || "Project export failed.",
      );
    return body;
  }
  async function run(action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setResult("");
    try {
      await action();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Project export failed. Retry the same folder. The export reuses completed snapshots.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="space-y-3 rounded border border-border p-4">
      <h4 className="font-semibold">
        Publish your completed project to GitHub
      </h4>
      <p className="text-sm">
        Run training, artifact checks and both evaluations first. Select the
        project folder to preview its files. File contents stay in this browser
        until you publish.
      </p>
      <label className="block text-sm">
        Completed project folder
        <input
          type="file"
          aria-label="Completed project folder"
          disabled={busy}
          multiple
          {...{ webkitdirectory: "", directory: "" }}
          className="mt-2 block w-full min-w-0 text-sm"
          onChange={(event) => {
            const selected = Array.from(event.target.files ?? []);
            setSelection(null);
            setConfirmed(false);
            setTarget(null);
            if (selected.length)
              void run(async () =>
                setSelection(await readProjectFolder(selected)),
              );
          }}
        />
      </label>
      {selection && (
        <>
          <p className="text-sm">
            {selection.files.length} files,{" "}
            {(selection.bytes / 1024).toFixed(1)} KiB. {selection.skipped} other
            files excluded.
          </p>
          <details>
            <summary className="cursor-pointer text-sm">
              Review files to publish
            </summary>
            <ul className="max-h-56 overflow-auto text-sm">
              {selection.files.map((file) => (
                <li key={file.path} className="break-all">
                  {file.path}
                </li>
              ))}
            </ul>
          </details>
          <p className="text-sm">
            Included: project files, model artifacts, evaluation JSON and
            optional src/*.js, *.mjs or *.json helpers. The export excludes
            dependencies, Git metadata and other files. Check your code and
            report for personal information or credentials.
          </p>
          <button
            type="button"
            className={buttonClass}
            disabled={busy}
            onClick={() =>
              void run(async () => {
                setConfirmed(false);
                setTarget(null);
                setTarget(await api("GET"));
              })
            }
          >
            Preview GitHub destination
          </button>
        </>
      )}
      {target && (
        <>
          <p className="break-all text-sm">
            Destination:{" "}
            <a
              href={target.url}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              {target.fullName}
            </a>{" "}
            (
            {target.private ? "private" : "public. Anyone can read these files"}
            ). Each changed selection creates a snapshot under
            projects/room-occupancy-v1.
          </p>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              disabled={busy}
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            I reviewed the included files and want to publish them to this
            repository.
          </label>
          <button
            type="button"
            className={buttonClass}
            disabled={busy || !confirmed}
            onClick={() =>
              void run(async () => {
                const body = await api("POST");
                setResult(body.url);
                setConfirmed(false);
              })
            }
          >
            {busy ? "Publishing project..." : "Publish project snapshot"}
          </button>
        </>
      )}
      {error && (
        <p role="alert" className="text-sm">
          {error}{" "}
          <a href="/settings" className="underline">
            GitHub settings
          </a>
          . If a request timed out, retry the same folder to recover a completed
          snapshot.
        </p>
      )}
      {result && (
        <p role="status" className="text-sm">
          Project saved.{" "}
          <a
            href={result}
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Open this snapshot on GitHub
          </a>
          . Publishing does not award a rubric pass.
        </p>
      )}
      <p className="text-sm text-text-muted">
        Uses your existing tensorcraft-deep-orbit repository. Connect GitHub and
        grant the app access to that repository in Settings first. You can also
        share a ZIP without connecting GitHub.
      </p>
    </div>
  );
}
