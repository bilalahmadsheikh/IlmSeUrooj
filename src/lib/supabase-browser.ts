import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
    throw new Error(
        '[Supabase] Missing environment variables.\n' +
        'Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
    );
}

// Browser-side singleton — one client instance for the entire app lifetime.
// Supabase internally deduplicates auth listeners, so this avoids duplicate
// subscriptions when multiple components call createClient with the same keys.
let _client: SupabaseClient | null = null;

export function getBrowserClient(): SupabaseClient {
    if (!_client) {
        _client = createClient(url, anonKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
            },
        });
    }
    return _client;
}
