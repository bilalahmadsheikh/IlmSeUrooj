import { NextRequest } from 'next/server';
import { createAuthClient, unauthorizedResponse, supabaseUnavailableResponse, getUser, SUPABASE_UNAVAILABLE } from '@/lib/supabase';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/alumni-connect/:id
 * Authenticated — fetch a single connection request (parties involved only).
 */
export async function GET(req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
  const supabase = createAuthClient(req);
  if (!supabase) return unauthorizedResponse();

  const user = await getUser(supabase);
  if (user === SUPABASE_UNAVAILABLE) return unauthorizedResponse();
  if (!user) return unauthorizedResponse();

  const { data, error } = await supabase
    .from('alumni_connections')
    .select('*')
    .eq('id', id)
    .or(`alumni_user_id.eq.${user.id},student_user_id.eq.${user.id}`)
    .maybeSingle();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!data) return Response.json({ error: 'Not found' }, { status: 404 });

  return Response.json({ connection: data });
}

/**
 * PATCH /api/alumni-connect/:id
 * Authenticated (alumni) — accept or decline a connection request.
 *
 * Body: { status: 'accepted' | 'declined' }
 */
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
  const supabase = createAuthClient(req);
  if (!supabase) return unauthorizedResponse();

  const user = await getUser(supabase);
  if (user === SUPABASE_UNAVAILABLE) return supabaseUnavailableResponse();
  if (!user) return unauthorizedResponse();

  const body = await req.json().catch(() => null);
  if (!body?.status) return Response.json({ error: 'status is required' }, { status: 400 });

  if (!['accepted', 'declined'].includes(body.status)) {
    return Response.json({ error: 'status must be accepted or declined' }, { status: 400 });
  }

  // Only the alumni can accept/decline — enforce via query
  const { data, error } = await supabase
    .from('alumni_connections')
    .update({ status: body.status })
    .eq('id', id)
    .eq('alumni_user_id', user.id)   // Only the alumni owns this action
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!data) return Response.json({ error: 'Connection not found or not authorised' }, { status: 404 });

  return Response.json({ connection: data });
}

/**
 * DELETE /api/alumni-connect/:id
 * Either party can cancel/withdraw a connection.
 */
export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
  const supabase = createAuthClient(req);
  if (!supabase) return unauthorizedResponse();

  const user = await getUser(supabase);
  if (user === SUPABASE_UNAVAILABLE) return supabaseUnavailableResponse();
  if (!user) return unauthorizedResponse();

  const { error } = await supabase
    .from('alumni_connections')
    .delete()
    .eq('id', id)
    .or(`alumni_user_id.eq.${user.id},student_user_id.eq.${user.id}`);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return new Response(null, { status: 204 });
}
