"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SystemEvidenceStage } from "@/lib/system-evidence";
import {
  LearningActivityScope,
  useActivityUser,
} from "./learning-activity-scope";

export function SystemEvidence(props: {
  userId: string;
  stages: SystemEvidenceStage[];
  unavailable: boolean;
  entitled?: boolean;
}) {
  return (
    <LearningActivityScope userId={props.userId}>
      <EvidenceBody {...props} />
    </LearningActivityScope>
  );
}
function EvidenceBody({
  userId,
  stages,
  unavailable,
  entitled = true,
}: {
  userId: string;
  stages: SystemEvidenceStage[];
  unavailable: boolean;
  entitled?: boolean;
}) {
  const current = useActivityUser(),
    router = useRouter();
  if (current !== userId)
    return (
      <div className="p-5" role="status">
        Account changed.{" "}
        <button
          type="button"
          className="underline"
          onClick={() => router.refresh()}
        >
          Load this account’s work
        </button>
      </div>
    );
  return (
    <section
      aria-labelledby="system-evidence-title"
      className="relative my-6 bg-surface p-4 text-text sm:p-6"
    >
      <h2 id="system-evidence-title" className="text-xl font-semibold">
        Your DEEP SCAN system
      </h2>
      <p className="mt-2 text-sm text-text-muted">
        Find the work behind each part of the system. Exercise passes, recall
        ratings and external runs have different sources; none is a mastery
        percentage.
      </p>
      {unavailable && (
        <p role="status" className="my-3">
          Some practice or review records could not load. Empty sections may be
          incomplete.{" "}
          <button
            type="button"
            className="min-h-11 underline"
            onClick={() => router.refresh()}
          >
            Retry records
          </button>
        </p>
      )}
      <div className="mt-5 divide-y divide-border">
        {stages.map((stage) => (
          <details key={stage.id} className="py-3">
            <summary className="min-h-11 cursor-pointer py-2 font-semibold">
              {stage.title}
              <span className="ml-3 font-normal text-text-muted">
                {stage.work.length
                  ? `${stage.work.length} linked ${stage.work.length === 1 ? "record" : "records"}`
                  : "No recorded practice yet"}
                {stage.due.length
                  ? ` · ${stage.due.length} ${stage.due.length === 1 ? "review" : "reviews"} due`
                  : ""}
              </span>
            </summary>
            <p>{stage.purpose}</p>
            <p className="mt-2 text-sm text-text-muted">
              {stage.completedLessons} lessons marked complete, tracked
              separately from the work below. Records shown are the recent
              available history.
            </p>
            <p className="my-3">
              <span className="font-medium">Next useful task: </span>
              <Link
                className="underline underline-offset-4"
                href={stage.next.href}
              >
                {stage.next.label}
              </Link>
            </p>
            <ul className="space-y-4">
              {[...stage.due, ...stage.work].map((item, i) => (
                <li key={`${item.href}:${i}`}>
                  <Link
                    className="inline-block py-2 font-medium underline underline-offset-4"
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                  <p className="text-sm text-text-muted">{item.detail}</p>
                </li>
              ))}
            </ul>
            {stage.id === "data" && (
              <p className="mt-4">
                Project checkpoint: choose the room features and a chronological
                split before fitting any scaler.
              </p>
            )}
            {stage.id === "evaluation" && (
              <p className="mt-4">
                Project checkpoint: compare model and rule on the same
                validation rows, record costs, then freeze the threshold before
                the final test.
              </p>
            )}
            {stage.id === "operations" && (
              <p className="mt-4">
                Project checkpoint: export the model with its scaler, run the
                local app and record what you observed. Exporting files alone
                does not demonstrate a run.
              </p>
            )}
          </details>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <a
          className="min-h-11 py-3 underline"
          href="/assignments/room-occupancy-v1/README.md"
        >
          Room-project brief
        </a>
        <a
          className="min-h-11 py-3 underline"
          download
          href="/assignments/room-occupancy-v1.zip"
        >
          Download starter
        </a>
        <Link
          className="min-h-11 py-3 underline"
          href={
            entitled
              ? "/worlds/deep-orbit/capstone/launch?start=challenge"
              : "/pricing?locked=deep-orbit&module=capstone"
          }
        >
          {entitled
            ? "Project run and export"
            : "Get access to project run and export"}
        </Link>
      </div>
    </section>
  );
}
