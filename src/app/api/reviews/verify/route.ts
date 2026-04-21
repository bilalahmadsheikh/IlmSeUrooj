import { NextRequest } from 'next/server';
import { createAuthClient, unauthorizedResponse, supabaseUnavailableResponse, getUser, SUPABASE_UNAVAILABLE } from '@/lib/supabase';
import { sendVerificationOtp } from '@/lib/email';
import { rateLimit } from '@/lib/rateLimit';
import crypto from 'crypto';

/**
 * POST /api/reviews/verify
 * Step 1 — send OTP to the submitted university email.
 *
 * Body: { university_id, edu_email, university_name }
 *
 * Security:
 *   - Validates email domain against university_email_domains table
 *   - Rate-limited to 5 send attempts per user per hour
 *   - OTP stored as SHA-256(otp + salt), plaintext never persisted
 *   - Previous unused tokens for the same user+university are invalidated
 */
export async function POST(req: NextRequest) {
  const supabase = createAuthClient(req);
  if (!supabase) return unauthorizedResponse();

  const user = await getUser(supabase);
  if (user === SUPABASE_UNAVAILABLE) return supabaseUnavailableResponse();
  if (!user) return unauthorizedResponse();

  // 5 OTP requests per hour per user
  if (rateLimit(user.id, 'verify:send', 5, 60 * 60_000)) {
    return Response.json({ error: 'Too many verification requests. Try again later.' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: 'Invalid request body' }, { status: 400 });

  const { university_id, edu_email, university_name } = body;

  // --- Basic email format check ---
  if (!edu_email || typeof edu_email !== 'string' || !edu_email.includes('@')) {
    return Response.json({ error: 'Invalid email address' }, { status: 400 });
  }
  const normalEmail = edu_email.trim().toLowerCase();
  const domain = normalEmail.split('@')[1];

  if (!domain || !domain.includes('.')) {
    return Response.json({ error: 'Invalid email domain' }, { status: 400 });
  }

  // --- Validate domain belongs to the claimed university ---
  const { data: domainRow, error: domainErr } = await supabase
    .from('university_email_domains')
    .select('domain')
    .eq('university_id', String(university_id))
    .eq('domain', domain)
    .maybeSingle();

  if (domainErr) {
    return Response.json({ error: 'Could not verify domain' }, { status: 500 });
  }
  if (!domainRow) {
    return Response.json({
      error: `"${domain}" is not a recognised email domain for this university. Use your official .edu.pk email.`,
    }, { status: 422 });
  }

  // --- Check if user already has a verified review for this university ---
  const { data: existingReview } = await supabase
    .from('university_reviews')
    .select('is_verified')
    .eq('user_id', user.id)
    .eq('university_id', String(university_id))
    .maybeSingle();

  if (existingReview?.is_verified) {
    return Response.json({ error: 'Your review is already verified.' }, { status: 409 });
  }

  // --- Invalidate any previous unused tokens for this user + university ---
  await supabase
    .from('review_verification_tokens')
    .delete()
    .eq('user_id', user.id)
    .eq('university_id', String(university_id))
    .is('used_at', null);

  // --- Generate OTP ---
  const otp  = String(crypto.randomInt(100000, 999999));
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .createHash('sha256')
    .update(otp + salt)
    .digest('hex');

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { error: insertErr } = await supabase
    .from('review_verification_tokens')
    .insert({
      user_id:       user.id,
      university_id: String(university_id),
      edu_email:     normalEmail,
      token_hash:    hash,
      token_salt:    salt,
      expires_at:    expiresAt,
    });

  if (insertErr) {
    return Response.json({ error: 'Could not create verification token' }, { status: 500 });
  }

  // --- Send email ---
  try {
    await sendVerificationOtp({
      to: normalEmail,
      otp,
      universityName: university_name || 'your university',
    });
  } catch (e) {
    console.error('[verify] email send failed:', e);
    // Don't expose mail errors to client — log and fail gracefully
    return Response.json({ error: 'Could not send verification email. Check your address and try again.' }, { status: 500 });
  }

  return Response.json({ sent: true, email: normalEmail, expiresAt });
}

/**
 * PUT /api/reviews/verify
 * Step 2 — verify the OTP and mark the review as verified.
 *
 * Body: { university_id, otp }
 *
 * Security:
 *   - 5 OTP verification attempts per user per hour
 *   - Increments attempt counter; token locked after 3 wrong attempts
 *   - Token is single-use (used_at set on success)
 *   - OTP checked via constant-time comparison of SHA-256 hashes
 */
export async function PUT(req: NextRequest) {
  const supabase = createAuthClient(req);
  if (!supabase) return unauthorizedResponse();

  const user = await getUser(supabase);
  if (user === SUPABASE_UNAVAILABLE) return supabaseUnavailableResponse();
  if (!user) return unauthorizedResponse();

  // 5 verify attempts per user per hour
  if (rateLimit(user.id, 'verify:check', 5, 60 * 60_000)) {
    return Response.json({ error: 'Too many verification attempts. Try again later.' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: 'Invalid request body' }, { status: 400 });

  const { university_id, otp } = body;
  if (!otp || typeof otp !== 'string' || !/^\d{6}$/.test(otp.trim())) {
    return Response.json({ error: 'OTP must be a 6-digit code' }, { status: 400 });
  }

  // Fetch the most recent unused, unexpired token for this user+university
  const { data: token, error: tokenErr } = await supabase
    .from('review_verification_tokens')
    .select('*')
    .eq('user_id', user.id)
    .eq('university_id', String(university_id))
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (tokenErr) return Response.json({ error: 'Verification error' }, { status: 500 });

  if (!token) {
    return Response.json({ error: 'No active verification request found. Please request a new code.' }, { status: 404 });
  }

  // Increment attempt counter first
  await supabase
    .from('review_verification_tokens')
    .update({ attempts: (token.attempts || 0) + 1 })
    .eq('id', token.id);

  if ((token.attempts || 0) >= 3) {
    // Invalidate token
    await supabase.from('review_verification_tokens').update({ used_at: new Date().toISOString() }).eq('id', token.id);
    return Response.json({ error: 'Too many incorrect attempts. Request a new verification code.' }, { status: 403 });
  }

  // Constant-time OTP check
  const inputHash = crypto.createHash('sha256').update(otp.trim() + token.token_salt).digest('hex');
  const valid = crypto.timingSafeEqual(Buffer.from(inputHash, 'hex'), Buffer.from(token.token_hash, 'hex'));

  if (!valid) {
    const remaining = 3 - ((token.attempts || 0) + 1);
    return Response.json({ error: `Incorrect code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` }, { status: 422 });
  }

  // Mark token as used
  await supabase
    .from('review_verification_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', token.id);

  // Mark review as verified
  const { error: updateErr } = await supabase
    .from('university_reviews')
    .update({
      is_verified:           true,
      edu_email_domain:      token.edu_email.split('@')[1],
      edu_email_verified_at: new Date().toISOString(),
      status:                'approved',
    })
    .eq('user_id', user.id)
    .eq('university_id', String(university_id));

  if (updateErr) {
    return Response.json({ error: 'Could not update review verification status' }, { status: 500 });
  }

  return Response.json({ verified: true });
}
