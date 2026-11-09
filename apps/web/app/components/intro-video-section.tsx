import Link from "next/link";
import { INTRO_VIDEO } from "@/lib/intro-video";

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
        <Link
          href="/worlds"
          className="inline-flex mt-6 font-mono text-sm text-primary underline underline-offset-4 hover:opacity-80"
        >
          Explore all worlds
        </Link>
      </div>
    </section>
  );
}
