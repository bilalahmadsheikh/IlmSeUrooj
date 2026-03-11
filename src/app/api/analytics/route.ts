import { NextRequest } from 'next/server';
import { createAuthClient, unauthorizedResponse, getUser } from '@/lib/supabase';

export async function GET(req: NextRequest) {
    const supabase = createAuthClient(req);
    if (!supabase) return unauthorizedResponse();
    const user = await getUser(supabase);
    if (!user) return unauthorizedResponse();

    // Gather all analytics data in parallel
    const [
        { data: decisions },
        { data: payments },
        { data: documents },
        { data: tasks },
        { data: referrals },
    ] = await Promise.all([
        supabase.from('admission_decisions').select('*').eq('user_id', user.id),
        supabase.from('payment_tracker').select('*').eq('user_id', user.id),
        supabase.from('user_documents').select('id, document_type, uploaded_at').eq('user_id', user.id),
        supabase.from('user_timeline_tasks').select('*').eq('user_id', user.id),
        supabase.from('referrals').select('*').eq('referrer_id', user.id),
    ]);

    const totalPaid = payments
        ?.filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;

    const totalPending = payments
        ?.filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;

    const completedTasks = tasks?.filter(t => t.completed).length ?? 0;
    const overdueTasks = tasks?.filter(t =>
        !t.completed && t.due_date && new Date(t.due_date) < new Date()
    ).length ?? 0;

    const decisionsByStatus = (decisions ?? []).reduce((acc: Record<string, number>, d) => {
        acc[d.decision_status] = (acc[d.decision_status] ?? 0) + 1;
        return acc;
    }, {});

    return Response.json({
        analytics: {
            applications: {
                total: decisions?.length ?? 0,
                byStatus: decisionsByStatus,
                accepted: decisions?.filter(d => d.decision_status === 'accepted').length ?? 0,
                finalChoice: decisions?.find(d => d.is_final_choice)?.university_name ?? null,
            },
            payments: {
                totalPaid,
                totalPending,
                count: payments?.length ?? 0,
                paidCount: payments?.filter(p => p.status === 'paid').length ?? 0,
            },
            documents: {
                total: documents?.length ?? 0,
                types: [...new Set(documents?.map(d => d.document_type) ?? [])],
            },
            tasks: {
                total: tasks?.length ?? 0,
                completed: completedTasks,
                overdue: overdueTasks,
                completionRate: tasks?.length
                    ? Math.round((completedTasks / tasks.length) * 100)
                    : 0,
            },
            referrals: {
                total: referrals?.length ?? 0,
                successful: referrals?.filter(r => r.status === 'registered' || r.status === 'rewarded').length ?? 0,
                points: referrals?.reduce((sum, r) => sum + (r.reward_points ?? 0), 0) ?? 0,
            },
        },
    });
}
