# DNS Records — `tensorcraft.app`

> Last updated: 2026-05-05. Maintained as part of the §B9 pre-launch checklist gate.

This document records the DNS configuration for the `tensorcraft.app` apex and its subdomains. Update it whenever a record changes so on-call (i.e., the solo dev) can recover quickly without a forensic dashboard hunt.

---

## Registrar + admin contact

- **Registrar:** _TODO — fill in the registrar name (e.g., Namecheap / Cloudflare Registrar / Porkbun)._
- **Account email:** `amera.salah.89@gmail.com`
- **Admin contact / WHOIS privacy:** _TODO — confirm WHOIS proxy is enabled to keep contact email out of public WHOIS._
- **Auto-renewal:** _TODO — verify enabled. Domain expiry date: TODO. Set calendar reminder 60 days before expiry._
- **Two-factor on registrar account:** _TODO — confirm TOTP enabled. Domain takeover via email reset is the most common compromise vector for hobby projects._

Where to look in the registrar UI: Account Settings → Security (for 2FA), Domains → tensorcraft.app → Auto-renew (for the toggle), Domains → tensorcraft.app → WHOIS (for privacy proxy).

---

## Records

| Host | Type | Value | TTL | Purpose |
|---|---|---|---|---|
| `tensorcraft.app` (apex) | NS | `ns1.vercel-dns.com.` | registrar default | Delegate apex resolution to Vercel |
| `tensorcraft.app` (apex) | NS | `ns2.vercel-dns.com.` | registrar default | Delegate apex resolution to Vercel |
| `www.tensorcraft.app` | CNAME / 301 redirect | apex `tensorcraft.app` | 300 | Redirect `www.` → apex (configured in Vercel project) |
| `api.tensorcraft.app` | CNAME | `<fly-app>.fly.dev.` | 300 | Hono API server hosted on Fly.io |
| `tensorcraft.app` (apex) | TXT | `v=spf1 include:_spf.kit.com ~all` | 300 | SPF for outbound email (Kit handles "from `hello@tensorcraft.app`") |
| `tensorcraft.app` (apex) | TXT (DKIM, hosted by Kit) | _provided by Kit dashboard_ | 300 | Outbound email auth |
| `_dmarc.tensorcraft.app` | TXT | `v=DMARC1; p=none; rua=mailto:postmaster@tensorcraft.app` | 300 | DMARC report-only; revisit `p=quarantine` post-launch |

> **No MX record** — `tensorcraft.app` does not receive email directly. Inbound `hello@tensorcraft.app` is handled by Kit / a forwarder; document the forwarder here once chosen.

> **CAA (optional but recommended):** add `tensorcraft.app CAA 0 issue "letsencrypt.org"` and `... CAA 0 issue "amazon.com"` once you've confirmed which CAs Vercel + Fly use; otherwise leave unset and any CA can issue.

---

## Verification

After any change, verify from a non-cached resolver:

```bash
dig +short NS tensorcraft.app           # → ns{1,2}.vercel-dns.com.
dig +short A tensorcraft.app            # Vercel-issued anycast IPs
dig +short CNAME api.tensorcraft.app    # → <fly-app>.fly.dev.
dig +short TXT tensorcraft.app          # → SPF + Kit DKIM
dig +short TXT _dmarc.tensorcraft.app   # → DMARC policy
```

For email auth specifically, send a test message and check the `Authentication-Results:` header at the receiver — `spf=pass`, `dkim=pass`, `dmarc=pass` are the three you want.

---

## Rollback

If a record change breaks production:

1. **Revert via registrar UI** — most registrars keep prior values for at least 24 h.
2. **TTL exposure:** records above use 300 s TTL specifically so a bad change clears within 5 min.
3. **Apex emergency:** if `ns1/ns2.vercel-dns.com` ever go dark, swap to `1.1.1.1` parking at the registrar to at least show a maintenance notice while routing is restored.

---

## Open TODOs (must close before §B9 ticks ✓)

- [ ] Fill in registrar name + confirm 2FA + auto-renewal.
- [ ] Capture Kit-supplied DKIM key value here (or link to the Kit dashboard page that holds it).
- [ ] Confirm `<fly-app>.fly.dev` host for `api.` CNAME — currently a placeholder.
- [ ] Decide on CAA records and add them before issuing live-mode Stripe certs.
- [ ] Set calendar reminder 60 days before domain expiry.
