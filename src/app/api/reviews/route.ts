import { NextRequest } from 'next/server';
import { createAuthClient, createPublicClient, unauthorizedResponse, supabaseUnavailableResponse, getUser, SUPABASE_UNAVAILABLE } from '@/lib/supabase';
import { rateLimit } from '@/lib/rateLimit';

const ALLOWED_SORT = new Set(['created_at', 'overall_rating', 'helpful_count']);

/**
 * GET /api/reviews?university_id=X[&sort=created_at][&type=alumni][&page=1]
 * Public endpoint — returns approved/pending reviews for a university.
 * Aggregates average ratings and distribution.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const universityId = searchParams.get('university_id')?.trim();
  if (!universityId) {
    return Response.json({ error: 'university_id is required' }, { status: 400 });
  }

  const sort   = ALLOWED_SORT.has(searchParams.get('sort') || '') ? searchParams.get('sort')! : 'created_at';
  const type   = searchParams.get('type');    // 'current_student' | 'alumni' | null
  const page   = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit  = 10;
  const offset = (page - 1) * limit;

  const supabase = createPublicClient();

  let query = supabase
    .from('university_reviews')
    .select(`
      id, university_id, reviewer_type,
      overall_rating, academics_rating, facilities_rating,
      faculty_rating, campus_life_rating, value_rating,
      title, body, pros, cons,
      program, batch_year, graduation_year,
      is_verified, edu_email_domain,
      helpful_count, status, created_at,
      profiles:user_id (full_name)
    `, { count: 'exact' })
    .eq('university_id', universityId)
    .in('status', ['approved', 'pending'])
    .order(sort, { ascending: false })
    .range(offset, offset + limit - 1);

  if (type === 'current_student' || type === 'alumni') {
    query = query.eq('reviewer_type', type);
  }

  const { data: reviews, error, count } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Compute aggregate stats across ALL reviews for this university (not just this page)
  const { data: stats } = await supabase
    .from('university_reviews')
    .select('overall_rating, academics_rating, facilities_rating, faculty_rating, campus_life_rating, value_rating')
    .eq('university_id', universityId)
    .in('status', ['approved', 'pending']);

  const aggregate = computeAggregates(stats || []);

  // Mask reviewer full names — show first name + last initial only
  const safeReviews = (reviews || []).map((r: Record<string, unknown>) => {
    const profile = r.profiles as { full_name?: string } | null;
    const raw = profile?.full_name || '';
    const parts = raw.trim().split(/\s+/);
    const display = parts.length >= 2
      ? `${parts[0]} ${parts[parts.length - 1][0]}.`
      : parts[0] || 'Anonymous';
    return { ...r, profiles: undefined, reviewer_name: display };
  });

  return Response.json({
    reviews: safeReviews,
    total: count ?? 0,
    page,
    pages: Math.ceil((count ?? 0) / limit),
    aggregate,
  });
}

function computeAggregates(rows: Record<string, unknown>[]) {
  if (!rows.length) return null;

  const fields = ['overall_rating', 'academics_rating', 'facilities_rating', 'faculty_rating', 'campus_life_rating', 'value_rating'] as const;
  const sums: Record<string, number> = {};
  const counts: Record<string, number> = {};
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (const row of rows) {
    for (const f of fields) {
      const v = row[f] as number | null;
      if (v != null) {
        sums[f]   = (sums[f]   || 0) + v;
        counts[f] = (counts[f] || 0) + 1;
      }
    }
    const o = row.overall_rating as number;
    if (o >= 1 && o <= 5) distribution[o]++;
  }

  const averages: Record<string, number | null> = {};
  for (const f of fields) {
    averages[f] = counts[f] ? Math.round((sums[f] / counts[f]) * 10) / 10 : null;
  }

  return { averages, distribution, total: rows.length };
}

/**
 * POST /api/reviews
 * Authenticated — submit or update a review.
 * Requires a valid session. Verification is handled separately via /api/reviews/verify.
 */
export async function POST(req: NextRequest) {
  const supabase = createAuthClient(req);
  if (!supabase) return unauthorizedResponse();

  const user = await getUser(supabase);
  if (user === SUPABASE_UNAVAILABLE) return supabaseUnavailableResponse();
  if (!user) return unauthorizedResponse();

  // 3 review submissions per hour — generous but stops spamming
  if (rateLimit(user.id, 'reviews:post', 3, 60 * 60_000)) {
    return Response.json({ error: 'Too many review submissions. Please wait before trying again.' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: 'Invalid JSON body' }, { status: 400 });

  const {
    university_id,
    reviewer_type,
    overall_rating,
    academics_rating,
    facilities_rating,
    faculty_rating,
    campus_life_rating,
    value_rating,
    title,
    body: reviewBody,
    pros,
    cons,
    program,
    batch_year,
    graduation_year,
  } = body;

  // --- Validation ---
  if (!university_id || typeof university_id !== 'string') {
    return Response.json({ error: 'university_id is required' }, { status: 400 });
  }
  if (!['current_student', 'alumni'].includes(reviewer_type)) {
    return Response.json({ error: 'reviewer_type must be current_student or alumni' }, { status: 400 });
  }
  if (!Number.isInteger(overall_rating) || overall_rating < 1 || overall_rating > 5) {
    return Response.json({ error: 'overall_rating must be 1–5' }, { status: 400 });
  }
  if (!title || typeof title !== 'string' || title.trim().length < 5) {
    return Response.json({ error: 'title must be at least 5 characters' }, { status: 400 });
  }
  if (!reviewBody || typeof reviewBody !== 'string' || reviewBody.trim().length < 50) {
    return Response.json({ error: 'Review body must be at least 50 characters' }, { status: 400 });
  }
  if (reviewBody.trim().length > 2000) {
    return Response.json({ error: 'Review body must be under 2000 characters' }, { status: 400 });
  }

  const sanitize = (v: unknown, max: number) =>
    v && typeof v === 'string' ? v.trim().slice(0, max) : null;

  const safeRating = (v: unknown) => {
    const n = Number(v);
    return n >= 1 && n <= 5 ? n : null;
  };

  const payload = {
    university_id:     university_id.trim(),
    user_id:           user.id,
    reviewer_type,
    overall_rating,
    academics_rating:   safeRating(academics_rating),
    facilities_rating:  safeRating(facilities_rating),
    faculty_rating:     safeRating(faculty_rating),
    campus_life_rating: safeRating(campus_life_rating),
    value_rating:       safeRating(value_rating),
    title:   sanitize(title, 150)!,
    body:    reviewBody.trim().slice(0, 2000),
    pros:    sanitize(pros, 500),
    cons:    sanitize(cons, 500),
    program: sanitize(program, 150),
    batch_year:      batch_year      ? Number(batch_year)      : null,
    graduation_year: graduation_year ? Number(graduation_year) : null,
    status: 'pending',
  };

  // Upsert — one review per user per university
  const { data, error } = await supabase
    .from('university_reviews')
    .upsert(payload, { onConflict: 'user_id,university_id' })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ review: data }, { status: 201 });
}
