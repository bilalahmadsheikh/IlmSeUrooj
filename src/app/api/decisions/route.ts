import { NextRequest } from 'next/server';
import { createAuthClient, unauthorizedResponse, getUser } from '@/lib/supabase';

export async function GET(req: NextRequest) {
    const supabase = createAuthClient(req);
    if (!supabase) return unauthorizedResponse();
    const user = await getUser(supabase);
    if (!user) return unauthorizedResponse();

    const { data, error } = await supabase
        .from('admission_decisions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ decisions: data });
}

export async function POST(req: NextRequest) {
    const supabase = createAuthClient(req);
    if (!supabase) return unauthorizedResponse();
    const user = await getUser(supabase);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const { university_id, university_name, program_name, status, application_date, notes, is_final_choice } = body;
    const { data, error } = await supabase
        .from('admission_decisions')
        .insert({ user_id: user.id, university_id, university_name, program_name, status, application_date, notes, is_final_choice })
        .select()
        .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ decision: data }, { status: 201 });
}

export async function PUT(req: NextRequest) {
    const supabase = createAuthClient(req);
    if (!supabase) return unauthorizedResponse();
    const user = await getUser(supabase);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const { id, university_id, university_name, program_name, status, application_date, notes, is_final_choice } = body;
    if (!id) return Response.json({ error: 'Missing id' }, { status: 400 });

    // If marking as final choice, unmark all others first
    if (is_final_choice === true) {
        await supabase
            .from('admission_decisions')
            .update({ is_final_choice: false })
            .eq('user_id', user.id);
    }

    const { data, error } = await supabase
        .from('admission_decisions')
        .update({ university_id, university_name, program_name, status, application_date, notes, is_final_choice, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ decision: data });
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
        .from('admission_decisions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true });
}
