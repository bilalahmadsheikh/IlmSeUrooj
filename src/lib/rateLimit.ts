/**
 * Simple in-memory rate limiter for Next.js API routes.
 * Keyed by user ID (from JWT). Resets per window.
 *
 * Usage:
 *   const limited = rateLimit(userId, 'profile', 10, 60_000); // 10 req/min
 *   if (limited) return Response.json({ error: 'Too many requests' }, { status: 429 });
 */

interface Bucket {
  count: number;
  resetAt: number;
}

// Single map shared across all requests in the same serverless instance.
// In edge/serverless environments each cold start gets a fresh map —
// that's acceptable; this guards against burst abuse, not distributed attacks.
const buckets = new Map<string, Bucket>();

/**
 * Returns true if the request should be rate-limited (rejected).
 *
 * @param userId    Unique user identifier (auth.uid)
 * @param endpoint  Short label for the endpoint, e.g. 'profile', 'applications'
 * @param maxReqs   Max requests allowed in the window
 * @param windowMs  Window duration in milliseconds
 */
export function rateLimit(
    userId: string,
    endpoint: string,
    maxReqs: number,
    windowMs: number
): boolean {
    const key = `${userId}:${endpoint}`;
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || now >= bucket.resetAt) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return false; // not limited
    }

    bucket.count++;
    if (bucket.count > maxReqs) return true; // limited
    return false;
}
