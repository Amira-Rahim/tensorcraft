import type { Metadata } from "next";
import Link from "next/link";
import { getModules, getWorldLessons } from "@tensorcraft/content";
import { FreeLessonCtaTracker } from "@/app/components/free-lesson-cta-tracker";
import { getGuide } from "@/lib/guides";
import {
  ORGANIZATION_ID,
  SITE_URL,
  WEBSITE_ID,
  serializeJsonLd,
} from "@/lib/site-identity";

const guide = getGuide("javascript-machine-learning-learning-path");
const url = `${SITE_URL}${guide.path}`;
const image = `/api/og?title=${encodeURIComponent(guide.title)}&world=deep-orbit`;
const coursePath = "/worlds/deep-orbit";
const courseModules = getModules("deep-orbit");
const courseLessons = getWorldLessons("deep-orbit");
const freeModule = courseModules.find((module) => module.order === 1);
const freeLessons = courseLessons.filter(
  (lesson) => lesson.moduleId === freeModule?.slug,
);

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

const jsonLd = [
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
      "https://www.tensorflow.org/resources/learn-ml/basics-of-tensorflow-for-js-development",
      "https://www.tensorflow.org/js/guide/train_models",
      "https://www.tensorflow.org/js/models",
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Tensorcraft", item: SITE_URL },
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

const moduleOutputs: Record<string, string> = {
  foundations:
    "A tensor, its axis metadata, correctly grouped readings, and a consistent scaling rule.",
  "neural-networks":
    "A network definition and forward-pass values you can inspect before training.",
  "training-loop":
    "Training history and predictions checked against separate readings and a baseline.",
  "browser-runtimes":
    "A saved-model loading path and a browser loop that runs repeated predictions.",
  "signal-processing":
    "Frequency views and signal features to compare with the original readings.",
  "recurrent-networks":
    "Time-ordered windows and predictions checked without sharing overlapping readings across splits.",
  "anomaly-detection":
    "Reconstruction-error scores and an alert threshold with inspected mistakes.",
  "advanced-time-series":
    "Forecasting and ensemble comparisons with stated assumptions and measured errors.",
  "llm-integration":
    "A reporting pipeline that retrieves evidence and checks generated claims.",
  "optimization-edge":
    "Recorded tradeoffs in model size, latency, memory, and prediction changes.",
  capstone:
    "Release checks, monitoring, documentation, and a rehearsal of the assembled system.",
};

const linkClass = "text-primary underline underline-offset-4";
const headingClass = "font-mono text-2xl font-bold tracking-tight sm:text-3xl";
const sectionClass = "mt-12 space-y-5 leading-relaxed";

export default function JavaScriptLearningPath() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-14 sm:px-10 md:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
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
            {guide.title}
          </h1>
          <p className="mt-6 text-xl leading-relaxed">
            A useful JavaScript ML path starts with your goal. You can train a
            small model, run a model someone has already trained, or build an
            application around a hosted model API. Each route gives you
            different work to learn and different results to check.
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
            <time dateTime={guide.updatedAt}>November 10, 2026</time>.
          </p>
        </header>

        <section aria-labelledby="goals" className={sectionClass}>
          <h2 id="goals" className={headingClass}>
            Three kinds of JavaScript ML work
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm sm:text-base">
              <caption className="sr-only">
                Learning goals and evidence for three ways to use machine
                learning
              </caption>
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="p-3 align-top">
                    Your goal
                  </th>
                  <th scope="col" className="p-3 align-top">
                    Work to learn
                  </th>
                  <th scope="col" className="p-3 align-top">
                    A result to inspect
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <th scope="row" className="p-3 align-top font-medium">
                    Train a small model
                  </th>
                  <td className="p-3 align-top">
                    Prepare examples, compare a simple rule, train the model,
                    and evaluate errors.
                  </td>
                  <td className="p-3 align-top">
                    A saved model with predictions on separate examples and a
                    comparison against the rule.
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <th scope="row" className="p-3 align-top font-medium">
                    Run a pretrained model
                  </th>
                  <td className="p-3 align-top">
                    Load a model, prepare its expected inputs, interpret
                    outputs, and measure behavior on your task.
                  </td>
                  <td className="p-3 align-top">
                    An inference feature with recorded loading cost, errors, and
                    model/version details.
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <th scope="row" className="p-3 align-top font-medium">
                    Use a hosted model API
                  </th>
                  <td className="p-3 align-top">
                    Make requests from the appropriate application layer, handle
                    failures, and check returned content.
                  </td>
                  <td className="p-3 align-top">
                    A working integration with examples of acceptable and
                    unacceptable responses, plus observed cost and latency.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="max-w-3xl space-y-5">
            <p>
              Training uses data to change a model&apos;s parameters, the
              numbers that control its predictions. Inference uses a model to
              produce an output. Loading a pretrained model or calling an API
              can give you inference without training the underlying model
              yourself. You still need to evaluate whether its outputs serve
              your task.
            </p>
            <p>
              TensorFlow.js supports training and model execution in JavaScript,
              including the browser and Node.js. Its{" "}
              <a
                href="https://www.tensorflow.org/js/tutorials"
                className={linkClass}
              >
                getting-started example
              </a>{" "}
              trains a small model and makes a prediction. The{" "}
              <a
                href="https://www.tensorflow.org/js/models"
                className={linkClass}
              >
                pretrained model catalog
              </a>{" "}
              gives you existing models to try on supported tasks.
            </p>
          </div>
        </section>

        <div className="max-w-3xl">
          <section aria-labelledby="prerequisites" className={sectionClass}>
            <h2 id="prerequisites" className={headingClass}>
              The starting skills
            </h2>
            <p>
              For this path, you should be comfortable with JavaScript
              functions, arrays, objects, modules, and async code. You will read
              numbers, compare arrays, and interpret charts. Learn the ML terms
              and the required math as they become useful to the task.
            </p>
            <p>
              Tensorcraft&apos;s browser lessons need no local installation. Its
              independent project uses a local browser app and requires Node.js
              22 or later plus an initial dependency download. A project
              centered on Python research code or large-scale training needs
              additional tools and study beyond this JavaScript course.
            </p>
          </section>

          <section aria-labelledby="sequence" className={sectionClass}>
            <h2 id="sequence" className={headingClass}>
              A sequence for learning how models work
            </h2>
            <ol className="list-decimal space-y-6 pl-6">
              <li>
                <strong>The input and its meaning.</strong> Record the feature
                order, units, shapes, and scaling. Keep one small example you
                can check by hand. The{" "}
                <Link
                  href="/guides/tensorflow-js-reshape-vs-transpose"
                  className={linkClass}
                >
                  reshape and transpose guide
                </Link>{" "}
                shows why two tensors with the same shape can group readings
                differently.
              </li>
              <li>
                <strong>A baseline and a prediction.</strong> State the decision
                the application needs to make. Try an ordinary rule first. Save
                its predictions and errors so you can judge whether a learned
                model adds value.
              </li>
              <li>
                <strong>Training and evaluation.</strong> Train on chosen
                examples, inspect the error measure, and compare predictions on
                separate data. Keep final test data out of model tuning. A
                smaller training error alone does not establish useful
                predictions.
              </li>
              <li>
                <strong>Browser delivery.</strong> Save and load the model,
                apply the same input preparation, and inspect the runtime on the
                devices you care about. Record slow or failed predictions as
                well as successful ones.
              </li>
              <li>
                <strong>An independent explanation.</strong> Keep the data
                source, model artifact, evaluation method, and mistakes
                together. The{" "}
                <Link
                  href="/guides/browser-machine-learning-project"
                  className={linkClass}
                >
                  browser ML project case
                </Link>{" "}
                shows an existing demonstration with a baseline, model, and a
                failure to inspect.
              </li>
            </ol>
            <p>
              If your immediate goal is a pretrained feature or an API
              integration, you can begin with that route and learn training when
              your task needs it. Keep input handling and evaluation in every
              route. TensorFlow&apos;s{" "}
              <a
                href="https://www.tensorflow.org/resources/learn-ml/basics-of-tensorflow-for-js-development"
                className={linkClass}
              >
                JavaScript learning curriculum
              </a>{" "}
              offers another self-directed route through the topic.
            </p>
          </section>
        </div>

        <section aria-labelledby="deep-orbit" className={sectionClass}>
          <div className="max-w-3xl space-y-5">
            <h2 id="deep-orbit" className={headingClass}>
              How Deep Orbit follows that path
            </h2>
            <p>
              Deep Orbit has {courseModules.length} modules and{" "}
              {courseLessons.length} lessons. Its fictional sensor investigation
              connects data preparation, training, evaluation, and deployment.
              The table names outputs to inspect as you work through the course.
              It describes the learning tasks. A learner produces and checks
              their own outputs.
            </p>
            <p>
              The first module&apos;s {freeLessons.length} lessons are free,
              with no account required. Later modules require a one-time
              purchase and open as you complete earlier work. Some exercises use
              supplied models or controlled outputs. Passing their checks
              establishes the exercise task and does not validate an external
              model or a real scientific finding.
            </p>
          </div>
          <table className="mt-6 w-full border-collapse text-left text-sm sm:text-base">
            <caption className="mb-4 text-left font-medium">
              Deep Orbit&apos;s current course sequence
            </caption>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="w-2/5 p-3 align-top">
                  Module and access
                </th>
                <th scope="col" className="p-3 align-top">
                  Output to inspect
                </th>
              </tr>
            </thead>
            <tbody>
              {courseModules.map((module) => {
                const lessonCount = courseLessons.filter(
                  (lesson) => lesson.moduleId === module.slug,
                ).length;
                return (
                  <tr
                    key={module.slug}
                    data-module={module.slug}
                    className="border-b border-border"
                  >
                    <th scope="row" className="p-3 align-top font-medium">
                      <span className="block text-sm text-text-muted">
                        Module {module.order}
                      </span>
                      <span className="block">{module.title}</span>
                      <span className="mt-2 block text-sm font-normal text-text-muted">
                        {lessonCount} lessons.{" "}
                        {module.order === 1 ? "Free" : "Paid continuation"}.
                      </span>
                    </th>
                    <td className="p-3 align-top">
                      {moduleOutputs[module.slug]}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="max-w-3xl">
            The{" "}
            <Link href={coursePath} className={linkClass}>
              Deep Orbit overview
            </Link>{" "}
            explains the story and module map. The{" "}
            <Link href="/pricing#curriculum" className={linkClass}>
              curriculum and pricing page
            </Link>{" "}
            describes the current offer. Deep Orbit is the available world. The
            other four worlds remain coming soon.
          </p>
        </section>

        <div className="max-w-3xl">
          <section
            aria-labelledby="free-lessons"
            className={`${sectionClass} border-t border-border pt-8`}
          >
            <h2 id="free-lessons" className={headingClass}>
              The free starting lessons
            </h2>
            <p>
              These lessons teach the input preparation that comes before
              training. You work with the crew&apos;s fictional readings and
              inspect what your JavaScript produces. Completing a tensor
              transformation does not train a model.
            </p>
            <ol className="list-decimal space-y-3 pl-6">
              {freeLessons.map((lesson) => {
                const path = `${coursePath}/${lesson.moduleId}/${lesson.slug}`;
                return (
                  <li key={lesson.slug}>
                    <FreeLessonCtaTracker
                      source="guide"
                      guideSlug={guide.slug}
                      targetLesson={`${SITE_URL}${path}`}
                      placement="activity"
                    >
                      <Link href={path} className={linkClass}>
                        {lesson.title}
                      </Link>
                    </FreeLessonCtaTracker>
                  </li>
                );
              })}
            </ol>
            <p>
              Try the lessons to judge whether the story, explanations, and
              exercises help you understand the task. Continue into paid
              material if that learning method and the remaining curriculum fit
              your goal. Check whether you can explain an axis, reproduce a
              transformation, and identify an incorrect grouping.
            </p>
          </section>

          <section aria-labelledby="sources" className={sectionClass}>
            <h2 id="sources" className={headingClass}>
              Sources and scope
            </h2>
            <p>
              The module order, lesson counts, and free lesson links come from
              Tensorcraft&apos;s current Deep Orbit curriculum. The public
              technical references below explain TensorFlow.js independently of
              this course.
            </p>
            <ul className="list-disc space-y-3 pl-6">
              <li>
                <a
                  href="https://www.tensorflow.org/resources/learn-ml/basics-of-tensorflow-for-js-development"
                  className={linkClass}
                >
                  TensorFlow&apos;s JavaScript learning curriculum
                </a>
              </li>
              <li>
                <a
                  href="https://www.tensorflow.org/js/guide/train_models"
                  className={linkClass}
                >
                  TensorFlow.js training guide
                </a>
              </li>
              <li>
                <a
                  href="https://www.tensorflow.org/js/models"
                  className={linkClass}
                >
                  TensorFlow.js pretrained models
                </a>
              </li>
            </ul>
          </section>
        </div>
      </article>
    </main>
  );
}
