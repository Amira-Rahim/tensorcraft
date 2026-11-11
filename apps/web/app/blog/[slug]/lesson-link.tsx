"use client";

import Link from "next/link";
import { EVENTS, track } from "@/lib/analytics-events";

interface LessonLinkProps {
  postSlug: string;
  weekIso?: string;
  worldId: string;
  moduleId: string;
  slug: string;
  title: string;
  rationale?: string;
}

export function LessonLink({
  postSlug,
  weekIso,
  worldId,
  moduleId,
  slug,
  title,
  rationale,
}: LessonLinkProps) {
  const href = `/worlds/${worldId}/${moduleId}/${slug}`;

  function onClick() {
    track(EVENTS.DIGEST_LINK_CLICKED, {
      postSlug,
      lessonSlug: slug,
      moduleId,
      worldId,
      weekIso,
    });
  }

  return (
    <>
      <Link href={href} onClick={onClick} className="font-bold hover:underline">
        {title}
      </Link>
      <p className="text-xs text-text-muted">
        {worldId} / {moduleId}
      </p>
      {rationale && <p className="text-sm text-text-muted mt-1">{rationale}</p>}
    </>
  );
}
