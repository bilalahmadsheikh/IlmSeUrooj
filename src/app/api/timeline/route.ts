import { NextRequest } from 'next/server';
import { createAuthClient, unauthorizedResponse, getUser } from '@/lib/supabase';

export async function GET(req: NextRequest) {
    const supabase = createAuthClient(req);
    if (!supabase) return unauthorizedResponse();
    const user = await getUser(supabase);
    if (!user) return unauthorizedResponse();

    const { data, error } = await supabase
        .from('user_timeline_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ tasks: data });
}

export async function POST(req: NextRequest) {
    const supabase = createAuthClient(req);
    if (!supabase) return unauthorizedResponse();
    const user = await getUser(supabase);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const { data, error } = await supabase
        .from('user_timeline_tasks')
        .insert({ ...body, user_id: user.id })
        .select()
        .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ task: data }, { status: 201 });
}

export async function PUT(req: NextRequest) {
    const supabase = createAuthClient(req);
    if (!supabase) return unauthorizedResponse();
    const user = await getUser(supabase);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return Response.json({ error: 'Missing task id' }, { status: 400 });

    const { data, error } = await supabase
        .from('user_timeline_tasks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ task: data });
}

export async function DELETE(req: NextRequest) {
    const supabase = createAuthClient(req);
    if (!supabase) return unauthorizedResponse();
    const user = await getUser(supabase);
    if (!user) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return Response.json({ error: 'Missing id' }, { status: 400 });

    const { error } = await supabase
        .from('user_timeline_tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true });
}
