import { NextRequest } from 'next/server';
import { createAuthClient, unauthorizedResponse, getUser } from '@/lib/supabase';

/**
 * PATCH /api/applications/[id]
 * Updates an existing application (status, confirmation number, etc.)
 * Only the owning student can update their application (enforced by RLS).
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = createAuthClient(req);
    if (!supabase) return unauthorizedResponse();

    const user = await getUser(supabase);
    if (!user) return unauthorizedResponse();

    const { id } = await params;
    const body = await req.json();

    // Only allow updating specific fields
    const allowedFields = [
        'status',
        'portal_username',
        'portal_password',
        'confirmation_number',
        'program_applied',
        'remembered_answers',
        'error_message',
        'submitted_at',
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
        if (body[field] !== undefined) {
            updates[field] = body[field];
        }
    }

    if (Object.keys(updates).length === 0) {
        return Response.json(
            { error: 'No valid fields to update' },
            { status: 400 }
        );
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
        .from('applications')
        .update(updates)
        .eq('id', id)
        .eq('student_id', user.id) // Double-check ownership
        .select()
        .single();

    if (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
        return Response.json(
            { error: 'Application not found or access denied' },
            { status: 404 }
        );
    }

    return Response.json({ application: data });
}
