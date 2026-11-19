import Link from "next/link";
import {
  DEFAULT_WORLD,
  WORLD_CONTENT,
  getModuleLessonCount,
} from "@tensorcraft/shared";
import { INTRO_VIDEO } from "@/lib/intro-video";
import { FreeLessonCtaTracker } from "./free-lesson-cta-tracker";

const FREE_LESSONS = getModuleLessonCount(
  DEFAULT_WORLD,
  WORLD_CONTENT.freeModuleSlug,
);

export function IntroVideoSection() {
  return (
    <section
      id="introduction"
      data-testid="intro-video-section"
      aria-label="Tensorcraft introduction"
      className="border-b border-border scroll-mt-20"
    >
      <div className="px-6 sm:px-10 md:px-20 py-14">
        <video
          data-testid="intro-video-player"
          aria-label="Introduction to Tensorcraft and Deep Orbit"
          controls
          playsInline
          preload="none"
          poster={INTRO_VIDEO.poster}
          src={INTRO_VIDEO.src}
          className="block w-full aspect-video bg-code-bg border border-border"
        >
          <track
            kind="captions"
            src={INTRO_VIDEO.captions}
            srcLang="en"
            label="English"
          />
          <p>
            <a href={INTRO_VIDEO.src}>Watch the Tensorcraft introduction</a>.
          </p>
        </video>
        <div className="mt-7 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between xl:gap-12">
          <p className="max-w-[48ch] font-sans text-base leading-relaxed text-text-muted">
            Deep Orbit is Tensorcraft’s first available world. Help a research
            crew investigate an unexplained signal with JavaScript.
          </p>
          <div className="shrink-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
              <FreeLessonCtaTracker source="landing_intro">
                <Link
                  href="/worlds/deep-orbit/foundations/introduction-to-tensors"
                  data-testid="intro-cta-primary"
                  aria-describedby="intro-free-note"
                  className="inline-flex min-h-12 items-center justify-center rounded-none border-2 border-primary bg-primary px-6 py-3 font-mono text-sm font-bold text-on-primary brutalist-shadow hover:bg-transparent hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page"
                >
                  Start Deep Orbit free
                </Link>
              </FreeLessonCtaTracker>
              <Link
                href="/worlds"
                className="inline-flex min-h-11 items-center justify-center font-mono text-sm text-primary underline underline-offset-4 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page"
              >
                Explore all worlds
              </Link>
            </div>
            <p
              id="intro-free-note"
              className="mt-4 font-mono text-xs leading-relaxed text-text-muted"
            >
              First {FREE_LESSONS} lessons free. No account needed.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
