/** Historical wording is immutable: saved version-1 calls keep their meaning. */
export type StoryChoiceLabel = "cooperate" | "defect" | "random" | "dominant";
export interface StoryOption {
  label: StoryChoiceLabel;
  display: string;
  consequence: string;
}
export const STORY_HISTORY: Record<
  string,
  Record<
    number,
    { options: StoryOption[]; outcomes: Record<StoryChoiceLabel, string> }
  >
> = {
  "deep-orbit-foundations-7741-first-flag": {
    "1": {
      options: [
        {
          label: "cooperate",
          display: "Open a formal investigation now",
          consequence:
            "Nazari assigns the next watch to inspect the capture and calibration log. That preserves a clear owner, but moves a scheduled channel check back one watch.",
        },
        {
          label: "defect",
          display: "Remove it from the working list as likely sensor noise",
          consequence:
            "Demir removes the row from the working review list. The raw archive still holds it; recovering its context later will require reopening that archive.",
        },
        {
          label: "random",
          display: "Leave it in the archive without assigning a review",
          consequence:
            "The row stays available, with no owner and no review note. The next watch receives its usual channel checklist.",
        },
        {
          label: "dominant",
          display: "Tag it as unresolved and schedule a replay",
          consequence:
            "Farah adds an unresolved tag and a replay task for the first classifier. The channel check stays on schedule; the unexplained capture waits.",
        },
      ],
      outcomes: {
        cooperate:
          "Nazari arrives with the investigation packet from the earlier flag: capture intact, calibration unchanged, cause unresolved. The delayed channel check takes the rest of her watch, so Demir runs the neuron demonstration alone.",
        defect:
          "Demir searches the working list for 7741 and finds the removal note. He restores the row from the raw archive and asks Nazari to verify its timestamp before they can compare it with the new output.",
        random:
          "The shift handover has no note about 7741. Farah finds it again in the archive, then waits while Demir reconstructs which channels were active at its timestamp.",
        dominant:
          "Farah opens the replay task attached to 7741. Its timestamp and channel list are already there; Nazari finishes the scheduled channel check while Demir adds the new score to the unresolved record.",
      },
    },
  },
  "deep-orbit-drift-response": {
    "1": {
      options: [
        {
          label: "cooperate",
          display:
            "Inspect raw captures and calibration before changing the model",
          consequence:
            "Nazari takes the investigation slot. The deployed model stays in place while she checks the instrument chain; retraining must wait.",
        },
        {
          label: "defect",
          display: "Retrain on the recent stream and replace the current model",
          consequence:
            "Demir starts a candidate fit. Without recent outcome labels, the drift score cannot establish that it is better. The release gate will require a separate evaluation before any replacement.",
        },
        {
          label: "random",
          display: "Silence repeat drift pages for this watch",
          consequence:
            "The engineer finishes scheduled maintenance. Raw measurements continue, but the next watch will have to inspect the unreviewed interval before trusting the alert history.",
        },
        {
          label: "dominant",
          display: "Keep current alerts and compare a shadow candidate",
          consequence:
            "Demir reserves the engineer for a parallel comparison. The candidate cannot issue operational verdicts; useful quality evaluation still waits for labels, and both runs consume resources.",
        },
      ],
      outcomes: {
        cooperate:
          "Nazari attaches her calibration check and the raw fft_5 captures to the runbook. The sensors passed the check, so the next watch moves to outcome review. The replacement model remains unscheduled until that evidence arrives.",
        defect:
          "The new candidate is ready before the outcome labels. Demir marks it unreleased and adds an evaluation gate to the runbook; the overnight fit used the engineer's slot without establishing an improvement.",
        random:
          "The muted interval appears as a gap in the alert review log. Nazari restores paging and assigns the next watch to replay the retained captures, postponing its first maintenance task.",
        dominant:
          "The runbook now has separate columns for the active model and the shadow candidate. Demir records their version IDs and disagreements; Nazari adds an owner for reviewing them when labels arrive. The extra comparison stays on the watch budget.",
      },
    },
  },
};
