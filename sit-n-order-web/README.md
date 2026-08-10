# Sit-N-Order — marketing site

The public site for the Sit-N-Order QR ordering product: marketing pages,
signup with consent capture, login, the activation queue, and the legal
documents.

Sibling apps in this repo:

| Directory | What it is |
|---|---|
| `restaurant-customer` | The menu diners see after scanning a table QR |
| `restaurant-dashboard` | Where owners and staff run the floor |
| `sit-n-order-web` | This — the marketing site and front door |

## Running it

```bash
npm install
cp .env.example .env.local   # then fill it in
npm run dev
```

Without `.env.local` the marketing and legal pages render fine; signup, login,
and the admin screen will fail, because they need Firebase.

## How access works

Deliberately manual. Nobody gets in by paying a gateway:

1. A restaurant submits `/signup`. That writes a `signups` document with
   `status: "pending"` and emails an acknowledgement. **No account is created.**
2. You confirm the payment landed in your bank.
3. You open `/admin/activations`, review the submission, and click Activate.
4. Activation generates a tenant id, creates the Firebase Auth user, writes
   `users/{uid}`, and emails a temporary password.
5. They sign in at `/login`, which hands off to the dashboard.

`src/lib/activation.ts` is deliberately free of anything request-specific. When
you are ready for Razorpay, a webhook calls `activateSignup()` and nothing else
changes.

## Configuration

**Every business-specific value lives in `src/lib/site.ts`** — name, price,
domain, contact details, legal identity, support commitments. Change it there,
not in the pages.

Legal documents are Markdown in `src/content/legal/`. `[TOKENS]` in them are
substituted from `site.ts` at render time. A token whose value is itself still
an unfilled placeholder renders as a **highlighted mark** on the page, so it
cannot ship unnoticed.

## Structure

```
src/
  app/
    page.tsx                    Home
    features/                   Full feature detail
    pricing/                    Single plan, set as a printed receipt
    signup/                     4-step form with separate consents
    login/                      Handles the awaiting-activation state
    thank-you/                  Post-signup acknowledgement
    contact/                    Includes the DPDP grievance officer block
    legal/[slug]/               Renders src/content/legal/*.md
    admin/activations/          The activation queue
    api/signup/                 Validates and records a signup
    api/admin/signups/          Lists, activates, rejects
  components/
    illustrations/              Monoline SVG scenes, hand-authored
    SignupForm, LoginForm, ActivationsClient, SiteHeader, SiteFooter
  lib/
    site.ts                     ← all business config
    signup-schema.ts            Zod schema, shared by client and server
    activation.ts               The Razorpay seam
    firebase-client.ts          Browser SDK
    firebase-admin.ts           Server SDK
    admin-auth.ts               Constant-time token check
    email.ts                    Resend templates
  content/legal/                Seven documents, as Markdown
```

## Design

Tokens carry over from the dashboard so the site and the app read as one brand:
slate `#0F172A`, amber `#F59E0B`, cream `#F8FAFC`.

Three type roles, each with a job: **Poppins** for display, **Inter** for body,
**JetBrains Mono** for anything that appears on printed paper — table numbers,
prices, order ids.

Illustrations are hand-authored inline SVG, one continuous line each, drawn on
scroll via `IntersectionObserver`. No illustration library, no raster images.
All motion sits behind `prefers-reduced-motion`.

Amber is a stroke and fill colour only — at 2.1:1 on white it fails contrast for
text. Use `--color-amber-deep` (5.3:1) when amber must be read.

## Before launching

See **`../LEGAL-CHECKLIST.md`**. It has blocking items, including deploying
`firestore.rules` — the previous rules allowed public read and write of the
entire database.
