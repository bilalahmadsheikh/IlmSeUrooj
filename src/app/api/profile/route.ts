import { NextRequest } from 'next/server';
import { createAuthClient, unauthorizedResponse, supabaseUnavailableResponse, getUser, SUPABASE_UNAVAILABLE } from '@/lib/supabase';
import { encryptPassword, decryptPassword } from '@/lib/encryption';
import { rateLimit } from '@/lib/rateLimit';

/**
 * GET /api/profile
 * Returns the authenticated user's profile.
 */
export async function GET(req: NextRequest) {
    const supabase = createAuthClient(req);
    if (!supabase) return unauthorizedResponse();

    const user = await getUser(supabase);
    if (user === SUPABASE_UNAVAILABLE) return supabaseUnavailableResponse();
    if (!user) return unauthorizedResponse();

    // 30 reads per minute per user — well above any legitimate use
    if (rateLimit(user.id, 'profile:get', 30, 60_000))
        return Response.json({ error: 'Too many requests' }, { status: 429 });

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error && error.code === 'PGRST116') {
        // Profile doesn't exist yet — return empty profile scaffold
        return Response.json({ profile: null, message: 'Profile not created yet' });
    }

    if (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }

    // Decrypt portal_password before returning to client
    if (data?.portal_password) {
        data.portal_password = decryptPassword(data.portal_password);
    }

    return Response.json({ profile: data });
}

/**
 * PUT /api/profile
 * Creates or updates the authenticated user's profile.
 * Uses upsert so it works for both first-time creation and updates.
 */
export async function PUT(req: NextRequest) {
    const supabase = createAuthClient(req);
    if (!supabase) return unauthorizedResponse();

    const user = await getUser(supabase);
    if (user === SUPABASE_UNAVAILABLE) return supabaseUnavailableResponse();
    if (!user) return unauthorizedResponse();

    // 10 writes per minute per user
    if (rateLimit(user.id, 'profile:put', 10, 60_000))
        return Response.json({ error: 'Too many requests' }, { status: 429 });

    const body = await req.json();

    // Remove fields that shouldn't be client-set
    delete body.id;
    delete body.created_at;

    // Encrypt portal_password before storing
    if (body.portal_password) {
        body.portal_password = encryptPassword(body.portal_password);
    }

    const { data, error } = await supabase
        .from('profiles')
        .upsert(
            {
                id: user.id,
                ...body,
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
        )
        .select()
        .single();

    if (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }

    // Decrypt before returning so client always sees plaintext
    if (data?.portal_password) {
        data.portal_password = decryptPassword(data.portal_password);
    }

    return Response.json({ profile: data });
}
