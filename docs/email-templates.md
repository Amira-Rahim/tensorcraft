# Email Templates — Brand Guidelines

> **Where templates live:** Kit (ConvertKit) dashboard. We do **not** ship
> template HTML/MJML in this repo. The API fires tags (`signed_up`,
> `onboarded`, `first_lesson`, `capstone`, `purchased`, and the preference
> tags `email_alerts` + `weekly_digest`); Kit sequences tied to those tags
> send the actual email. This document defines the brand rules every Kit
> template must satisfy. Paste it into the Kit template notes field so
> future edits stay on-brand.

## Brand System (Brutalist)

Tensorcraft's post-V0.5 visual identity is a dark brutalist monochrome with a
single primary accent. The email surfaces **must match** so a user recognises
it as us and not a phishing attempt.

| Token | Value | Purpose |
|-------|-------|---------|
| `--tc-bg` | `#171717` | Page background (outside the email container) |
| `--tc-surface` | `#232323` | Main email container background |
| `--tc-surface-overlay` | `#2a2a2a` | Callout / code blocks |
| `--tc-border` | `#2e2e2e` | Dividers, borders |
| `--tc-text` | `#f4f4f4` | Body copy |
| `--tc-muted` | `#8a8a8a` | Secondary copy, footer |
| `--tc-primary` | `#ff4c1f` | CTA, active accent |
| `--tc-primary-foreground` | `#171717` | Text on primary button |

> Per-theme palettes (Deep Orbit teal, Synaptic Fog violet, etc.) appear in the
> product UI, **not** in transactional email. Every email uses the primary
> brutalist palette for consistency and deliverability (per-theme gradient
> backgrounds trip more spam filters).

## Typography

- Body: `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.
- Code / label lines (e.g. `// HEADER`): `"JetBrains Mono", ui-monospace, monospace`.
- Body size: **14px** (line-height 1.6). Heading: **24px** bold.
- Mono label: **10px**, letter-spacing `0.14em`, color `--tc-muted`.

> Inline every font-family — email clients routinely strip `<link>` tags and
> external stylesheets. Keep the fallback stack Outlook-safe.

## Layout

- Max width **600px**, centred.
- Outer padding: 24px top/bottom on mobile, 40px desktop.
- Container border: `1px solid var(--tc-border)`, `border-radius: 0` (brutalist = no rounded corners).
- Single-column layout only. No grid / multi-column — breaks on ~30% of clients.

## Logo

The `T_` square badge from the nav. Render as 40×40px, foreground `--tc-primary`
on `--tc-bg`. Ship as inline `<img>` with an absolute HTTPS URL — embedded
base64 images are blocked by Gmail image-proxy. Host under `https://tensorcraft.app/email-logo.png`.

## Single CTA

Every transactional email has **one** call-to-action. No "Learn more" + "Buy now"
+ "Read the blog" stacks.

```html
<a href="https://tensorcraft.app/…"
   style="
     display: inline-block;
     background: #ff4c1f;
     color: #171717;
     font-family: 'JetBrains Mono', ui-monospace, monospace;
     font-weight: 700;
     font-size: 13px;
     letter-spacing: 0.08em;
     padding: 14px 28px;
     border: 2px solid #ff4c1f;
     border-radius: 0;
     text-decoration: none;
     text-transform: uppercase;
   ">Open Tensorcraft →</a>
```

## Plain-Text Fallback

Kit auto-generates a plain-text part from the HTML, but **override it** for every
template. The auto-generation flattens the brutalist mono markers into noise
(e.g. `// HEADER ———` becomes `HEADER ---`). Provide hand-written plain text
that reads naturally and includes the same CTA as a bare URL.

## Per-Event Copy Rules

| Tag | Subject | One-line body goal |
|-----|---------|---------------------|
| `signed_up` | `Welcome to Tensorcraft.` | Confirm account, link to `/onboarding` |
| `onboarded` | `Your first lesson awaits.` | Link to the theme the user picked |
| `first_lesson` | `One down. 54 to go.` | Celebrate + link to next module |
| `capstone_{theme}` | `You shipped {theme}.` | Congratulate + link to `/certificates/{id}` |
| `purchased` | `Your access is live.` | Receipt summary + link to `/dashboard` |
| `email_alerts` | _(lesson-complete nudges — Kit sequence)_ | Short nudge copy, one link |
| `weekly_digest` | `Your Tensorcraft week.` | Bridges learned, streak, next recommendation |

## Footer (every template)

- Company: `Tensorcraft` + `support@tensorcraft.app`.
- Unsubscribe link: Kit's merge tag `{{ unsubscribe_url }}`. Required by
  CAN-SPAM (US) and GDPR (EU). **Do not** hide / style to zero-contrast — this
  both fails compliance audits and tanks inbox placement.
- One-line preference tip: "Adjust what we email you in Settings → Notifications." +
  link to `https://tensorcraft.app/settings?tab=notifications`.

## Accessibility

- Body ≥ 14px. Mono labels at 10px are allowed **only** for decorative
  `// HEADER` markers — never body copy.
- Colour contrast: run every template through the WCAG 2.1 AA checker before
  publishing. Brutalist white-on-dark satisfies AA at 14px / 16px but 10px
  muted-on-surface can fail — boost `--tc-muted` to `#a0a0a0` inside emails
  where it appears at small sizes.
- Every `<img>` must carry an `alt`.

## Deferred / Out-of-Scope

- **Animation / GIFs** — no client support. Ship still frames.
- **Dark-mode CSS media queries** — Apple Mail's iOS dark-mode inverter can
  fight our palette; keep the template dark and do not branch on
  `prefers-color-scheme`.
- **Per-theme palettes in email** — deferred post-V1; see `themes-and-bridges`
  memory note.
