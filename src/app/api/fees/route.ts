import { NextRequest } from 'next/server';
import { createPublicClient, createAuthClient, getUser } from '@/lib/supabase';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const universityId = searchParams.get('university_id');
    const supabase = createPublicClient();

    let query = supabase.from('university_fees').select('*');
    if (universityId) query = query.eq('university_id', universityId);

    const { data, error } = await query.order('university_name');
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ fees: data });
}

export async function POST(req: NextRequest) {
    // Admin only — check service role or special header in production
    const supabase = createPublicClient();
    const body = await req.json();

    const { data, error } = await supabase
        .from('university_fees')
        .insert(body)
        .select()
        .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ fee: data }, { status: 201 });
}
