/**
 * Pushes every value from .env.local into the linked Vercel project.
 *
 * Hand-copying these through the web UI is slow and error-prone — the Firebase
 * private key alone is ~1,700 characters and a single mangled newline breaks
 * authentication in a way that is annoying to debug.
 *
 * Prerequisites: `vercel login` and `vercel link` must already have run.
 *
 *   node scripts/push-env-to-vercel.mjs --dry-run   # show what would be sent
 *   node scripts/push-env-to-vercel.mjs             # actually send it
 *
 * Values are never printed — only names and lengths.
 */

import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";

const DRY_RUN = process.argv.includes("--dry-run");

if (!existsSync(".env.local")) {
  console.error("No .env.local here. Run this from sit-n-order-web/.");
  process.exit(1);
}

if (!existsSync(".vercel/project.json")) {
  console.error("This directory is not linked to a Vercel project yet.");
  console.error("Run `vercel link` (or `vercel --prod` once) first.");
  process.exit(1);
}

// Parse .env.local, honouring quoted values that contain '='.
const vars = [];
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
  if (!m) continue;
  let value = m[2].trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  if (value === "") continue; // skip unset vars like RESEND_API_KEY
  vars.push({ name: m[1], value });
}

console.log();
console.log(DRY_RUN ? "DRY RUN - nothing will be sent" : "Pushing to Vercel (production)");
console.log("=".repeat(60));
console.log();

for (const { name, value } of vars) {
  console.log(`${name}  (${value.length} chars)`);

  if (DRY_RUN) continue;

  try {
    // Remove any existing value first — `vercel env add` refuses to overwrite.
    try {
      execFileSync("vercel", ["env", "rm", name, "production", "--yes"], {
        stdio: "pipe",
        shell: true,
      });
    } catch {
      // Not previously set. Expected on a first run.
    }

    // The value arrives on stdin, so it never appears in the process list or
    // shell history — which matters for the private key and admin token.
    execFileSync("vercel", ["env", "add", name, "production"], {
      input: value,
      stdio: ["pipe", "pipe", "pipe"],
      shell: true,
    });

    console.log(`  -> set`);
  } catch (err) {
    console.log(`  -> FAILED: ${err.message.split("\n")[0]}`);
  }
}

console.log();
console.log("=".repeat(60));
if (DRY_RUN) {
  console.log("Re-run without --dry-run to apply.");
} else {
  console.log("Done. Redeploy for these to take effect:  vercel --prod");
}
console.log();
