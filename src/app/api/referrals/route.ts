import { NextRequest } from 'next/server';
import { createAuthClient, unauthorizedResponse, getUser, createPublicClient } from '@/lib/supabase';

function generateReferralCode(userId: string): string {
    const base = userId.replace(/-/g, '').slice(0, 6).toUpperCase();
    const suffix = Math.random().toString(36).slice(2, 5).toUpperCase();
    return `ISU-${base}-${suffix}`;
}

export async function GET(req: NextRequest) {
    const supabase = createAuthClient(req);
    if (!supabase) return unauthorizedResponse();
    const user = await getUser(supabase);
    if (!user) return unauthorizedResponse();

    const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ referrals: data });
}

export async function POST(req: NextRequest) {
    const supabase = createAuthClient(req);
    if (!supabase) return unauthorizedResponse();
    const user = await getUser(supabase);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const { referred_email } = body;
    if (!referred_email) return Response.json({ error: 'referred_email required' }, { status: 400 });

    const referral_code = generateReferralCode(user.id);

    const { data, error } = await supabase
        .from('referrals')
        .insert({
            referrer_id: user.id,
            referred_email,
            referral_code,
            status: 'pending',
        })
        .select()
        .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ referral: data }, { status: 201 });
}

// GET /api/referrals/validate?code=ISU-XXX
export async function PUT(req: NextRequest) {
    const body = await req.json();
    const { code, user_id } = body;
    if (!code || !user_id) return Response.json({ error: 'Missing code or user_id' }, { status: 400 });

    const supabase = createPublicClient();
    const { data: referral, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referral_code', code)
        .single();

    if (error || !referral) return Response.json({ error: 'Invalid referral code' }, { status: 404 });
    if (referral.status !== 'pending') return Response.json({ error: 'Referral already used' }, { status: 400 });

    const { data, error: updateError } = await supabase
        .from('referrals')
        .update({
            referred_id: user_id,
            status: 'registered',
            completed_at: new Date().toISOString(),
            reward_points: 50,
        })
        .eq('id', referral.id)
        .select()
        .single();

    if (updateError) return Response.json({ error: updateError.message }, { status: 500 });

    // Award points to referrer profile
    await supabase.rpc('increment_referral_points', {
        user_id: referral.referrer_id,
        points: 50,
    }).maybeSingle();

    return Response.json({ referral: data });
}
