import { NextRequest } from 'next/server';
import { createAuthClient, unauthorizedResponse, getUser } from '@/lib/supabase';

export async function GET(req: NextRequest) {
    const supabase = createAuthClient(req);
    if (!supabase) return unauthorizedResponse();
    const user = await getUser(supabase);
    if (!user) return unauthorizedResponse();

    const { data, error } = await supabase
        .from('user_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false });

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ documents: data });
}

export async function POST(req: NextRequest) {
    const supabase = createAuthClient(req);
    if (!supabase) return unauthorizedResponse();
    const user = await getUser(supabase);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const { data, error } = await supabase
        .from('user_documents')
        .insert({ ...body, user_id: user.id })
        .select()
        .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ document: data }, { status: 201 });
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
        .from('user_documents')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true });
}
