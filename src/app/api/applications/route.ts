import { NextRequest } from 'next/server';
import { createAuthClient, unauthorizedResponse, getUser } from '@/lib/supabase';

/**
 * GET /api/applications
 * Returns all applications for the authenticated user.
 */
export async function GET(req: NextRequest) {
    const supabase = createAuthClient(req);
    if (!supabase) return unauthorizedResponse();

    const user = await getUser(supabase);
    if (!user) return unauthorizedResponse();

    const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ applications: data });
}

/**
 * POST /api/applications
 * Creates a new application record for the authenticated user.
 * Body: { university_slug, university_name, portal_domain, program_applied? }
 */
export async function POST(req: NextRequest) {
    const supabase = createAuthClient(req);
    if (!supabase) return unauthorizedResponse();

    const user = await getUser(supabase);
    if (!user) return unauthorizedResponse();

    const body = await req.json();

    // Validate required fields
    const required = ['university_slug', 'university_name', 'portal_domain'];
    for (const field of required) {
        if (!body[field]) {
            return Response.json(
                { error: `Missing required field: ${field}` },
                { status: 400 }
            );
        }
    }

    const { data, error } = await supabase
        .from('applications')
        .insert({
            student_id: user.id,
            university_slug: body.university_slug,
            university_name: body.university_name,
            portal_domain: body.portal_domain,
            program_applied: body.program_applied || null,
            status: 'pending',
        })
        .select()
        .single();

    if (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ application: data }, { status: 201 });
}
