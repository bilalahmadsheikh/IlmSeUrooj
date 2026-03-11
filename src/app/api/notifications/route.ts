import { NextRequest } from 'next/server';
import { createAuthClient, unauthorizedResponse, getUser } from '@/lib/supabase';

export async function GET(req: NextRequest) {
    const supabase = createAuthClient(req);
    if (!supabase) return unauthorizedResponse();
    const user = await getUser(supabase);
    if (!user) return unauthorizedResponse();

    const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ preferences: data });
}

export async function PUT(req: NextRequest) {
    const supabase = createAuthClient(req);
    if (!supabase) return unauthorizedResponse();
    const user = await getUser(supabase);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    delete body.id;
    delete body.user_id;

    const { data, error } = await supabase
        .from('notification_preferences')
        .upsert(
            { ...body, user_id: user.id, updated_at: new Date().toISOString() },
            { onConflict: 'user_id' }
        )
        .select()
        .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ preferences: data });
}
