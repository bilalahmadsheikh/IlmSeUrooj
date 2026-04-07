import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        '[Supabase Server] Missing env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.'
    );
}

// ── Network-error sentinel ──────────────────────────────────────
// Returned by getUser() when Supabase is unreachable (DNS failure, timeout, etc.)
// so route handlers can return 503 instead of the misleading 401.
export const SUPABASE_UNAVAILABLE = Symbol('SUPABASE_UNAVAILABLE');
type UserResult = Awaited<ReturnType<SupabaseClient['auth']['getUser']>>['data']['user'];

// 5-second timeout fetch wrapper — prevents a single DNS failure from blocking
// the route handler for 7+ seconds while the OS exhausts its resolver retry budget.
// Uses AbortController instead of AbortSignal.timeout() to avoid Node.js logging
// a verbose DOMException dump for every timeout.
function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error('Request timeout after 5s')), 5000);
    return fetch(input, { ...init, signal: controller.signal })
        .finally(() => clearTimeout(timer));
}

/**
 * Creates a Supabase client for public/anonymous access (server-side).
 */
export function createPublicClient() {
    return createClient(supabaseUrl!, supabaseAnonKey!, {
        global: { fetch: fetchWithTimeout },
    });
}

/**
 * Extracts and validates the Bearer JWT from an Authorization header.
 * Returns null if the header is missing, malformed, or suspiciously short.
 */
function extractBearerToken(req: NextRequest): string | null {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return null;

    // Must start with "Bearer " (7 chars) followed by an actual token
    if (!authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7).trim();

    // JWTs are always at least 36 chars; reject empty or obviously invalid values
    if (token.length < 36) return null;

    return token;
}

/**
 * Creates a Supabase client authenticated with the user's JWT from the request.
 * Used in API routes to enforce RLS policies.
 * Returns null if the token is missing or malformed.
 */
export function createAuthClient(req: NextRequest) {
    const token = extractBearerToken(req);
    if (!token) return null;

    return createClient(supabaseUrl!, supabaseAnonKey!, {
        global: {
            fetch: fetchWithTimeout,
            headers: { Authorization: `Bearer ${token}` },
        },
    });
}

/**
 * Helper to return a 401 JSON response.
 */
export function unauthorizedResponse() {
    return Response.json(
        { error: 'Unauthorized — valid Bearer token required' },
        { status: 401 }
    );
}

/**
 * Helper to return a 503 JSON response when Supabase itself is unreachable.
 */
export function supabaseUnavailableResponse() {
    return Response.json(
        { error: 'Auth service temporarily unavailable — try again in a moment' },
        { status: 503 }
    );
}

/**
 * Gets the authenticated user from a Supabase client.
 * Returns the user on success, null on auth failure, or SUPABASE_UNAVAILABLE
 * when the Supabase host cannot be reached (DNS failure, timeout, etc.).
 *
 * Route handlers should check for SUPABASE_UNAVAILABLE and return 503 so callers
 * receive a meaningful error instead of a misleading 401.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getUser(client: SupabaseClient<any, any, any>): Promise<UserResult | null | typeof SUPABASE_UNAVAILABLE> {
    try {
        const { data: { user }, error } = await client.auth.getUser();
        if (error) {
            // A missing/malformed status (0 or undefined) indicates a network-level failure.
            // Supabase wraps DNS and fetch errors inside AuthError with status 0.
            const isNetworkErr = !error.status
                || (error as { cause?: { code?: string } }).cause?.code === 'ENOTFOUND'
                || (error as { cause?: { code?: string } }).cause?.code === 'ECONNREFUSED';
            if (isNetworkErr) return SUPABASE_UNAVAILABLE;
            return null;
        }
        return user ?? null;
    } catch {
        // Thrown when fetch itself fails (timeout, abort, DNS) before Supabase can respond.
        return SUPABASE_UNAVAILABLE;
    }
}
