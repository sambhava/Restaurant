# Sit-N-Order — Launch Checklist

The code is written and verified. These are the things only you can do, ordered
so each step works when you reach it. **Steps 1–5 must happen before you take
money from anyone.**

---

## ⛔ Do step 1 today, before anything else

Your database is currently **readable and writable by anyone on the internet**
who knows your project ID. The old rules said `allow read, write: if true` on
every collection — including the one that stored passwords in plain text. The
replacement is written and sitting in your repo, but it is not live until you
deploy it.

---

# Blocking — before you sell to anyone

## 1. Deploy the new database rules

You are already logged in as `sambhavajain512@gmail.com` and the project is
`restaurant-qr-dev`, so this is one command:

```
cd E:\restuarant
firebase deploy --only firestore:rules
```

Then in the Firebase console, confirm the Rules tab shows the new version with
`allow read, write: if false` at the bottom.

**Why it matters:** until this runs, anyone can read every order, every rupee of
revenue, and every password in your database. Nothing else on this list matters
more.

## 2. Treat old passwords as compromised

Because the database was open, assume every password in the old `users_auth`
collection has leaked.

- If you reused any of those passwords anywhere else — email, banking, anything —
  **change them there now.**
- Everyone who had an account gets a new password in step 3.
- Do **not** delete `users_auth` yet. Step 3 reads it.

## 3. Move existing accounts to the new system

Old accounts have no `users/{uid}` document, so they cannot sign in at all until
you provision them. The script does it. It needs your service-account keys first
— do step 4, then come back here.

```
# See what it will do, without changing anything
node scripts/migrate-to-multitenant.mjs --dry-run

# Then, when the plan looks right
node scripts/migrate-to-multitenant.mjs
```

It prints a temporary password per account. Send each privately to its owner and
tell them to change it immediately via **Forgot password?** on the sign-in page.

**One thing to check:** if more than one restaurant was sharing the old `rest-2`
tenant, their orders are genuinely mixed together and no script can separate them
reliably. The script warns you if it detects this. The first account inherits the
existing data; any others start empty.

Once everyone can sign in and sees their own data, **then** delete `users_auth`
in the Firebase console.

## 4. Set up the website's environment file

```
cd E:\restuarant\sit-n-order-web
copy .env.example .env.local
```

Then fill it in. Four groups:

**Firebase, browser side** — Firebase console → Project settings → "Your apps" →
SDK setup and configuration. You already have these values in
`restaurant-dashboard\.env`; same project, just renamed from `VITE_` to
`NEXT_PUBLIC_`.

**Firebase, server side** — Firebase console → Project settings → *Service
accounts* tab → Generate new private key. Downloads a JSON file. Copy three
values out of it: `project_id`, `client_email`, `private_key`. Keep the quotes
around the private key.

**Email** — sign up free at resend.com, verify your domain, create an API key.
Without this, signups still save; the confirmation emails just don't send.

**Admin token** — guards your activation screen:

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Never commit `.env.local`.** Your `.gitignore` already covers it — I checked.
The service-account key bypasses every security rule you just deployed.

## 5. Fill in your business details

All in one file: `sit-n-order-web\src\lib\site.ts`. Change it there and it
propagates everywhere, including into the legal documents.

| Field | What to put |
|---|---|
| `url` | your real domain |
| `email`, `phone`, `whatsapp` | real contact details |
| `legal.entityName` | e.g. "Sambhav Jain, sole proprietor, trading as Sit-N-Order" |
| `legal.address` | full business address |
| `legal.jurisdictionCity` | whose courts govern a dispute |
| `legal.grievanceOfficer` | name + email — required by law |
| `legal.gstin` | leave `null` until registered |
| `plan.priceMonthly` | currently ₹1,499 as a placeholder |
| `dashboardUrl` | where your dashboard is deployed |

Then open every page under `/legal/` and check no **highlighted amber
placeholders** remain. Anything unfilled renders visibly, on purpose, so you
can't ship it by accident.

---

# Before your first paying customer

## 6. Get the legal documents reviewed

The seven documents are solid templates written specifically for what your app
does with data. **They are not legal advice.** A lawyer or CA should read at
least the Terms, the Privacy Policy, and the Refund Policy.

Three things to decide deliberately:

- The liability cap in Terms §8 — currently limited to what the customer paid you
  in 12 months.
- The refund terms — currently no mid-month pro-rata refunds.
- The support promise — currently email + WhatsApp, same working day, 99% uptime
  as a stated goal rather than a guarantee.

## 7. Sort out the business basics

- **Entity** — sole proprietorship is fine to start, and the documents are written
  for it. No registration needed to begin.
- **Bank account** for receiving payment, ideally in the business name. Banks
  usually want GST or Udyam/MSME registration for a current account.
- **GST registration** — mandatory above ₹20 lakh turnover (₹10 lakh in some
  states). SaaS is 18%. Get a GSTIN before a customer demands a GST invoice.
- **Invoice numbering** — sequential, kept 8 years.

**Don't over-engineer this yet.** Incorporating a Pvt Ltd costs ₹10–15k plus
~₹25k/year in compliance. Do it when you have paying customers and need
Razorpay, not before.

## 8. Test the whole flow yourself

```
cd E:\restuarant\sit-n-order-web
npm run dev
```

Then walk it end to end as if you were a customer:

1. Submit the signup form at `/signup`.
2. Check Firestore — the `signups` document should record each consent
   **separately, with its own timestamp**.
3. Confirm both emails arrive (acknowledgement to them, notification to you).
4. Try signing in as that pending account. You must get "your account isn't
   active yet" — never a dashboard.
5. Activate it at `/admin/activations`.
6. Sign in with the temporary password. The dashboard must be **empty**, not
   showing another restaurant's data.
7. Add a menu item, print a table QR, scan it with your phone, place a real
   order, watch it hit the kitchen display, print the bill.

---

# Known gaps — found but not changed

## 9. Storage rules let any signed-in user write images

`storage.rules` allows *any* authenticated user to upload to `menuImages/` —
including anonymous diners, since the customer app signs them in anonymously.
Size and content-type are capped, so damage is limited to junk files, but it
isn't right. Lower priority than the Firestore rules because the app currently
stores menu images as base64 in Firestore, not in Storage, so this path is barely
used. Worth tightening when you move images to Storage.

## 10. Watch for a missing database index

`firestore.indexes.json` is empty, and the Analytics page runs a query combining
a date filter with ordering. If it errors, Firebase prints a link in the browser
console that creates the index in one click. Then:

```
firebase deploy --only firestore:indexes
```

## 11. Menu images bloat the database

Images are compressed and stored as base64 text inside Firestore documents rather
than in Firebase Storage. It works, but every menu read drags the image data along
with it, and menus get slower as they grow. Worth moving before you have many
customers.

## 12. The QR token secret is in the client bundle

The signing secret in `tokenUtils.js` is hardcoded and shipped to browsers. It
stops casual URL tampering and nothing more — anyone who reads the bundle can
forge a token for any table. Practical impact is low, since table numbers aren't
secret and the database rules are what actually protect the data. Just don't
extend this scheme to anything that matters.

---

# When you're ready — deploying

## 13. Push the site live

Vercel CLI is already installed and you've used it for the other apps.

```
cd E:\restuarant\sit-n-order-web
vercel --prod
```

Then in the Vercel dashboard, add every variable from your `.env.local` to the
project's environment settings — local files don't travel with the deploy.

Finally: point your domain, confirm HTTPS, and check that `dashboardUrl` in
`site.ts` matches where the dashboard actually lives. Sign in on the live site
once to confirm the handoff works.

---

# Reference — where things are

| What | Where |
|---|---|
| All business config — name, price, contacts, legal identity | `sit-n-order-web/src/lib/site.ts` |
| The seven legal documents, as editable Markdown | `sit-n-order-web/src/content/legal/` |
| Database security rules | `firestore.rules` |
| Migration script for existing accounts | `scripts/migrate-to-multitenant.mjs` |
| The activation function (the Razorpay seam) | `sit-n-order-web/src/lib/activation.ts` |
| Legal placeholder checklist | `LEGAL-CHECKLIST.md` |

Legal documents are templates specific to your product, not legal advice — have
them reviewed before taking real money. Steps 1–3 concern a live security
exposure and shouldn't wait.
