import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

export const IDENTITY_CONTRACT =
  "docs/art-refs/deep-orbit/art-direction-2026-11-06/identity-lock/contract.json";
const CHARACTERS = [
  "commander-mirza",
  "dr-farah",
  "chief-nazari",
  "ensign-demir",
];

/** The contract hashes predate generation; current files cannot redefine identity. */
export function readCanonicalIdentity(root) {
  const contract = JSON.parse(
    fs.readFileSync(path.join(root, IDENTITY_CONTRACT), "utf8"),
  );
  return CHARACTERS.map((character) => {
    const anchor = contract.characters?.[character];
    const expectedPath = `docs/art-refs/deep-orbit/${character}.png`;
    if (
      anchor?.reference !== expectedPath ||
      !/^[a-f0-9]{64}$/.test(anchor.sha256 ?? "")
    )
      throw new Error(`${character}: missing canonical identity contract`);
    const actual = createHash("sha256")
      .update(fs.readFileSync(path.join(root, expectedPath)))
      .digest("hex");
    if (actual !== anchor.sha256)
      throw new Error(
        `${character}: canonical portrait differs from identity contract`,
      );
    return { character, path: expectedPath, sha256: anchor.sha256 };
  });
}

export function resolveIdentityReferences(root, row, canonical) {
  const relative = (file) =>
    path.isAbsolute(file) ? path.relative(root, file) : file;
  const references = (row.references ?? row.identityReferences ?? []).map(
    (ref) =>
      typeof ref === "string"
        ? { path: relative(ref) }
        : { ...ref, path: relative(ref.path) },
  );
  const identityReferences = canonical.filter((anchor) =>
    references.some((ref) => ref.path === anchor.path),
  );
  for (const ref of references) {
    const anchor = canonical.find((item) => item.path === ref.path);
    if (anchor && ref.sha256 && ref.sha256 !== anchor.sha256)
      throw new Error("canonical portrait changed after review");
  }
  const cast = row.cast ?? identityReferences.map((ref) => ref.character);
  if (!Array.isArray(cast) || new Set(cast).size !== cast.length)
    throw new Error("invalid scene cast");
  if (!cast.length && row.cast === undefined)
    throw new Error(
      "missing canonical identity references or explicit empty cast",
    );
  for (const character of cast)
    if (!identityReferences.some((ref) => ref.character === character))
      throw new Error(
        `${character}: cast member has no canonical portrait reference`,
      );
  for (const reference of identityReferences)
    if (!cast.includes(reference.character))
      throw new Error(
        `${reference.character}: canonical portrait reference is absent from declared cast`,
      );
  return { cast, identityReferences };
}
