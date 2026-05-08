import { redirect } from "next/navigation";
import Link from "next/link";
import { themes } from "@tensorcraft/themes";
import { isLaunched, isValidThemeSlug } from "@tensorcraft/shared";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { RewindView, type RewindCandidate } from "./rewind-view";

interface Props {
  searchParams: Promise<{ theme?: string }>;
}

export const metadata: Metadata = {
  title: "Rewind | Tensorcraft",
  description: "Rewind one strategic decision per theme.",
  robots: { index: false, follow: false },
};

const COUNTERFACTUAL_LIBRARY: Record<
  string,
  Array<{
    decisionNode: string;
    lessonId: string;
    originalLabel: string;
    alternates: Array<{
      choiceIndex: number;
      choiceLabel: string;
      headline: string;
      timeline: string;
    }>;
  }>
> = {
  "deep-orbit": [
    {
      decisionNode: "boss-beat:deep-orbit-launch-deploy-call",
      lessonId: "launch",
      originalLabel: "Your call at the deploy gate",
      alternates: [
        {
          choiceIndex: 0,
          choiceLabel: "cooperate",
          headline: "If you'd held for Demir's rerun…",
          timeline:
            "DEEP SCAN deploys two minutes after the pulse window closes. Classification correlation drops to 0.94 — still confident, but the bridge cannot replay the pulse for verification. Mirza signs off without comment. Three weeks later the signal stops. The team never sees a 0.99-grade pulse again that quarter. Cooperative play kept the team intact. The science took the hit.",
        },
        {
          choiceIndex: 1,
          choiceLabel: "defect",
          headline: "If you'd overridden Demir…",
          timeline:
            "DEEP SCAN ships at the pulse peak. Correlation 0.9991. Mirza files the report and walks. Demir's trust ledger carries a debt that surfaces during the next anomaly: when you ask for a fast verification rerun, Demir takes the safe path. You won the science round and lost the bench. Defection paid in this single trade and cost the next three.",
        },
        {
          choiceIndex: 2,
          choiceLabel: "random",
          headline: "If you'd flipped the coin…",
          timeline:
            "Tails. Hold. Same outcome as cooperate, but the bridge logged 'operator deferred decision'. The next time leadership escalates, you're not the first call. Mixed strategies pay off against adversarial opponents; against your own crew they read as abdication.",
        },
      ],
    },
  ],
  "neon-protocol": [
    {
      decisionNode: "boss-beat:neon-protocol-launch-rollout-call",
      lessonId: "launch",
      originalLabel: "Your call at the rollout gate",
      alternates: [
        {
          choiceIndex: 0,
          choiceLabel: "cooperate",
          headline: "If you'd held at 5% for another red-team pass…",
          timeline:
            "Ryo finds two more low-light failures overnight. You ship at 50% the next morning with a calibrated mitigation. Schedule slips 18 hours. Lin's report reads 'slow ship, no surprises.' The product team complains the gate is too tight; the next quarter's roadmap absorbs the delay quietly. Cooperative play with red team kept the rollout safe; you traded velocity for predictability.",
        },
        {
          choiceIndex: 1,
          choiceLabel: "defect",
          headline: "If you'd promoted to 50% on the regression…",
          timeline:
            "50% rollout ships clean for 3 hours, then auto-rollback fires on a low-light segment. You isolate. The post-mortem reads as a near-miss; the next promote requires Ryo's signoff. Defection paid this round; the trust budget shrinks for the next two.",
        },
        {
          choiceIndex: 2,
          choiceLabel: "random",
          headline: "If you'd let the coin pick promote vs hold…",
          timeline:
            "Heads. Promote at 50%. Same outcome as defect, but the team logs that the call wasn't yours. Lin pulls you aside: 'Mixed strategy on a deployment ladder isn't strategy, it's avoidance. Decide.' Mixed-strategy reading: against your own deployment posture, randomness reads as no thesis.",
        },
      ],
    },
  ],
  "signal-ward": [
    {
      decisionNode: "boss-beat:signal-ward-launch-confidence-call",
      lessonId: "launch-day",
      originalLabel: "Your call at the alert gate",
      alternates: [
        {
          choiceIndex: 0,
          choiceLabel: "cooperate",
          headline: "If you'd held the alert below threshold…",
          timeline:
            "Suppressed. Five days later, audit catches the methotrexate-trimethoprim interaction in a chart review. Patient is fine. The case becomes the lead exhibit in the calibration retraining sprint. Dr. Amara's note: 'The threshold was wrong. The contract was right.' Cooperative play with the contract; the calibration cycle absorbed the cost.",
        },
        {
          choiceIndex: 1,
          choiceLabel: "defect",
          headline: "If you'd surfaced without the calibration banner…",
          timeline:
            "Alert fires raw, no calibration metadata. Clinician overrides; patient is fine. Audit later flags the override as 'operator bypassed contract' without the structural data needed to justify it. The next override carries more friction. Defection paid clinically; the institutional cost lands on the calibration team.",
        },
        {
          choiceIndex: 2,
          choiceLabel: "random",
          headline: "If you'd paged a clinician without surfacing the alert…",
          timeline:
            "Clinician surfaces it manually using their own pharmacology knowledge. Patient outcome same. But the model has no audit trail of why it didn't fire — the training dataset misses a labeled hard case. Mixed strategy = decision pushed to a human without your full evidence. The model learns nothing.",
        },
      ],
    },
  ],
  "nova-canvas": [
    {
      decisionNode: "boss-beat:nova-canvas-launch-curator-call",
      lessonId: "opening-night",
      originalLabel: "Your call at the gallery gate",
      alternates: [
        {
          choiceIndex: 0,
          choiceLabel: "cooperate",
          headline: "If you'd pulled silently…",
          timeline:
            "Wall blank for 30 seconds, generator retries, lands a piece. Audience never knows. The gallery board books the next show. Yara files the moment as 'editorial system worked, audience saw none of it.' Cooperative play; the gate was honored, but the artistic statement that the gate exists is invisible. Petrov's note: 'Hidden discipline is still discipline; it just teaches no one.'",
        },
        {
          choiceIndex: 1,
          choiceLabel: "defect",
          headline: "If you'd let the piece display…",
          timeline:
            "Audience reaction split. Curator publicly defends. Board calls a closed meeting; next exhibit's editorial gate tightens; budget shrinks 12%. You made an artistic statement at the cost of the gallery's operational latitude. Defection paid; future shows carry less artistic risk because of it.",
        },
        {
          choiceIndex: 2,
          choiceLabel: "random",
          headline: "If you'd let the audience reaction decide…",
          timeline:
            "60% disengaged → auto-pull. Same outcome as cooperate, but the call was made by an averaging mechanism rather than artistic intent. Petrov: 'You made art subject to majority reaction. The minority who would have engaged deeply now never see it.' Mixed strategy in a curatorial gate = outsourcing the gate to a metric.",
        },
      ],
    },
  ],
  "terra-grid": [
    {
      decisionNode: "boss-beat:terra-grid-launch-cascade-call",
      lessonId: "global-launch",
      originalLabel: "Your call at the cascade gate",
      alternates: [
        {
          choiceIndex: 0,
          choiceLabel: "cooperate",
          headline: "If you'd trusted Park's pre-prod read…",
          timeline:
            "Telemetry doubles, drift stabilizes, no rollback. Pre-prod call was right. But your trust in the call was structural, not evidential — you didn't verify against live data. Park: 'You trusted my report. Next time, replay it.' Cooperative play with the team's pre-prod discipline; payoff = no churn, but the verification muscle didn't fire.",
        },
        {
          choiceIndex: 1,
          choiceLabel: "defect",
          headline: "If you'd full-rolled-back globally…",
          timeline:
            "11.7 seconds to revert. SLO held. 18 hours of investigation reveals the drift was benign sensor drift Park had already documented. You burned operational budget on caution. Hassan: 'You kept the SLO. The cost was the team feeling overruled.' Defection paid in safety; the next pre-prod report you'll read more carefully and trust less.",
        },
        {
          choiceIndex: 2,
          choiceLabel: "random",
          headline: "If you'd geofenced only…",
          timeline:
            "3 sites isolated. PSI normalizes in 4 hours within geofence. Rest of fleet clean. Reasonable middle play. But the 3 sites lost 4 hours of inference, and you didn't validate Park's call — just hedged against it. Mid-strategy: paid operational cost for caution without the verification that would justify the cost.",
        },
      ],
    },
  ],
};

export default async function RewindPage({ searchParams }: Props) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth?redirectTo=/log/rewind");

  const { theme } = await searchParams;
  const themeId =
    theme && isValidThemeSlug(theme) && isLaunched(theme) ? theme : null;
  if (!themeId) redirect("/log");

  const { data: prior } = await supabase
    .from("counterfactual_choices")
    .select("decision_node, alternate_choice_index, rewound_at")
    .eq("user_id", user.id)
    .eq("theme_id", themeId)
    .maybeSingle();

  const { data: bossChoices } = await supabase
    .from("boss_beat_choices")
    .select("beat_id, lesson_id, choice_index, choice_label")
    .eq("user_id", user.id)
    .eq("theme_id", themeId);

  const candidates: RewindCandidate[] = [];
  for (const entry of COUNTERFACTUAL_LIBRARY[themeId] ?? []) {
    const playerChoice = bossChoices?.find(
      (b) => `boss-beat:${b.beat_id}` === entry.decisionNode,
    );
    if (!playerChoice) continue;
    const altsForUser = entry.alternates.filter(
      (a) => a.choiceIndex !== playerChoice.choice_index,
    );
    candidates.push({
      decisionNode: entry.decisionNode,
      lessonId: entry.lessonId,
      themeId,
      originalLabel: entry.originalLabel,
      originalChoiceIndex: playerChoice.choice_index,
      originalChoiceLabel: playerChoice.choice_label,
      alternates: altsForUser,
    });
  }

  const themeMeta = themes[themeId as keyof typeof themes];

  return (
    <RewindView
      themeId={themeId}
      themeName={themeMeta?.displayName ?? themeId}
      themePrimary={themeMeta?.palette.primary ?? "#7B68EE"}
      candidates={candidates}
      priorRewind={
        prior
          ? {
              decisionNode: prior.decision_node,
              alternateChoiceIndex: prior.alternate_choice_index,
              rewoundAt: prior.rewound_at,
            }
          : null
      }
      backLink={
        <Link
          href="/log"
          className="text-xs font-mono uppercase tracking-wider text-text-muted hover:text-text-primary"
        >
          ← Back to log
        </Link>
      }
    />
  );
}
