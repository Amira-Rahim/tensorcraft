import Link from "next/link";
import { FreeLessonCtaTracker } from "@/app/components/free-lesson-cta-tracker";
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { PRICING, WORLD_SHAPE } from "@tensorcraft/shared";
import {
  ORGANIZATION_ID,
  SITE_URL,
  WEBSITE_ID,
  serializeJsonLd,
} from "@/lib/site-identity";

const UPDATED_AT = "2026-11-14";
const title = "JavaScript ML courses compared, Tensorcraft";
const description =
  "Compare machine learning options for JavaScript developers by goal, prerequisites, runtime, and project work, with links to the providers' published curricula.";
const url = `${SITE_URL}/compare`;
const image =
  "/api/og?title=JavaScript%20ML%20courses%20compared&world=deep-orbit&subtitle=Goals%2C%20prerequisites%20and%20projects";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: {
    type: "article",
    url,
    siteName: "Tensorcraft",
    title,
    description,
    modifiedTime: UPDATED_AT,
    images: [image],
  },
  twitter: { card: "summary_large_image", title, description, images: [image] },
};

export const revalidate = 86400;

const OPTIONS = [
  {
    id: "tensorcraft",
    name: "Deep Orbit",
    publisher: "Tensorcraft",
    href: "/worlds/deep-orbit",
  },
  {
    id: "tensorflow",
    name: "TensorFlow.js learning resources",
    publisher: "TensorFlow",
    href: "https://www.tensorflow.org/resources/learn-ml/basics-of-tensorflow-for-js-development",
  },
  {
    id: "coursera",
    name: "Browser-based Models with TensorFlow.js",
    publisher: "DeepLearning.AI, Coursera",
    href: "https://www.coursera.org/learn/browser-based-models-tensorflow",
  },
  {
    id: "freecodecamp",
    name: "ml5.js video course",
    publisher: "Henry Ly, freeCodeCamp",
    href: "https://www.freecodecamp.org/news/learn-ml5js-for-machine-learning-in-javascript/",
  },
  {
    id: "charlie",
    name: "Machine Learning in JavaScript with TensorFlow.js",
    publisher: "Charlie Gerard, Master.dev",
    href: "https://master.dev/courses/tensorflow-js/",
  },
  {
    id: "grider",
    name: "Machine Learning with Javascript",
    publisher: "Stephen Grider, Udemy",
    href: "https://www.udemy.com/course/machine-learning-with-javascript/",
  },
  {
    id: "fastai",
    name: "Practical Deep Learning",
    publisher: "fast.ai",
    href: "https://course.fast.ai/",
  },
  {
    id: "scrimba",
    name: "The AI Engineer Path",
    publisher: "Scrimba",
    href: "https://docs.scrimba.com/ai-engineer-path/",
  },
] as const;

type OptionId = (typeof OPTIONS)[number]["id"];
type Row = { feature: string } & Record<OptionId, string>;

const ROWS: Row[] = [
  {
    feature: "Learning goal",
    tensorcraft:
      "Learn ML through JavaScript exercises and a continuing story. Build, evaluate, and run small browser models.",
    tensorflow:
      "Build models in JavaScript, run existing models, and deploy them to browsers.",
    coursera:
      "Train and run browser models, handle data, and adapt pretrained image models with webcam examples.",
    freecodecamp:
      "Use pretrained models, transfer learning, and custom prediction models with ml5.js.",
    charlie:
      "Use pretrained models and train custom models for image, gesture, and audio applications.",
    grider:
      "Implement ML algorithms from scratch, then use low-level TensorFlow.js operations to build and optimize them.",
    fastai:
      "Apply deep learning to vision, text, tabular data, and recommendations, then deploy models.",
    scrimba:
      "Build applications with existing generative models, retrieval, agents, and tools.",
  },
  {
    feature: "Language and runtime",
    tensorcraft:
      "JavaScript and TensorFlow.js in browser lessons. The independent project uses a local browser app.",
    tensorflow: "JavaScript, TensorFlow.js, browsers, and Node.js.",
    coursera:
      "JavaScript and TensorFlow.js in the browser. One module trains a model in Python and converts it for JavaScript.",
    freecodecamp: "JavaScript and ml5.js for browser projects.",
    charlie:
      "JavaScript and TensorFlow.js, including webcam input in the browser.",
    grider:
      "JavaScript with TensorFlow.js, command-line tooling, and browser project examples.",
    fastai: "Python notebooks with PyTorch, fastai, and other libraries.",
    scrimba:
      "JavaScript and TypeScript. Projects use browser and server code, hosted model APIs, or local models.",
  },
  {
    feature: "Starting knowledge",
    tensorcraft:
      "JavaScript functions, arrays, objects, modules, and async code. Lessons explain the math as it comes up.",
    tensorflow:
      "HTML, CSS, JavaScript browser programming, and command-line use for Node.js scripts.",
    coursera:
      "Intermediate level. The provider recommends TensorFlow in Practice first if you are new to TensorFlow.",
    freecodecamp:
      "The course announcement introduces ml5.js to beginners and lists no formal prerequisites.",
    charlie: "Introductory web development or equivalent knowledge.",
    grider:
      "Basic terminal and command-line use, plus the ability to read basic math equations.",
    fastai: "Coding experience, preferably Python, and high-school math.",
    scrimba:
      "Check the individual module's setup guide for its language, package, and provider requirements.",
  },
  {
    feature: "Practice format",
    tensorcraft:
      "Browser code editor, exercise checks, illustrated scenes, and solved code you can save to GitHub.",
    tensorflow:
      "Tutorials, videos, codelabs, and example source code. Official guides and tutorials are free to read.",
    coursera:
      "Videos, readings, quizzes, programming assignments, and a model-conversion lab.",
    freecodecamp:
      "Free YouTube video course by Henry Ly with project walkthroughs.",
    charlie:
      "Video lessons, transcripts, and follow-along recognition projects.",
    grider:
      "Video lectures and follow-along implementation projects. The public syllabus lists 17 hours and 40 minutes.",
    fastai:
      "Free video course, notebooks, book, forums, and independent projects.",
    scrimba:
      "Interactive lessons, coding challenges, and projects. Companion docs explain how to run projects locally.",
  },
  {
    feature: "Example output",
    tensorcraft:
      "An evaluated signal classifier in the lessons and an independent room-occupancy browser project.",
    tensorflow:
      "A minimal trained model that makes a browser prediction, with source code you can run.",
    coursera:
      "A handwritten-digit recognizer, a Python model converted for JavaScript, and webcam rock-paper-scissors recognition.",
    freecodecamp:
      "MobileNet image recognition, a Teachable Machine clone, and a saved student-score prediction model.",
    charlie:
      "Custom webcam models and image, gesture, or audio recognition applications.",
    grider:
      "A JavaScript k-nearest-neighbor classifier and linear or logistic regression implementations.",
    fastai:
      "Trained models for practical tasks, with a path to a deployed web application.",
    scrimba:
      "A retrieval chatbot and a support agent that answers from documents and calls tools.",
  },
];

const linkClass = "text-primary underline underline-offset-4";

export default function ComparePage() {
  const compareJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: "ML learning options for JavaScript engineers",
    author: { "@id": ORGANIZATION_ID },
    publisher: { "@id": ORGANIZATION_ID },
    isPartOf: { "@id": WEBSITE_ID },
    mainEntityOfPage: url,
    dateModified: UPDATED_AT,
    description,
    url,
    citation: [
      ...OPTIONS.filter((option) => option.id !== "tensorcraft").map(
        (option) => option.href,
      ),
      "https://www.tensorflow.org/js/tutorials",
      "https://www.manning.com/books/deep-learning-with-javascript",
    ],
  };

  return (
    <main className="min-h-screen bg-page px-6 md:px-10 py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(compareJsonLd) }}
      />
      <article className="max-w-5xl mx-auto">
        <p className="font-mono text-xs text-primary tracking-[0.18em] uppercase mb-3">
          Compare
        </p>
        <h1 className="text-4xl md:text-5xl font-mono font-black tracking-tight text-text-primary mb-6">
          ML learning options for JavaScript engineers
        </h1>
        <p className="text-sm text-text-muted mb-8">
          By{" "}
          <Link href="/about" rel="author" className={linkClass}>
            Tensorcraft
          </Link>
          . Comparison updated{" "}
          <time dateTime={UPDATED_AT}>November 14, 2026</time>.
        </p>

        <section className="space-y-6 text-base text-text-muted leading-relaxed font-sans mb-12">
          <p>
            Choose a course around the work you want to do. Training a small
            model, running a pretrained model, and building an application
            around a model API involve different skills. The options below cover
            those goals in different ways.
          </p>
          <p>
            We reviewed the providers&apos; public course pages and project
            documentation. This comparison describes their published scope.
            Tensorcraft publishes it and sells Deep Orbit. Each column links to
            its source so you can inspect the curriculum yourself.
          </p>
        </section>

        <p
          id="comparison-scroll-help"
          className="mb-4 text-sm leading-relaxed text-text-muted"
        >
          Scroll horizontally to compare all eight options. The criteria stay
          visible on the left.
        </p>
        <div
          tabIndex={0}
          role="region"
          aria-label="Learning options comparison"
          aria-describedby="comparison-scroll-help"
          className="overflow-x-auto border border-border focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
        >
          <table
            className="w-full min-w-[calc(7rem+9rem*var(--comparison-options))] table-fixed font-mono text-sm sm:min-w-[calc(7rem+14rem*var(--comparison-options))]"
            style={{ "--comparison-options": OPTIONS.length } as CSSProperties}
          >
            <caption className="sr-only">
              Named learning options compared by goal, language, starting
              knowledge, practice format, and example output. Column links open
              each provider&apos;s published curriculum.
            </caption>
            <colgroup>
              <col className="w-28" />
              {OPTIONS.map((option) => (
                <col key={option.id} className="w-36 sm:w-56" />
              ))}
            </colgroup>
            <thead className="bg-surface-raised">
              <tr>
                <th
                  scope="col"
                  className="sticky left-0 z-10 bg-surface-raised text-left p-3 text-text-primary font-bold align-top"
                >
                  Feature
                </th>
                {OPTIONS.map((option) => (
                  <th
                    key={option.id}
                    scope="col"
                    className="text-left p-3 text-text-primary font-bold align-top"
                  >
                    <Link href={option.href} className={linkClass}>
                      {option.name}
                    </Link>
                    <span className="mt-2 block text-xs font-normal text-text-muted">
                      {option.publisher}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr
                  key={row.feature}
                  className="border-t border-border align-top"
                >
                  <th
                    scope="row"
                    className="sticky left-0 z-10 bg-page text-left p-3 text-text-primary font-bold"
                  >
                    {row.feature}
                  </th>
                  {OPTIONS.map((option) => (
                    <td key={option.id} className="p-3 text-text-muted">
                      {row[option.id]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-text-muted">
          TensorFlow&apos;s{" "}
          <a
            href="https://www.tensorflow.org/js/tutorials"
            className={linkClass}
          >
            getting-started tutorial
          </a>{" "}
          supplies the minimal-model example. Scrimba&apos;s linked
          documentation describes its projects and local setup. The freeCodeCamp
          column cites its course announcement, which links to Henry Ly&apos;s
          video. Check each provider&apos;s course page for current access
          terms.
        </p>

        <section className="space-y-6 text-base text-text-muted leading-relaxed font-sans mt-12">
          <h2 className="text-2xl font-mono font-bold text-text-primary">
            A TensorFlow.js book
          </h2>
          <p>
            Manning&apos;s{" "}
            <a
              href="https://www.manning.com/books/deep-learning-with-javascript"
              className={linkClass}
            >
              Deep Learning with JavaScript
            </a>{" "}
            is a January 2020 book for JavaScript programmers. Its published
            scope includes browser neural networks, image and language
            processing, and transfer learning with TensorFlow.js. The publisher
            supplies source code for the examples. Check those examples&apos;
            dependencies against the library version you plan to use.
          </p>
        </section>

        <section className="space-y-6 text-base text-text-muted leading-relaxed font-sans mt-12">
          <h2 className="text-2xl font-mono font-bold text-text-primary">
            Where Deep Orbit fits
          </h2>
          <p>
            Deep Orbit is for JavaScript engineers who want to understand the
            model work behind an ML feature. Across{" "}
            {WORLD_SHAPE["deep-orbit"].totalLessons} lessons, you prepare
            readings, build models, inspect errors, and run inference in the
            browser. The crew&apos;s investigation connects the exercises. The
            independent project asks you to compare a simple rule with a model
            on recorded room measurements.
          </p>
          <p>
            Its first five lessons are free without an account. The full course
            costs ${PRICING.single.price}
            {PRICING.single.price < PRICING.single.regularPrice
              ? ` at the introductory price. The regular price is $${PRICING.single.regularPrice}.`
              : "."}{" "}
            One payment gives lifetime access to Deep Orbit. See{" "}
            <Link href="/pricing" className={linkClass}>
              pricing and the curriculum
            </Link>{" "}
            for the current offer.
          </p>
          <p>
            Browser lessons require no local installation. The independent
            project requires Node.js 22+ and an initial dependency download. The
            completion certificate records your work and carries no academic
            accreditation. Deep Orbit covers browser ML engineering. Python
            research workflows and distributed training fall outside its scope.
          </p>
          <p>
            Our{" "}
            <Link
              href="/guides/javascript-machine-learning-learning-path"
              className={linkClass}
            >
              JavaScript ML learning path
            </Link>{" "}
            explains the stages from data preparation to deployment. The{" "}
            <Link
              href="/guides/browser-machine-learning-project"
              className={linkClass}
            >
              browser ML project case
            </Link>{" "}
            shows the data, supplied starter, and evaluation evidence you can
            inspect before choosing the course.
          </p>
        </section>

        <div className="mt-16 flex flex-wrap items-center gap-4">
          <FreeLessonCtaTracker
            source="compare"
            targetLesson={`${SITE_URL}/worlds/deep-orbit/foundations/introduction-to-tensors`}
            placement="activity"
          >
            <Link
              href="/worlds/deep-orbit/foundations/introduction-to-tensors"
              className="rounded-none inline-flex items-center px-8 py-4 bg-primary text-on-primary font-mono font-bold text-sm tracking-wider uppercase border-2 border-primary hover:bg-transparent hover:text-primary transition-all brutalist-hover"
            >
              Start the free first lesson
            </Link>
          </FreeLessonCtaTracker>
          <Link
            href="/worlds/deep-orbit"
            className="rounded-none inline-flex items-center px-8 py-4 border-2 border-border text-text-primary font-mono font-bold text-sm tracking-wider uppercase hover:text-primary hover:border-primary/30 transition-all"
          >
            Deep Orbit curriculum
          </Link>
        </div>
      </article>
    </main>
  );
}
