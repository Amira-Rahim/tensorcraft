import { notFound } from "next/navigation";
import { worlds } from "@tensorcraft/worlds";
import { WorldSync } from "@/app/components/world-sync";
import type { WorldSlug } from "@tensorcraft/shared";

export default async function WorldLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const world = worlds[slug];
  if (!world) notFound();

  return (
    <>
      <WorldSync slug={slug as WorldSlug} />
      {children}
    </>
  );
}
