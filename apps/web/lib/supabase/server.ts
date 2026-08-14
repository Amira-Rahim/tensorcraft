import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@tensorcraft/supabase";

export async function getSupabaseServerClient() {
  // cookies() must come BEFORE the env guard: during `next build` prerender
  // it is Next's signal to bail the route out to dynamic rendering, which
  // lets an env-less CI box still produce the artifact (the same contract
  // assertWebEnv documents in lib/env.ts). Guard first, and a plain Error
  // fires before the bailout and fails the whole build. At request time
  // cookies() resolves normally and the guard below still fails loudly.
  const cookieStore = await cookies();

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. See apps/web/.env.example",
    );
  }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll is called from Server Components where cookies can't be set.
            // This can be ignored if middleware refreshes sessions.
          }
        },
      },
    },
  );
}
