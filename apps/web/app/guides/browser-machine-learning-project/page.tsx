import type { Metadata } from "next";
import Link from "next/link";
import { FreeLessonCtaTracker } from "@/app/components/free-lesson-cta-tracker";
import { getGuide } from "@/lib/guides";
import {
  ORGANIZATION_ID,
  SITE_URL,
  WEBSITE_ID,
  serializeJsonLd,
} from "@/lib/site-identity";
import preview from "@/public/assignments/room-project-preview.json";
import { ThresholdExample } from "./threshold-example";
import { TrainingDemo } from "./training-demo";
import { TrainingReference } from "./training-reference";

const guide = getGuide("browser-machine-learning-project");
const updatedDate = new Intl.DateTimeFormat("en-US", {
  dateStyle: "long",
  timeZone: "UTC",
}).format(new Date(guide.updatedAt));
const url = `${SITE_URL}${guide.path}`;
const image = `/api/og?title=${encodeURIComponent("A browser ML project")}&world=deep-orbit`;
const firstLesson = "/worlds/deep-orbit/foundations/introduction-to-tensors";
const evidenceSource = "/evidence/room-project-v1";

export const metadata: Metadata = {
  title: `${guide.title}, Tensorcraft`,
  description: guide.description,
  alternates: { canonical: url },
  openGraph: {
    type: "article",
    title: guide.title,
    description: guide.description,
    url,
    siteName: "Tensorcraft",
    modifiedTime: guide.updatedAt,
    images: [image],
  },
  twitter: {
    card: "summary_large_image",
    title: guide.title,
    description: guide.description,
    images: [image],
  },
};

const link = "text-primary underline underline-offset-4";
const section = "mt-12 max-w-3xl space-y-5 leading-relaxed";
const heading = "font-mono text-2xl font-bold tracking-tight sm:text-3xl";

export default function BrowserProjectGuide() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-14 sm:px-10 md:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd([
            {
              "@context": "https://schema.org",
              "@type": "Article",
              "@id": `${url}#article`,
              headline: guide.title,
              description: guide.description,
              url,
              mainEntityOfPage: url,
              dateModified: guide.updatedAt,
              inLanguage: "en",
              author: { "@id": ORGANIZATION_ID },
              publisher: { "@id": ORGANIZATION_ID },
              isPartOf: { "@id": WEBSITE_ID },
              citation: ["https://doi.org/10.24432/C5X01N"],
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Tensorcraft",
                  item: SITE_URL,
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Guides",
                  item: `${SITE_URL}/guides`,
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: guide.title,
                  item: url,
                },
              ],
            },
          ]),
        }}
      />
      <nav
        aria-label="Breadcrumb"
        className="mb-8 flex flex-wrap gap-5 text-sm text-text-muted"
      >
        <Link href="/" className={link}>
          Tensorcraft
        </Link>
        <Link href="/guides" className={link}>
          Guides
        </Link>
      </nav>
      <article>
        <header className="max-w-3xl">
          <h1 className="font-mono text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            {guide.title}
          </h1>
          <p className="mt-6 text-xl leading-relaxed">
            A useful ML project compares a trained model with a simple baseline,
            inspects mistakes, and runs the saved result in an application. Deep
            Orbit&apos;s independent project asks you to do that with recorded
            room measurements and JavaScript. Try the supplied training example
            below to see how a model compares with a light-threshold rule on
            later readings.
          </p>
          <p className="mt-5 text-sm text-text-muted">
            By{" "}
            <Link rel="author" href="/about" className={link}>
              Tensorcraft
            </Link>
            , a group of JavaScript engineers. Updated{" "}
            <time dateTime={guide.updatedAt}>{updatedDate}</time>.
          </p>
        </header>
        <section className={section}>
          <h2 className={heading}>The task and its data</h2>
          <p>
            A facilities team wants a review-only display of whether one office
            is occupied. The inputs are temperature, relative humidity, light,
            CO₂, and humidity ratio. You choose features, chronological
            training/validation/test periods, error costs, a model, and a
            decision threshold.
          </p>
          <p>
            The starter includes 2,056 recorded measurements derived from the{" "}
            <a
              className={link}
              href="https://archive.ics.uci.edu/dataset/357/occupancy+detection"
            >
              UCI Occupancy Detection dataset
            </a>
            . These are real room recordings. They are a separate source from
            Deep Orbit&apos;s fictional ship data.
          </p>
          <p>
            Tensorcraft sorted the source&apos;s 20,560 readings by timestamp
            and kept every tenth row. The subset preserves values and labels.
            This sampling reduces download size. It does not make nearby
            observations independent. The source timestamps have no assigned
            timezone.
          </p>
          <p>
            The{" "}
            <a
              className={link}
              href="/assignments/room-occupancy-v1/DATA-LICENSE.md"
            >
              data attribution and modification record
            </a>{" "}
            supplies the citation, CC BY 4.0 terms, archive hash, and
            transformation details. The experiment serves one recorded room. It
            does not establish performance in another building or suitability
            for access controls.
          </p>
        </section>
        <TrainingReference />
        <TrainingDemo />
        <ThresholdExample />
        <section className={section}>
          <h2 className={heading}>About the recorded demonstration</h2>
          <p>
            The threshold example above comes from a maintainer integration
            fixture, recorded{" "}
            <time dateTime={preview.recordedAt}>
              {preview.recordedAt.slice(0, 10)}
            </time>{" "}
            with TensorFlow.js {preview.tfjs} on its {preview.backend} backend.
            Five fixed training epochs checked the saved-model workflow. This is
            supplied demonstration work, separate from a learner&apos;s project.
          </p>
          <p>
            The model and the light-threshold rule both classify this validation
            reading as occupied at the recorded settings. Its label says
            unoccupied. Their agreement does not establish correctness. One row
            also cannot establish either policy&apos;s overall quality.
          </p>
          <p>
            You can inspect the exact reading, score, artifact hashes, fixture
            hash and reproduction commands in the{" "}
            <a className={link} href="/assignments/room-project-preview.json">
              recorded fixture
            </a>
            . The recorded hashes identify the demonstration artifacts. The
            starter download contains no trained solution.
          </p>
          <p>
            Read the{" "}
            <a
              className={link}
              href={`${evidenceSource}/scripts/check-room-project.mjs`}
            >
              reproduction runner
            </a>
            , the{" "}
            <a
              className={link}
              href={`${evidenceSource}/scripts/fixtures/room-project/train.mjs`}
            >
              fixture training code
            </a>
            , and the{" "}
            <a
              className={link}
              href={`${evidenceSource}/scripts/build-room-project-preview.mjs`}
            >
              preview builder
            </a>{" "}
            in the versioned reproduction package. Its{" "}
            <a className={link} href={`${evidenceSource}/manifest.json`}>
              file manifest
            </a>{" "}
            records the source hashes. The training file&apos;s hash matches the
            record above.
          </p>
          <p>
            Download the{" "}
            <a className={link} href="/evidence/room-project-v1.zip">
              standalone reproduction package
            </a>{" "}
            and follow its{" "}
            <a className={link} href={`${evidenceSource}/README.md`}>
              reproduction instructions
            </a>
            . It includes the supplied fixture and the tools to check it, with
            no main-repository checkout required. The learner starter remains a
            separate download without a trained solution.
          </p>
        </section>
        <section className={section}>
          <h2 className={heading}>Your work and the supplied tools</h2>
          <div className="overflow-x-auto border border-border">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                Responsibilities in the independent project
              </caption>
              <thead>
                <tr>
                  <th scope="col" className="p-4">
                    You create
                  </th>
                  <th scope="col" className="p-4">
                    The starter supplies
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <td className="p-4">
                    Feature choices, data periods, baseline and training
                    experiment
                  </td>
                  <td className="p-4">
                    Recorded data, attribution and a training-file skeleton
                  </td>
                </tr>
                <tr className="border-t border-border">
                  <td className="p-4">
                    Saved model, preprocessing parameters and evaluation runs
                  </td>
                  <td className="p-4">
                    Export/reload helpers and metric arithmetic
                  </td>
                </tr>
                <tr className="border-t border-border">
                  <td className="p-4">
                    Error analysis and a recommendation about which policy to
                    keep
                  </td>
                  <td className="p-4">
                    A local browser application that loads your result
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Deep Orbit&apos;s lessons build the foundations for this work.
            Arrays and tensor shapes establish input meaning. Training and
            evaluation introduce fitted parameters, data splits and mistakes.
            The independent project asks you to make and explain your own
            choices.
          </p>
          <p>
            Browser lessons need no local installation. The independent project
            requires Node.js 22 or later and an initial dependency download.
            After setup, its commands and application use local files. A
            completed project produces your model artifact, evaluation records,
            and a browser app that runs the saved result.
          </p>
        </section>
        <section className={section}>
          <h2 className={heading}>An honest evaluation</h2>
          <p>
            Fit preprocessing with training rows. Use validation data to choose
            model settings and thresholds. Freeze those choices before
            evaluating the final test period. If you change the policy after
            inspecting that period, it becomes development data and you need new
            data for an independent test.
          </p>
          <p>
            Compare the rule and model on the same rows, inspect false positives
            and missed occupancy, and include your chosen error costs. Keeping
            the rule is a valid outcome when it serves the task better.
          </p>
          <p>
            Automated checks can detect overlapping row IDs and recompute
            scores. They cannot prove that you avoided looking at the final
            period or that your reasoning is sound. That requires reviewing your
            code and explanation.
          </p>
        </section>
        <section className={section}>
          <h2 className={heading}>The project files and course entry</h2>
          <ul className="list-disc space-y-3 pl-6">
            <li>
              <a
                className={link}
                href="/assignments/room-occupancy-v1/README.md"
              >
                Read the independent project brief
              </a>
            </li>
            <li>
              <a
                className={link}
                href="/assignments/room-occupancy-v1.zip"
                download
              >
                Download the starter files
              </a>
            </li>
            <li>
              <Link
                className={link}
                href="/guides/javascript-machine-learning-learning-path"
              >
                See the JavaScript ML learning path
              </Link>
            </li>
          </ul>
          <p>
            Deep Orbit&apos;s first five lessons are free, with no account
            needed. They introduce the data preparation that model work depends
            on. The full course continues through training, evaluation and
            deployment.
          </p>
          <FreeLessonCtaTracker
            source="guide"
            guideSlug={guide.slug}
            targetLesson={`${SITE_URL}${firstLesson}`}
            placement="activity"
          >
            <Link href={firstLesson} className={link}>
              Start the first free lesson
            </Link>
          </FreeLessonCtaTracker>
          <p>
            <Link href="/worlds/deep-orbit" className={link}>
              The course overview
            </Link>{" "}
            and{" "}
            <Link href="/pricing" className={link}>
              pricing
            </Link>{" "}
            describe the available course and paid continuation.
          </p>
        </section>
      </article>
    </main>
  );
}
