import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { themes } from "@tensorcraft/themes";
import { isValidThemeSlug } from "@tensorcraft/shared";
import { getApiUrl } from "@/lib/api-url";

/**
 * Public certificate share page.
 *
 * Reads the share record via the API's public `GET /api/certificates/:id`
 * endpoint, which itself goes through the `get_shared_certificate` SECURITY
 * DEFINER RPC (migration 019) so only the minimum public fields cross the
 * trust boundary: id, theme_id, issued_at, cert_hash, display_name,
 * avatar_url.
 *
 * No auth required. UUID shape is validated server-side; an unknown id
 * returns 404. The hash is rendered as visual identification only, there
 * is intentionally no client-side hash verification path, since the API's
 * RPC is the source of truth.
 */

type ShareRecord = {
  id: string;
  theme_id: string;
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
  // offers a retry and says the certificate is temporarily unreachable —
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
  if (!cert) return { title: "Certificate | Tensorcraft" };
  const theme = isValidThemeSlug(cert.theme_id) ? themes[cert.theme_id] : null;
  const themeName = theme?.displayName ?? cert.theme_id;
  const learner = cert.user_display_name ?? "A Tensorcraft learner";
  const title = `${learner} completed ${themeName} | Tensorcraft`;
  const description = `Certificate of completion for the ${themeName} theme on Tensorcraft.`;
  return {
    title,
    description,
    alternates: {
      canonical: `https://tensorcraft.app/certificates/${cert.id}`,
    },
    openGraph: {
      title,
      description,
      url: `https://tensorcraft.app/certificates/${cert.id}`,
      type: "profile",
      images: [
        `/api/og?title=${encodeURIComponent(`${themeName}: Mission Complete`)}&theme=${encodeURIComponent(cert.theme_id)}&subtitle=${encodeURIComponent(learner)}`,
      ],
    },
  };
}

export default async function CertificateSharePage({ params }: Props) {
  const { id } = await params;
  const cert = await loadCertificate(id);
  if (!cert) notFound();

  const theme = isValidThemeSlug(cert.theme_id) ? themes[cert.theme_id] : null;
  const themeName = theme?.displayName ?? cert.theme_id;
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
    name: `${themeName} | Tensorcraft`,
    description: `Completion of the ${themeName} theme on Tensorcraft.`,
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
          <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-text-muted mb-2">
            Certificate of Completion
          </p>
          <h1 className="text-3xl md:text-4xl font-mono font-black tracking-[-0.03em] uppercase mb-6">
            {themeName}
          </h1>

          <p className="text-sm text-text-muted mb-1">Awarded to</p>
          <p className="text-2xl font-mono font-semibold mb-8">{learner}</p>

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
              <dt className="text-text-muted uppercase tracking-wider mb-1">
                Verification hash
              </dt>
              <dd className="break-all text-text-muted">
                {hashPreview}…<span className="sr-only">{cert.cert_hash}</span>
              </dd>
            </div>
          </dl>

          <p className="text-xs text-text-muted leading-relaxed">
            This learner completed every module of the {themeName} theme on{" "}
            <Link href="/" className="text-primary underline">
              Tensorcraft
            </Link>
            , an interactive, story-driven machine-learning course for frontend
            engineers.
          </p>
        </div>

        <div className="mt-8 flex items-center justify-between text-xs font-mono text-text-muted">
          <Link href="/" className="hover:text-text-primary">
            ← Tensorcraft
          </Link>
          <Link
            href={`/themes/${cert.theme_id}`}
            className="hover:text-text-primary"
          >
            View the {themeName} theme →
          </Link>
        </div>
      </div>
    </main>
  );
}
