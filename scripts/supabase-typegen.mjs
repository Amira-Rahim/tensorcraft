// postgres-meta 0.99 delegates generation to postgrest-typegen. Resolve its
// installed dependency from that package, so pnpm's isolated graph is respected.
import { createRequire } from "node:module";
const requireMeta = createRequire(
  import.meta.resolve("@supabase/postgres-meta"),
);
const { generateTypescript } = await import(
  requireMeta.resolve("@supabase/postgrest-typegen")
);
export function generateTypes(metadata, postgrestVersion) {
  return generateTypescript(metadata, {
    detectOneToOneRelationships: true,
    postgrestVersion,
  });
}
