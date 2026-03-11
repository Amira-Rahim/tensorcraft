import { notFound } from "next/navigation";
import { themes } from "@tensorcraft/themes";

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

  return <div data-theme={slug}>{children}</div>;
}
