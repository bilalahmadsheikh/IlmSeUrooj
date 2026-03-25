import { NextRequest } from 'next/server';
import { createPublicClient, createAuthClient, getUser, unauthorizedResponse } from '@/lib/supabase';

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
    const supabase = createAuthClient(req);
    if (!supabase) return unauthorizedResponse();
    const user = await getUser(supabase);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const { university_id, university_name, program, annual_fee, currency } = body;
    if (!university_id || !university_name || annual_fee === undefined) {
        return Response.json({ error: 'university_id, university_name, and annual_fee are required' }, { status: 400 });
    }

    const { data, error } = await supabase
        .from('university_fees')
        .insert({ university_id, university_name, program, annual_fee, currency })
        .select()
        .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ fee: data }, { status: 201 });
}
