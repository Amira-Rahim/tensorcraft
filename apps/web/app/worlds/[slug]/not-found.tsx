import Link from "next/link";
import { ERROR_MESSAGES } from "@/lib/error-messages";

export default function WorldNotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="max-w-md w-full border border-border bg-surface p-10 rounded-none">
        <div className="font-mono text-xs text-text-muted tracking-wider uppercase mb-4">
          404 · WORLD NOT FOUND
        </div>
        <h1 className="text-xl font-mono font-black tracking-[-0.03em] mb-4 uppercase text-text-primary">
          World not found
        </h1>
        <p className="text-sm text-text-muted leading-relaxed mb-6">
          {ERROR_MESSAGES.content_not_found}
        </p>
        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          <Link
            href="/worlds"
            className="px-6 py-3 border-2 border-primary bg-primary/10 text-primary font-mono text-sm font-bold uppercase tracking-wider rounded-none hover:bg-primary/20 transition-colors text-center"
          >
            Browse worlds
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 border border-border bg-transparent text-text-muted font-mono text-sm font-bold uppercase tracking-wider rounded-none hover:text-text-primary hover:border-primary/30 transition-colors text-center"
          >
            &larr; Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
