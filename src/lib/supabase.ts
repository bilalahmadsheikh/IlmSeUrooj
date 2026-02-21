import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Creates a Supabase client for public/anonymous access.
 */
export function createPublicClient() {
    return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Creates a Supabase client authenticated with the user's JWT from the request.
 * Used in API routes to enforce RLS policies.
 */
export function createAuthClient(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
        return null;
    }

    return createClient(supabaseUrl, supabaseAnonKey, {
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
