import { NextRequest } from 'next/server';
import { createAuthClient, unauthorizedResponse, getUser } from '@/lib/supabase';

function sanitizeDomain(raw: string): string | null {
    if (!raw || typeof raw !== 'string') return null;
    const stripped = raw.replace(/^https?:\/\//i, '').trim();
    if (/[/?#@<>"'`]/.test(stripped)) return null;
    if (stripped.length < 3 || stripped.length > 253) return null;
    if (!/^[a-z0-9]([a-z0-9\-\.]*[a-z0-9])?$/i.test(stripped)) return null;
    if (!stripped.includes('.')) return null;
    if (stripped.includes('..')) return null;
    return stripped.toLowerCase();
}

/**
 * POST /api/applications/batch
 * Syncs multiple saved universities in a single request.
 * Body: { items: Array<{ university_slug, university_name, portal_domain, status? }> }
 * Returns: { created: Application[], skipped: string[], errors: string[] }
 */
export async function POST(req: NextRequest) {
    const supabase = createAuthClient(req);
    if (!supabase) return unauthorizedResponse();

    const user = await getUser(supabase);
    if (!user) return unauthorizedResponse();

    let body: { items?: unknown[] };
    try {
        body = await req.json();
    } catch {
        return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
        return Response.json({ error: 'items must be a non-empty array' }, { status: 400 });
    }

    // Cap batch size to prevent abuse
    const MAX_BATCH = 50;
    const items = body.items.slice(0, MAX_BATCH);

    const toInsert: Record<string, unknown>[] = [];
    const errors: string[] = [];

    for (const item of items) {
        if (!item || typeof item !== 'object') {
            errors.push('Invalid item format');
            continue;
        }
        const obj = item as Record<string, unknown>;

        const slug = obj.university_slug ? String(obj.university_slug).trim().slice(0, 80) : '';
        const name = obj.university_name ? String(obj.university_name).trim().slice(0, 200) : '';
        const domain = sanitizeDomain(String(obj.portal_domain ?? ''));

        if (!slug || !name || !domain) {
            errors.push(`Skipped invalid item: slug=${slug || '?'}`);
            continue;
        }

        toInsert.push({
            student_id: user.id,
            university_slug: slug,
            university_name: name,
            portal_domain: domain,
            program_applied: obj.program_applied
                ? String(obj.program_applied).trim().slice(0, 200) || null
                : null,
            status: obj.status === 'saved' ? 'saved' : 'pending',
        });
    }

    if (toInsert.length === 0) {
        return Response.json({ created: [], skipped: errors, errors }, { status: 200 });
    }

    // upsert with ignoreDuplicates so already-synced items are skipped silently
    const { data, error } = await supabase
        .from('applications')
        .upsert(toInsert, {
            onConflict: 'student_id,university_slug',
            ignoreDuplicates: true,
        })
        .select();

    if (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ created: data ?? [], skipped: [], errors }, { status: 201 });
}
