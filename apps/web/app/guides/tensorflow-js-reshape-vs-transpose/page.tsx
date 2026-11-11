import type { Metadata } from "next";
import Link from "next/link";
import { getGuide } from "@/lib/guides";
import {
  ORGANIZATION_ID,
  SITE_URL,
  WEBSITE_ID,
  serializeJsonLd,
} from "@/lib/site-identity";
import { GUIDE_EXAMPLE } from "./example";
import { ReadingComparison } from "./reading-comparison";
import { FreeLessonCtaTracker } from "@/app/components/free-lesson-cta-tracker";

const guide = getGuide("tensorflow-js-reshape-vs-transpose");
const url = `${SITE_URL}${guide.path}`;
const image = `/api/og?title=${encodeURIComponent(guide.title)}&world=deep-orbit`;
const lessonPath = "/worlds/deep-orbit/foundations/tensor-shapes";
const lessonUrl = `${SITE_URL}${lessonPath}`;

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
    images: [{ url: image, width: 1200, height: 630, alt: guide.title }],
  },
  twitter: {
    card: "summary_large_image",
    title: guide.title,
    description: guide.description,
    images: [image],
  },
};

const guideJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: guide.title,
    description: guide.description,
    url,
    mainEntityOfPage: url,
    inLanguage: "en",
    dateModified: guide.updatedAt,
    image: `${SITE_URL}${image}`,
    author: { "@id": ORGANIZATION_ID },
    publisher: { "@id": ORGANIZATION_ID },
    isPartOf: { "@id": WEBSITE_ID },
    citation: [
      "https://js.tensorflow.org/api/4.22.0/#reshape",
      "https://js.tensorflow.org/api/4.22.0/#transpose",
      "https://js.tensorflow.org/api/4.22.0/#tidy",
    ],
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
      { "@type": "ListItem", position: 3, name: guide.title, item: url },
    ],
  },
];

const sectionClass = "mt-12 space-y-5 leading-relaxed";
const headingClass = "font-mono text-2xl font-bold tracking-tight sm:text-3xl";
const linkClass = "text-primary underline underline-offset-4";

export default function ReshapeTransposeGuide() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-14 sm:px-10 md:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(guideJsonLd),
        }}
      />
      <nav
        aria-label="Breadcrumb"
        className="mb-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-text-muted"
      >
        <Link href="/" className="underline underline-offset-4">
          Tensorcraft
        </Link>
        <Link href="/guides" className="underline underline-offset-4">
          Guides
        </Link>
      </nav>
      <article>
        <header className="max-w-3xl">
          <h1 className="font-mono text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            TensorFlow.js reshape vs transpose
          </h1>
          <p className="mt-6 text-xl leading-relaxed">
            <code>reshape()</code> changes a tensor&apos;s shape while keeping
            its flattened values in order. <code>transpose()</code> permutes its
            axes. For a two-dimensional tensor, the default transpose exchanges
            rows and columns.
          </p>
          <p className="mt-5 text-sm leading-relaxed text-text-muted">
            By{" "}
            <Link
              href="/about"
              rel="author"
              className="underline underline-offset-4"
            >
              Tensorcraft
            </Link>
            , a group of JavaScript engineers. Updated{" "}
            <time dateTime={guide.updatedAt}>November 10, 2026</time>. Example
            verified with TensorFlow.js 4.22.0.
          </p>
        </header>

        <section aria-labelledby="recording" className={sectionClass}>
          <div className="max-w-3xl space-y-5">
            <h2 id="recording" className={headingClass}>
              One sensor&apos;s readings over time
            </h2>
            <p>
              In Deep Orbit, the crew investigates an unexplained signal. Farah
              selects sensors A, B, C, and D from Demir&apos;s fictional
              64-sensor recording. The excerpt below contains those four sensors
              at three local moments. It uses the same data as the free
              tensor-shapes activity.
            </p>
            <p>
              The supplied header says each row contains one moment, with
              sensors in A, B, C, D order. Moment labels 0, 1, and 2 refer to
              this excerpt. They are not timestamps for the full recording.
              These are illustrative readings, without assigned physical units.
            </p>
            <p>
              The crew needs each sensor&apos;s readings in time order. Sensor A
              has <code>[2, 3, 4]</code>. Both operations below produce shape{" "}
              <code>[4, 3]</code>, but they produce different rows.
            </p>
          </div>
          <ReadingComparison />
        </section>

        <div className="max-w-3xl">
          <section aria-labelledby="reshape" className={sectionClass}>
            <h2 id="reshape" className={headingClass}>
              How reshape groups the values
            </h2>
            <p>
              Flatten the input row by row and you get{" "}
              <code>[2, 20, 5, 8, 3, 18, 7, 8, 4, 16, 6, 9]</code>. Reshape
              groups that sequence into four rows of three values. Its first row
              becomes <code>[2, 20, 5]</code>: readings from sensors A, B, and C
              at moment 0.
            </p>
            <p>
              The numbers retain their flattened order. The new row does not
              represent sensor A over time. A later chart that labels this row
              as sensor A would show other sensors&apos; readings under A&apos;s
              name.
            </p>
            <p>
              Reshape is useful when you need a different grouping that
              preserves this order. For example, adding a batch dimension for
              one example can change <code>[3, 4]</code> to{" "}
              <code>[1, 3, 4]</code>. The target dimensions must multiply to the
              original element count. Here that count is 12.
            </p>
          </section>

          <section aria-labelledby="transpose" className={sectionClass}>
            <h2 id="transpose" className={headingClass}>
              How transpose exchanges the axes
            </h2>
            <p>
              For this matrix, <code>input.transpose()</code> places input value{" "}
              <code>[moment][sensor]</code> at output position{" "}
              <code>[sensor][moment]</code>. Sensor A becomes the first row,{" "}
              <code>[2, 3, 4]</code>. Sensor B becomes <code>[20, 18, 16]</code>
              . Each selected sensor keeps its readings in local moment order.
            </p>
            <p>
              For tensors with more than two dimensions, the permutation
              argument specifies the new axis order. For example,{" "}
              <code>input.transpose([1, 0])</code> explicitly exchanges the two
              axes in this example. Without a permutation, TensorFlow.js
              reverses the axis order.
            </p>
          </section>

          <section aria-labelledby="code" className={sectionClass}>
            <h2 id="code" className={headingClass}>
              The runnable TensorFlow.js example
            </h2>
            <p>
              Install the pinned runtime with{" "}
              <code>npm install @tensorflow/tfjs@4.22.0</code>. Save the
              following code as <code>compare.mjs</code> and run{" "}
              <code>node compare.mjs</code>. A browser project can use the same
              module through its bundler.
            </p>
            <pre className="overflow-x-auto border border-border bg-code-bg p-5 text-sm leading-relaxed">
              <code>{GUIDE_EXAMPLE}</code>
            </pre>
            <p>
              The callback returns ordinary JavaScript arrays from{" "}
              <code>arraySync()</code>. <code>tf.tidy()</code> disposes the
              tensors created inside that callback because the result contains
              no tensors. If you return a tensor instead, you keep
              responsibility for disposing it when you finish using it.
            </p>
            <p>
              This small example uses synchronous reads so you can inspect the
              values directly. Reading tensor data synchronously can block the
              browser while a backend finishes its work. Larger applications can
              use asynchronous reads and dispose tensors explicitly afterward.{" "}
              <code>tf.tidy()</code> requires a synchronous callback.
            </p>
          </section>

          <section aria-labelledby="meaning" className={sectionClass}>
            <h2 id="meaning" className={headingClass}>
              Shape alone cannot identify a sensor
            </h2>
            <p>
              A shape such as <code>[4, 3]</code> tells you dimension sizes. The
              recording header supplies the sensor order and moment order. Keep
              that metadata with the readings as you prepare model inputs or
              label a chart.
            </p>
            <p>
              This grouping task uses ordinary data transformation. It does not
              train a model or establish a physical anomaly. It practices a part
              of ML preparation: preserving what each value means while
              arranging the input for the next operation.
            </p>
          </section>

          <section
            aria-labelledby="activity"
            className={`${sectionClass} border-t border-border pt-8`}
          >
            <h2 id="activity" className={headingClass}>
              The free tensor-shapes activity
            </h2>
            <p>
              In the{" "}
              <FreeLessonCtaTracker
                source="guide"
                guideSlug={guide.slug}
                targetLesson={lessonUrl}
                placement="activity"
              >
                <Link
                  href={`${lessonPath}?start=experiment`}
                  className={linkClass}
                >
                  interactive lesson
                </Link>
              </FreeLessonCtaTracker>
              , you predict a row, compare the operations, and apply the idea to
              a second excerpt. Deep Orbit&apos;s first five lessons are free,
              with no account required. The full course continues into model
              building, training, evaluation, and deployment.
            </p>
            <p>
              <Link href="/worlds/deep-orbit" className={linkClass}>
                Deep Orbit course overview
              </Link>{" "}
              and{" "}
              <Link href="/pricing" className={linkClass}>
                course pricing
              </Link>{" "}
              describe the available course and paid continuation.
            </p>
            <p>
              The{" "}
              <Link
                href="/guides/javascript-machine-learning-learning-path"
                className={linkClass}
              >
                JavaScript ML learning path
              </Link>{" "}
              shows where data preparation fits. The{" "}
              <Link
                href="/guides/browser-machine-learning-project"
                className={linkClass}
              >
                independent project case
              </Link>{" "}
              follows recorded inputs through a model decision and an inspected
              mistake.
            </p>
          </section>

          <section aria-labelledby="sources" className={sectionClass}>
            <h2 id="sources" className={headingClass}>
              Sources and example provenance
            </h2>
            <p>
              The input and outputs use the worked excerpt in Tensorcraft&apos;s
              <FreeLessonCtaTracker
                source="guide"
                guideSlug={guide.slug}
                targetLesson={lessonUrl}
                placement="source"
              >
                <Link href={lessonPath} className={linkClass}>
                  {" "}
                  tensor-shapes lesson
                </Link>
              </FreeLessonCtaTracker>
              . The example describes authored fictional data. TensorFlow.js
              4.22.0 produced both outputs during verification.
            </p>
            <ul className="list-disc space-y-3 pl-6">
              <li>
                <a
                  href="https://js.tensorflow.org/api/4.22.0/#reshape"
                  className={linkClass}
                >
                  TensorFlow.js reshape reference
                </a>
              </li>
              <li>
                <a
                  href="https://js.tensorflow.org/api/4.22.0/#transpose"
                  className={linkClass}
                >
                  TensorFlow.js transpose reference
                </a>
              </li>
              <li>
                <a
                  href="https://js.tensorflow.org/api/4.22.0/#tidy"
                  className={linkClass}
                >
                  TensorFlow.js tidy reference
                </a>
              </li>
              <li>
                <a
                  href="https://js.tensorflow.org/api/4.22.0/#tf.Tensor.arraySync"
                  className={linkClass}
                >
                  TensorFlow.js arraySync reference
                </a>
              </li>
            </ul>
          </section>
        </div>
      </article>
    </main>
  );
}
