import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        '[Supabase Server] Missing env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.'
    );
}

/**
 * Creates a Supabase client for public/anonymous access (server-side).
 */
export function createPublicClient() {
    return createClient(supabaseUrl!, supabaseAnonKey!);
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
            headers: {
                Authorization: `Bearer ${token}`,
            },
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
 * Gets the authenticated user from a Supabase client.
 * Returns null if no valid session.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getUser(client: SupabaseClient<any, any, any>) {
    const { data: { user }, error } = await client.auth.getUser();
    if (error || !user) return null;
    return user;
}
