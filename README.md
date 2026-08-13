# Keyplex — Multi-income homes. Built to perform.

An investor-grade platform for **co-living, dual key and rooming house & land packages** across
Victoria and South Australia. Built to beat generic listing sites on transparency, speed and trust.

**Live site:** https://arshdeep2705.github.io/keyplex/
**Admin panel:** https://arshdeep2705.github.io/keyplex/admin

## What makes it different

- **Transparent pricing** — full price + land/build split on every card; no "enquire for price".
- **Ungated designed PDF brochures** — auto-generated per package, always up to date (4-page branded A4, not a webpage dump).
- **Per-listing cashflow modeller** — deposit, rate, vacancy, honest 15% co-living management fees, VIC/SA stamp duty (land-only on two-part contracts), and a 10-year equity + cashflow projection chart.
- **Compliance mapped per listing** — VIC rooming house triggers (4+ occupants), Clause 52.23 envelope checks (≤300 m² / ≤9 bedrooms / ≤12 residents), SA designated rooming house rules (5+ persons), NDIS/SDA honesty framework.
- **Finance readiness** — flags specialist lending (60–70% LVR) before it kills a deal.
- **SMSF-ready filtering** — single-part contract stock labelled for SMSF buyers.
- **Strategy comparison** — co-living vs dual key vs standard H&L side by side, up to 3 packages.
- **The 1-minute package builder** — pick a strategy type (smart defaults + preset inclusions auto-load), type a suburb and price, pick photos, hit publish. Title, slug, description, highlights, yield, duty and the brochure are generated automatically.
- **Two-step lead capture** — contact first (never lose the lead), investor qualifiers after (SMSF status, deposit, timeframe).

## Stack

- **Frontend:** Vite + React 19 + TypeScript + Tailwind CSS v4 + Motion
- **Backend:** Supabase (Postgres + RLS, Auth, Storage) — tables prefixed `kp_`
- **PDF:** @react-pdf/renderer (client-side, code-split)
- **Hosting:** GitHub Pages via Actions

## Local development

```bash
npm install
npm run dev
```

The Supabase URL + anon key are public client credentials (all access is enforced by
Row Level Security). Override with `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` env vars if needed.

## Admin

Sign in at `/admin`. Access is granted by membership in the `kp_admins` table — add an
auth user's UID there to make them an admin.

---

*All projected rents, yields and returns shown by the platform are estimates, not guarantees.
General information only — not financial advice.*
