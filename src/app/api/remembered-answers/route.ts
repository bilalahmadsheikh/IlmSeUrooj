import { NextRequest } from 'next/server';
import { createAuthClient, unauthorizedResponse, getUser } from '@/lib/supabase';

/**
 * GET /api/remembered-answers
 * Returns all remembered answers for the authenticated user.
 * Optional query param: ?label=fieldLabel to filter by field.
 */
export async function GET(req: NextRequest) {
    const supabase = createAuthClient(req);
    if (!supabase) return unauthorizedResponse();

    const user = await getUser(supabase);
    if (!user) return unauthorizedResponse();

    const label = req.nextUrl.searchParams.get('label');

    let query = supabase
        .from('remembered_answers')
        .select('*')
        .eq('student_id', user.id)
        .order('last_used_at', { ascending: false });

    if (label) {
        query = query.eq('field_label', label);
    }

    const { data, error } = await query;

    if (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ answers: data });
}

/**
 * POST /api/remembered-answers
 * Saves or updates a remembered answer.
 * Uses upsert on (student_id, field_label) so repeated saves update the value.
 * Body: { field_label: string, field_value: string }
 */
export async function POST(req: NextRequest) {
    const supabase = createAuthClient(req);
    if (!supabase) return unauthorizedResponse();

    const user = await getUser(supabase);
    if (!user) return unauthorizedResponse();

    const body = await req.json();

    if (!body.field_label || !body.field_value) {
        return Response.json(
            { error: 'Missing required fields: field_label, field_value' },
            { status: 400 }
        );
    }

    const { data, error } = await supabase
        .from('remembered_answers')
        .upsert(
            {
                student_id: user.id,
                field_label: body.field_label,
                field_value: body.field_value,
                last_used_at: new Date().toISOString(),
                use_count: 1, // Will be incremented via a future trigger if needed
            },
            { onConflict: 'student_id,field_label' }
        )
        .select()
        .single();

    if (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ answer: data }, { status: 201 });
}
