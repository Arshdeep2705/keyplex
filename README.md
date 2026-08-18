# AU Build Hub — House & land, packaged in minutes.

A house & land package platform for a home builder's sales operation across Victoria and South
Australia. The admin enters the specs — beds, baths, land, price — and a complete package goes live
in under a minute: auto-generated title, description, **parametric concept floorplan**, and a designed
PDF brochure.

**Live site:** https://aubuildhub.com.au/
**Admin panel:** https://aubuildhub.com.au/admin

## What makes it different

- **Auto-generated concept floorplans** — a deterministic layout engine turns beds/baths/garage/study/alfresco/storeys/area/frontage into a dimensioned architectural concept plan with room schedule, flip/mirror toggle and 4 layout variants. Rendered live on the site AND inside the PDF brochure. No builder site or portal does this.
- **Full transparent pricing** — total fixed price + land/build split on every card; no "from $X*" games. Fixed site costs messaging throughout.
- **Repayment-first presentation** — "From $X/week" on every card (10% deposit, 5.90% p.a., 30yr P&I), with a full calculator per listing.
- **Government incentives engine** — 2026 VIC/SA first-home-buyer rules computed per package: $10k/$15k FHOG, VIC duty exemption ≤$600k dutiable (land only on two-part contracts), SA duty abolished for new-build FHBs, Home Guarantee Scheme 5%-deposit eligibility, and a "total government savings" figure.
- **Two-part contract duty logic** — duty on the land component only, compared against established-home duty.
- **Trust module** — deposit caps (5%), DBI $300k VIC / BII $250k SA insurance, statutory warranties, real title-date tracking.
- **Designed 5-page PDF brochure** — cover, floorplan + room schedule, package summary, inclusions, finance & next steps. Regenerates automatically on every change.
- **The 1-minute package builder** — type a design name, suburb and two prices, toggle study/alfresco, pick photos, hit publish. Everything else is generated.
- **Two-step lead capture** — contact first (never lose the lead), buyer qualifiers after.

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
