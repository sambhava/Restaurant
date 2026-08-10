import { timingSafeEqual } from "node:crypto";

/**
 * Admin gate for the activation screens.
 *
 * A single shared token, checked in constant time. This is deliberately modest:
 * it guards an internal screen used by one or two people, and the alternative
 * (a second user system with its own roles) is more surface area than the job
 * needs. If the team grows, replace this with Firebase custom claims.
 */

const HEADER = "x-admin-token";

function constantTimeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  // timingSafeEqual throws on length mismatch, which would itself leak length.
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Returns null when authorised, or a reason to refuse. */
export function checkAdminToken(request: Request): string | null {
  const expected = process.env.ADMIN_TOKEN;

  if (!expected || expected.length < 24) {
    // Fail closed. An unset token must not mean "let everyone in".
    return "Admin access is not configured on the server.";
  }

  const provided = request.headers.get(HEADER);
  if (!provided) return "Missing admin token.";
  if (!constantTimeEqual(provided, expected)) return "Invalid admin token.";

  return null;
}

export const ADMIN_TOKEN_HEADER = HEADER;
