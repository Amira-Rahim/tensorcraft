import { redirect } from "next/navigation";

export default async function SignUpRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams(params).toString();
  redirect(query ? `/auth?${query}` : "/auth");
}
