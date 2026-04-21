import { NextRequest } from 'next/server';
import { createAuthClient, createPublicClient, unauthorizedResponse, supabaseUnavailableResponse, getUser, SUPABASE_UNAVAILABLE } from '@/lib/supabase';
import { rateLimit } from '@/lib/rateLimit';

/**
 * GET /api/alumni-connect?university_id=X
 * Public — returns verified alumni who have opted to be listed for a university.
 * Only alumni with is_verified=true and reviewer_type='alumni' are returned.
 * Personal details are masked — only first name, last initial, program, graduation year.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const universityId = searchParams.get('university_id')?.trim();
  if (!universityId) {
    return Response.json({ error: 'university_id is required' }, { status: 400 });
  }

  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from('university_reviews')
    .select(`
      id, user_id, reviewer_type, program, graduation_year,
      overall_rating, body,
      edu_email_domain, is_verified, created_at,
      profiles:user_id (full_name, city)
    `)
    .eq('university_id', universityId)
    .eq('reviewer_type', 'alumni')
    .eq('is_verified', true)
    .in('status', ['approved'])
    .order('graduation_year', { ascending: false })
    .limit(20);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Mask identifiable info
  const alumni = (data || []).map((r: Record<string, unknown>) => {
    const profile = r.profiles as { full_name?: string; city?: string } | null;
    const raw = profile?.full_name?.trim() || '';
    const parts = raw.split(/\s+/);
    const displayName = parts.length >= 2
      ? `${parts[0]} ${parts[parts.length - 1][0]}.`
      : parts[0] || 'Alumni';

    return {
      id:              r.id,
      review_id:       r.id,
      user_id:         r.user_id,
      display_name:    displayName,
      city:            profile?.city || null,
      program:         r.program,
      graduation_year: r.graduation_year,
      overall_rating:  r.overall_rating,
      excerpt:         typeof r.body === 'string' ? r.body.slice(0, 200) + (r.body.length > 200 ? '…' : '') : '',
      edu_email_domain:r.edu_email_domain,
      is_verified:     r.is_verified,
    };
  });

  return Response.json({ alumni });
}

/**
 * POST /api/alumni-connect
 * Authenticated (student) — send a connection request to an alumni.
 *
 * Body: { alumni_user_id, university_id, message }
 *
 * Rate limit: 10 connection requests per day per user.
 */
export async function POST(req: NextRequest) {
  const supabase = createAuthClient(req);
  if (!supabase) return unauthorizedResponse();

  const user = await getUser(supabase);
  if (user === SUPABASE_UNAVAILABLE) return supabaseUnavailableResponse();
  if (!user) return unauthorizedResponse();

  // 10 requests per 24 hours
  if (rateLimit(user.id, 'alumni:connect', 10, 24 * 60 * 60_000)) {
    return Response.json({ error: 'Connection request limit reached. Try again tomorrow.' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: 'Invalid request body' }, { status: 400 });

  const { alumni_user_id, university_id, message } = body;

  if (!alumni_user_id || !university_id) {
    return Response.json({ error: 'alumni_user_id and university_id are required' }, { status: 400 });
  }

  // Prevent connecting to yourself
  if (alumni_user_id === user.id) {
    return Response.json({ error: 'You cannot connect with yourself.' }, { status: 400 });
  }

  // Validate the target is a verified alumni of this university
  const { data: alumniReview } = await supabase
    .from('university_reviews')
    .select('id')
    .eq('user_id', alumni_user_id)
    .eq('university_id', String(university_id))
    .eq('reviewer_type', 'alumni')
    .eq('is_verified', true)
    .maybeSingle();

  if (!alumniReview) {
    return Response.json({ error: 'This user is not a verified alumni of this university.' }, { status: 404 });
  }

  const msg = typeof message === 'string' ? message.trim().slice(0, 500) : null;

  const { data, error } = await supabase
    .from('alumni_connections')
    .upsert(
      {
        alumni_user_id,
        student_user_id: user.id,
        university_id:   String(university_id),
        message:         msg,
        status:          'pending',
      },
      { onConflict: 'alumni_user_id,student_user_id,university_id' }
    )
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ connection: data }, { status: 201 });
}
