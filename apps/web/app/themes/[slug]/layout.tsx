import { notFound } from "next/navigation";
import { themes } from "@tensorcraft/themes";
import { ThemeSync } from "@/app/components/theme-sync";
import type { ThemeSlug } from "@tensorcraft/shared";

export default async function ThemeLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const theme = themes[slug];
  if (!theme) notFound();

  return (
    <>
      <ThemeSync slug={slug as ThemeSlug} />
      {children}
    </>
  );
}
