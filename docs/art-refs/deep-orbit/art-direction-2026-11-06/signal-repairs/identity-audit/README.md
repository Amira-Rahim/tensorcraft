# Signal, Browser and Recurrent identity audit

Status: generation and publication held. The earlier identity acceptance was too permissive. No source or runtime assets were deleted.

Reviewed 46 distinct images and 82 faces against the four neutral character anchors. The 20 new Signal section entries have been removed from the merge fragment. The 8 in-flight Browser images are saved as unapproved source PNGs and were never published.

The retained briefing images already contain much of the same drift, so correction must include those baselines. Lens, earpiece, costume and hair color do not establish identity.

## Strongest failures

The repository does not contain the paired PNG comparisons named below. The
[retained crop index](face-index.json) records their filenames, source paths and
crop coordinates. The findings below preserve the original review.

| Image | Character | Concrete mismatch | Evidence |
|---|---|---|---|
| fourier-transform / concept | farah | Strong drift: tiny nose, pointed chin, enlarged eyes and erased adult facial planes give a younger different face. | `fourier-transform-concept-farah-pair.png` ([crop coordinates](face-index.json)) |
| fourier-transform / concept | demir | Strongest Demir drift: almost smooth adolescent face, tiny tapered chin and much smaller nose. Light uneven adult stubble is largely lost. | `fourier-transform-concept-demir-pair.png` ([crop coordinates](face-index.json)) |
| time-vs-frequency / takeaways | farah | Added visible freckles, fuller lips, sculpted jaw and narrow nose are strong identity drift in a large clear face. | `time-vs-frequency-takeaways-farah-pair.png` ([crop coordinates](face-index.json)) |
| windowing-and-overlap / takeaways | demir | Near-front view makes the narrower lower face, narrow nose and taller quiff easier to compare; clearly more sculpted than the anchor. | `windowing-and-overlap-takeaways-demir-pair.png` ([crop coordinates](face-index.json)) |
| fft-as-features / takeaways | nazari | Gray bob and forehead lines are stable, but crow feet, cheek breadth and lower-mouth folds are reduced. Moderate drift. | `fft-as-features-takeaways-nazari-pair.png` ([crop coordinates](face-index.json)) |

## Per-face record

[identity-review.json](identity-review.json) records every face, source, canonical reference hash, evidence crop, individual observation and feature checklist. [face-index.json](face-index.json) and [retained-face-index.json](retained-face-index.json) record crop coordinates.

## Correction contract

Canonical face reference first, target scene last. Restrict changes to heads, hair and neck transitions. Lock facial proportions, age details and equipment geometry, then inspect paired crops for every cast member and recheck the whole scene.

Root pilot review passed both Farah and Demir: the rounded lower faces, nose tips, adult features and Demir stubble were restored without obvious body or diagram changes. That proves this one correction, not future batches.
