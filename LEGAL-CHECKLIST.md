# Before you launch — checklist

Everything here must be done before you take money from a real customer. Items
marked **BLOCKING** are not optional.

The legal documents are professional templates written for your specific
product. **They are not legal advice.** Have a lawyer or CA review them before
you take real money — particularly the Terms, the Refund Policy, and anything
touching GST.

---

## 1. BLOCKING — deploy the new database rules

The rules that were in this repo before this work allowed **anyone on the
internet** to read and write your entire database, including the collection
that stored passwords in plain text. Until you deploy the replacement, that is
still live.

```bash
firebase deploy --only firestore:rules
```

Then, in order:

- [ ] **Deploy the rules** (command above).
- [ ] **Treat every existing password as compromised.** Ask current users to
      reset. If you reused any of them elsewhere, change those too.
- [ ] **Delete the `users_auth` collection** from the Firebase console once
      logins work. The new rules make it unreachable, but the data is still
      sitting there.
- [ ] **Verify isolation**: create two test accounts, sign in as each, and
      confirm neither can see the other's menu, orders, or revenue.

## 2. BLOCKING — existing accounts need provisioning

Accounts that worked under the old system have no `users/{uid}` document, so
they cannot sign in. For each existing customer, create one via the activation
flow, or write it directly with the Admin SDK:

```
users/{uid} = {
  email, restaurantId, restaurantName,
  role: "owner", status: "active", createdAt
}
```

- [ ] Every existing customer provisioned and able to sign in.
- [ ] Their existing data moved under their own `restaurantId` (it currently
      lives under `rest-2`).

## 3. BLOCKING — fill in your details

All in `src/lib/site.ts`. Anything left unfilled renders as a **highlighted
placeholder** on the live legal pages, so it cannot ship unnoticed — but check
anyway.

- [ ] `url` — your real domain
- [ ] `email`, `supportEmail`, `phone`, `whatsapp`
- [ ] `legal.entityName` — your full legal name, e.g. "Asha Rao, sole
      proprietor, trading as Sit-N-Order"
- [ ] `legal.address` — full business address
- [ ] `legal.jurisdictionCity` / `jurisdictionState` — whose courts govern
- [ ] `legal.grievanceOfficer` — name and email (**required by the DPDP Act**)
- [ ] `legal.gstin` — leave `null` until registered; setting it switches on the
      GST clauses in the Terms and adds GST to the pricing receipt
- [ ] `plan.priceMonthly` — **currently a placeholder of ₹1,499**
- [ ] `dashboardUrl` — where the dashboard is deployed
- [ ] `legal.lastUpdated` — the date you finalise the documents

Then read every page at `/legal/*` and confirm no highlighted placeholders
remain.

## 4. BLOCKING — environment variables

Copy `.env.example` to `.env.local` for development, and set the same values in
Vercel for production.

- [ ] `NEXT_PUBLIC_FIREBASE_*` — from Firebase console → Project settings
- [ ] `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` —
      from a service account key. **Never commit this file.**
- [ ] `RESEND_API_KEY`, `RESEND_FROM` — from resend.com, with your domain verified
- [ ] `ADMIN_TOKEN` — at least 24 characters, generated randomly:
      `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## 5. Legal review

- [ ] A lawyer or CA has read the Terms, Privacy Policy, and Refund Policy.
- [ ] The liability cap in Terms §8 is one you can live with.
- [ ] The refund terms match what you will actually do.
- [ ] The support commitments in the SLA are ones you can meet — they are
      currently email + WhatsApp, same working day, 99% uptime as a goal.

## 6. Business setup

Decide these before your first paying customer:

- [ ] **Entity.** Sole proprietorship is fine to start. The documents are
      written for it. If you incorporate later, `entityName` and `entityType`
      change and the Terms need a re-read.
- [ ] **Bank account** for receiving payment, ideally in the business name.
- [ ] **GST registration** — mandatory above ₹20 lakh turnover (₹10 lakh in some
      states). SaaS is 18%. Get a GSTIN before a customer demands a GST invoice.
- [ ] **Invoice numbering** — sequential, and keep records for 8 years.

## 7. Test the whole flow before you launch

- [ ] Submit the signup form and confirm the `signups` document records each
      consent **separately, with its own timestamp**.
- [ ] Confirm both emails arrive — acknowledgement to the customer, notification
      to you.
- [ ] Try to sign in as a `pending` signup → must show "your account isn't
      active yet", never a dashboard.
- [ ] Activate from `/admin/activations` → tenant created, welcome email sent,
      temporary password works.
- [ ] Confirm the new tenant's dashboard is **empty**, not showing another
      restaurant's data.
- [ ] Confirm `/admin/activations` refuses access without the token.
- [ ] Run a real order end to end: scan a QR, order, watch it hit the kitchen
      display, print the bill.

## 8. Accessibility and performance

- [ ] Lighthouse ≥ 95 on performance, accessibility, and SEO for `/`,
      `/pricing`, `/signup`.
- [ ] Test on a real phone — restaurant owners will open this on mobile.
- [ ] Enable "reduce motion" in your OS and confirm the illustrations stop
      animating.
- [ ] Tab through the signup form: visible focus everywhere, every consent
      checkbox individually reachable and labelled.
- [ ] Confirm optional consents can be left unticked and the form still submits.

## 9. Known issues

- **`npm audit` reports 6 moderate vulnerabilities.** All are one transitive
  `uuid` issue inside `firebase-admin`'s Cloud Storage dependency — a code path
  this project never calls. Re-check after a `firebase-admin` upgrade.
- **Menu images are stored as base64 in Firestore**
  (`MenuManagementPage.jsx:251`), not Firebase Storage. It works, but it bloats
  documents and will slow menus down as they grow. Worth moving before you have
  many customers.
- **The QR token secret is hardcoded and shared** between both apps
  (`tokenUtils.js`). It stops casual URL tampering, nothing more. Anyone who
  reads the client bundle can forge a token for any table. Since table numbers
  are not secret, the practical impact is low — but do not use this scheme for
  anything that matters.

## 10. Deploying

```bash
# Marketing site
cd sit-n-order-web && vercel --prod

# Dashboard and customer app — deploy as you already do
```

- [ ] Environment variables set in Vercel for all three.
- [ ] Custom domains pointed and HTTPS confirmed.
- [ ] `dashboardUrl` in `site.ts` matches the real deployed dashboard.
- [ ] Sign in on the live site and confirm the handoff to the dashboard works.
