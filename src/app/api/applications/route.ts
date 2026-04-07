import { NextRequest } from 'next/server';
import { createAuthClient, unauthorizedResponse, getUser } from '@/lib/supabase';
import { rateLimit } from '@/lib/rateLimit';

// ---------------------------------------------------------------------------
// Domain validation — prevents phishing via stored portal_domain injection.
// Only accepts bare hostnames like "apply.nust.edu.pk" (no scheme, no path,
// no query string, no IP literals).
// ---------------------------------------------------------------------------
function sanitizeDomain(raw: string): string | null {
    if (!raw || typeof raw !== 'string') return null;

    // Strip accidental scheme if present
    const stripped = raw.replace(/^https?:\/\//i, '').trim();

    // Must not contain path separators, query strings, or unusual chars
    if (/[/?#@<>"'`]/.test(stripped)) return null;
    if (stripped.length < 3 || stripped.length > 253) return null;

    // Must look like a hostname (letters, digits, dots, hyphens only)
    if (!/^[a-z0-9]([a-z0-9\-\.]*[a-z0-9])?$/i.test(stripped)) return null;

    // Must have at least one dot (e.g. "nust.edu.pk")
    if (!stripped.includes('.')) return null;

    // Double-dot check (path traversal attempt)
    if (stripped.includes('..')) return null;

    return stripped.toLowerCase();
}

/**
 * GET /api/applications
 * Returns all applications for the authenticated user.
 */
export async function GET(req: NextRequest) {
    const supabase = createAuthClient(req);
    if (!supabase) return unauthorizedResponse();

    const user = await getUser(supabase);
    if (!user) return unauthorizedResponse();

    if (rateLimit(user.id, 'applications:get', 60, 60_000))
        return Response.json({ error: 'Too many requests' }, { status: 429 });

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
 * Body: { university_slug, university_name, portal_domain, program_applied?, status? }
 */
export async function POST(req: NextRequest) {
    const supabase = createAuthClient(req);
    if (!supabase) return unauthorizedResponse();

    const user = await getUser(supabase);
    if (!user) return unauthorizedResponse();

    if (rateLimit(user.id, 'applications:post', 20, 60_000))
        return Response.json({ error: 'Too many requests' }, { status: 429 });

    let body: Record<string, unknown>;
    try {
        body = await req.json();
    } catch {
        return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // Validate and sanitize required fields
    const required = ['university_slug', 'university_name', 'portal_domain'];
    for (const field of required) {
        if (!body[field]) {
            return Response.json(
                { error: `Missing required field: ${field}` },
                { status: 400 }
            );
        }
    }

    // Enforce string types and length limits
    const slug = String(body.university_slug).trim().slice(0, 80);
    const name = String(body.university_name).trim().slice(0, 200);
    const rawDomain = String(body.portal_domain).trim();

    if (!slug || !name) {
        return Response.json({ error: 'university_slug and university_name must not be empty' }, { status: 400 });
    }

    const domain = sanitizeDomain(rawDomain);
    if (!domain) {
        return Response.json(
            { error: 'portal_domain must be a valid bare hostname (e.g. "apply.nust.edu.pk")' },
            { status: 400 }
        );
    }

    const status = body.status === 'saved' ? 'saved' : 'pending';
    const programApplied = body.program_applied
        ? String(body.program_applied).trim().slice(0, 200) || null
        : null;

    const { data, error } = await supabase
        .from('applications')
        .insert({
            student_id: user.id,
            university_slug: slug,
            university_name: name,
            portal_domain: domain,
            program_applied: programApplied,
            status,
        })
        .select()
        .single();

    if (error) {
        // Duplicate entry — already saved
        if (error.code === '23505') {
            return Response.json({ error: 'Application already exists' }, { status: 409 });
        }
        return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ application: data }, { status: 201 });
}
