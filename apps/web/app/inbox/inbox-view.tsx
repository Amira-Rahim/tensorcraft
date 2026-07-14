"use client";

import Link from "next/link";
import { useState } from "react";
import { markDispatchRead } from "@/lib/dispatch-client";

export interface InboxMessage {
  id: string;
  kind: "weekly_intel" | "milestone" | "cliffhanger";
  subject: string;
  bodyMdx: string;
  ctaLabel: string | null;
  ctaHref: string | null;
  sentAt: string;
  readAt: string | null;
}

const KIND_LABEL: Record<InboxMessage["kind"], string> = {
  weekly_intel: "Weekly intel",
  milestone: "Milestone",
  cliffhanger: "Cliffhanger",
};

export function InboxView({ messages }: { messages: InboxMessage[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [readSet, setReadSet] = useState<Set<string>>(
    new Set(messages.filter((m) => m.readAt).map((m) => m.id)),
  );

  function handleOpen(id: string) {
    setOpenId(id === openId ? null : id);
    if (!readSet.has(id)) {
      setReadSet((prev) => new Set(prev).add(id));
      markDispatchRead(id).catch(() => {});
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-12" data-testid="inbox-page">
      <header className="mb-10">
        <p className="text-[10px] font-mono uppercase tracking-[3px] text-text-muted mb-2">
          DISPATCH inbox
        </p>
        <h1 className="text-3xl font-bold mb-3 text-text-primary">
          Operator messages
        </h1>
        <p className="text-sm text-text-muted leading-relaxed max-w-[640px]">
          Weekly intel + milestone callouts from DISPATCH. Click a message to
          read; it&apos;s marked read on open.
        </p>
      </header>

      {messages.length === 0 && (
        <EmptyState
          title="No intel yet"
          body="DISPATCH will check in once you complete your first lesson. Weekly intel arrives Sunday."
          ctaHref="/themes"
          ctaLabel="Browse themes"
        />
      )}

      <ol className="space-y-3">
        {messages.map((m) => {
          const isRead = readSet.has(m.id);
          const isOpen = openId === m.id;
          return (
            <li
              key={m.id}
              data-testid={`inbox-message-${m.id}`}
              data-read={isRead ? "true" : "false"}
            >
              {/* The expanded body renders as a SIBLING of the toggle, not
                  inside it: a <Link> nested in a <button> is invalid HTML
                  and a keyboard/AT hazard (2026-07-14 UX audit). */}
              <div
                className="brutalist-shadow bg-surface-raised border border-border hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform"
                style={{
                  borderLeft: isRead
                    ? "3px solid var(--tc-border)"
                    : "3px solid var(--tc-primary)",
                }}
              >
                <button
                  type="button"
                  onClick={() => handleOpen(m.id)}
                  className="w-full text-left p-4"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-mono uppercase tracking-[2px] text-text-muted">
                      {KIND_LABEL[m.kind]} · {formatTimeAgo(m.sentAt)}
                    </span>
                    {!isRead && (
                      <span
                        className="text-[9px] font-mono uppercase tracking-[2px] text-primary"
                        aria-label="Unread"
                      >
                        ● new
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-text-primary leading-snug">
                    {m.subject}
                  </h3>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-4 border-t border-border">
                    <p className="text-sm text-text-muted leading-relaxed whitespace-pre-line">
                      {m.bodyMdx}
                    </p>
                    {/* Defense-in-depth: only render internal CTAs. A
                        stored external or javascript: href would turn a
                        trusted inbox message into a phishing/XSS vector. */}
                    {m.ctaHref && m.ctaHref.startsWith("/") && m.ctaLabel && (
                      <Link
                        href={m.ctaHref}
                        className="mt-4 inline-block px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20"
                      >
                        {m.ctaLabel} →
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </main>
  );
}

function EmptyState({
  title,
  body,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  body: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div className="p-8 brutalist-shadow bg-surface-raised border border-border text-center">
      <h2 className="text-lg font-semibold mb-2 text-text-primary">{title}</h2>
      <p className="text-sm text-text-muted mb-5 max-w-[480px] mx-auto">
        {body}
      </p>
      <Link
        href={ctaHref}
        className="inline-block px-5 py-2 text-xs font-mono font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 brutalist-hover"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

function formatTimeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (days <= 0) return "today";
  if (days === 1) return "1d ago";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}
