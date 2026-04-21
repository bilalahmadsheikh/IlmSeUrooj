import { NextRequest } from 'next/server';
import { createAuthClient, unauthorizedResponse, supabaseUnavailableResponse, getUser, SUPABASE_UNAVAILABLE } from '@/lib/supabase';
import { rateLimit } from '@/lib/rateLimit';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/reviews/:id
 * Authenticated — user deletes their own review.
 */
export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
  const supabase = createAuthClient(req);
  if (!supabase) return unauthorizedResponse();

  const user = await getUser(supabase);
  if (user === SUPABASE_UNAVAILABLE) return supabaseUnavailableResponse();
  if (!user) return unauthorizedResponse();

  const { error } = await supabase
    .from('university_reviews')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);   // RLS + explicit check

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return new Response(null, { status: 204 });
}

/**
 * PATCH /api/reviews/:id
 * Two sub-actions via body.action:
 *   "helpful"   — toggle a helpful vote for this review
 *   "flag"      — flag a review as inappropriate
 */
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
  const supabase = createAuthClient(req);
  if (!supabase) return unauthorizedResponse();

  const user = await getUser(supabase);
  if (user === SUPABASE_UNAVAILABLE) return supabaseUnavailableResponse();
  if (!user) return unauthorizedResponse();

  const body = await req.json().catch(() => null);
  if (!body?.action) return Response.json({ error: 'action is required' }, { status: 400 });

  if (body.action === 'helpful') {
    // 20 helpful votes per hour — prevents vote-stuffing
    if (rateLimit(user.id, 'reviews:helpful', 20, 60 * 60_000)) {
      return Response.json({ error: 'Too many votes. Slow down.' }, { status: 429 });
    }

    // Check if already voted
    const { data: existing } = await supabase
      .from('review_helpful_votes')
      .select('id')
      .eq('review_id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      // Toggle off
      await supabase.from('review_helpful_votes').delete().eq('id', existing.id);
      // Decrement count
      await supabase.rpc('decrement_helpful_count', { review_id: id });
      return Response.json({ voted: false });
    } else {
      // Vote
      const { error: voteErr } = await supabase
        .from('review_helpful_votes')
        .insert({ review_id: id, user_id: user.id });
      if (voteErr) return Response.json({ error: voteErr.message }, { status: 500 });
      // Increment count
      await supabase.rpc('increment_helpful_count', { review_id: id });
      return Response.json({ voted: true });
    }
  }

  if (body.action === 'flag') {
    // 5 flags per hour per user
    if (rateLimit(user.id, 'reviews:flag', 5, 60 * 60_000)) {
      return Response.json({ error: 'Too many flag requests.' }, { status: 429 });
    }
    // Mark as flagged (only admin can approve/remove, client just sets flagged)
    const { error } = await supabase
      .from('university_reviews')
      .update({ status: 'flagged' })
      .eq('id', id)
      .neq('user_id', user.id);  // Can't flag your own review

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ flagged: true });
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 });
}
