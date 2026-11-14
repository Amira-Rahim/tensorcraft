import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { worlds } from "@tensorcraft/worlds";
import { isValidWorldSlug } from "@tensorcraft/shared";
import { getModules } from "@tensorcraft/content";
import { CharacterAvatar } from "@tensorcraft/ui/character-avatar";
import { ModulePatch } from "@tensorcraft/ui/module-patch";
import { getApiUrl } from "@/lib/api-url";
import { patchSrc, sealSrc } from "@/lib/patch-art";

/**
 * Public certificate share page.
 *
 * Reads the share record via the API's public `GET /api/certificates/:id`
 * endpoint, which itself goes through the `get_shared_certificate` SECURITY
 * DEFINER RPC (migration 019) so only the minimum public fields cross the
 * trust boundary: id, world_id, issued_at, cert_hash, display_name,
 * avatar_url.
 *
 * No auth required. UUID shape is validated server-side; an unknown id
 * returns 404. The hash is rendered as visual identification only, there
 * is intentionally no client-side hash verification path, since the API's
 * RPC is the source of truth.
 */

type ShareRecord = {
  id: string;
  world_id: string;
  issued_at: string;
  cert_hash: string;
  user_display_name: string | null;
  user_avatar_url: string | null;
};

const UUID_RE = /^[0-9a-fA-F-]{36}$/;

async function loadCertificate(id: string): Promise<ShareRecord | null> {
  if (!UUID_RE.test(id)) return null;

  // A transport failure (API down, DNS, ECONNREFUSED) used to escape this
  // function and surface as a raw 500. That is the worst outcome on the most
  // shared surface in the product: a learner posts their certificate and,
  // during any API blip, everyone who clicks sees a server error.
  //
  // Rethrowing a tagged error routes it to certificates/error.tsx, which
  // offers a retry and says the certificate is temporarily unreachable -
  // rather than `notFound()`, which would tell the sharer's audience the
  // credential does not exist.
  let res: Response;
  try {
    res = await fetch(`${getApiUrl()}/api/certificates/${id}`, {
      next: { revalidate: 300 },
    });
  } catch (cause) {
    throw new Error("certificate_lookup_unavailable", { cause });
  }

  if (res.status === 404) return null;
  if (!res.ok) return null;
  return (await res.json()) as ShareRecord;
}

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const cert = await loadCertificate(id);
  // Pageview tools can collect the HTML title. Personalization belongs in
  // the learner's intentional public share preview and certificate display.
  const title = "Certificate of completion, Tensorcraft";
  const robots = { index: false, follow: true };
  if (!cert) return { title, robots };
  const world = isValidWorldSlug(cert.world_id) ? worlds[cert.world_id] : null;
  const worldName = world?.displayName ?? cert.world_id;
  const learner = cert.user_display_name ?? "A Tensorcraft learner";
  const shareTitle = `${learner} completed ${worldName}, Tensorcraft`;
  const description = `Certificate of completion for the ${worldName} world on Tensorcraft.`;
  const images = [
    `/api/og?kind=cert&title=${encodeURIComponent(worldName)}&world=${encodeURIComponent(cert.world_id)}&learner=${encodeURIComponent(learner)}`,
  ];
  return {
    title,
    description,
    robots,
    alternates: {
      canonical: `https://tensorcraft.app/certificates/${cert.id}`,
    },
    openGraph: {
      title: shareTitle,
      description,
      url: `https://tensorcraft.app/certificates/${cert.id}`,
      type: "profile",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description,
      images,
    },
  };
}

export default async function CertificateSharePage({ params }: Props) {
  const { id } = await params;
  const cert = await loadCertificate(id);
  if (!cert) notFound();

  const world = isValidWorldSlug(cert.world_id) ? worlds[cert.world_id] : null;
  const worldName = world?.displayName ?? cert.world_id;
  const learner = cert.user_display_name ?? "A Tensorcraft learner";
  const issuedDate = new Date(cert.issued_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const certNumber = `TC-${cert.id.slice(0, 8).toUpperCase()}`;
  const hashPreview = cert.cert_hash.slice(0, 12);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOccupationalCredential",
    name: `${worldName} | Tensorcraft`,
    description: `Completion of the ${worldName} world on Tensorcraft.`,
    credentialCategory: "Course Completion",
    educationalLevel: "Intermediate",
    recognizedBy: {
      "@type": "Organization",
      name: "Tensorcraft",
      url: "https://tensorcraft.app",
    },
    dateCreated: cert.issued_at,
    identifier: certNumber,
  };

  return (
    <main className="min-h-screen bg-page text-text-primary px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-2xl mx-auto">
        <div className="border border-border bg-surface rounded-none p-10 print:border-black">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-text-muted mb-2">
                Certificate of Completion
              </p>
              <h1 className="text-3xl md:text-4xl font-mono font-black tracking-[-0.03em] uppercase mb-6">
                {worldName}
              </h1>
            </div>
            {/* World-completion seal (docs/patch-bible.md). Decorative: the
                heading names the achievement; a missing asset renders
                nothing. */}
            {sealSrc(cert.world_id) && (
              <ModulePatch
                src={sealSrc(cert.world_id)!}
                size={72}
                className="mt-1"
              />
            )}
          </div>

          <p className="text-sm text-text-muted mb-1">Awarded to</p>
          {/* ph-no-capture: the learner's name and avatar stay out of the
              PostHog replays of everyone who opens this public link. */}
          <div className="flex items-center gap-3 mb-8 ph-no-capture">
            {/* The share RPC exposes avatar_url for exactly this render; a
                dead URL settles to the initials monogram, never a broken
                image (CharacterAvatar owns the failure path). */}
            <CharacterAvatar
              name={learner}
              src={cert.user_avatar_url ?? undefined}
              size={44}
            />
            <p className="text-2xl font-mono font-semibold">{learner}</p>
          </div>

          <dl className="grid grid-cols-2 gap-4 text-xs font-mono mb-8">
            <div>
              <dt className="text-text-muted uppercase tracking-wider mb-1">
                Issued
              </dt>
              <dd>{issuedDate}</dd>
            </div>
            <div>
              <dt className="text-text-muted uppercase tracking-wider mb-1">
                Number
              </dt>
              <dd>{certNumber}</dd>
            </div>
            <div className="col-span-2">
              {/* Label renamed 2026-07-25 (T0-10): no verification endpoint
                  exists, so this must never be presented as a verification
                  mechanism. It is the certificate's identifier, nothing more. */}
              <dt className="text-text-muted uppercase tracking-wider mb-1">
                Certificate ID
              </dt>
              <dd className="break-all text-text-muted">
                {hashPreview}…<span className="sr-only">{cert.cert_hash}</span>
              </dd>
            </div>
          </dl>

          {/* Earned mission patches, one per module: a certificate exists
              only when every module is complete, so the full strip is
              truthful by construction. Decorative beside the sentence
              below, which says the same thing in words. */}
          {sealSrc(cert.world_id) && (
            <div
              className="flex flex-wrap gap-2 mb-6"
              data-testid="cert-patch-strip"
              aria-hidden="true"
            >
              {getModules(cert.world_id).map((mod) => {
                const src = patchSrc(cert.world_id, mod.slug);
                return src ? (
                  <ModulePatch key={mod.slug} src={src} size={32} />
                ) : null;
              })}
            </div>
          )}

          <p className="text-xs text-text-muted leading-relaxed">
            This learner completed every module of the {worldName} world on{" "}
            <Link href="/" className="text-primary underline">
              Tensorcraft
            </Link>
            , an interactive, story-driven machine-learning course for
            JavaScript engineers.
          </p>
        </div>

        <div className="mt-8 flex items-center justify-between text-xs font-mono text-text-muted">
          <Link href="/" className="hover:text-text-primary">
            ← Tensorcraft
          </Link>
          <Link
            href={`/worlds/${cert.world_id}`}
            className="hover:text-text-primary"
          >
            View the {worldName} world →
          </Link>
        </div>
      </div>
    </main>
  );
}
