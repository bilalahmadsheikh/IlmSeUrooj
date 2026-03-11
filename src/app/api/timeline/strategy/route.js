import { createAuthClient, getUser, createPublicClient } from '@/lib/supabase';
import {
    buildDeadlinesFromUniversities,
    mergeSupabaseDeadlines,
    detectRealConflicts,
} from '@/data/deadlines';
import { computeMatchScore } from '@/data/meritFormulas';
import { universities } from '@/data/universities';

function getNextAction(events) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = events
        .filter(e => new Date(e.date) >= today)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (upcoming.length === 0) {
        return { action: 'All deadlines passed', daysRemaining: null };
    }

    const next = upcoming[0];
    const diff = Math.ceil((new Date(next.date) - today) / (1000 * 60 * 60 * 24));
    const dateStr = new Date(next.date).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });

    const labels = {
        registration_open: `Registration opens ${dateStr}`,
        registration_close: `Register by ${dateStr}`,
        test_date: `${next.label || 'Test'} on ${dateStr}`,
        entry_test: `${next.label || 'Test'} on ${dateStr}`,
        result_date: `Results on ${dateStr}`,
        merit_list: `${next.label || 'Merit list'} on ${dateStr}`,
        fee_deadline: `Pay fee by ${dateStr}`,
        fee_submission: `Pay fee by ${dateStr}`,
    };

    return { action: labels[next.type] || `${next.label || next.type} on ${dateStr}`, daysRemaining: diff };
}

// Conflict detection delegated to detectRealConflicts in deadlines.js

// GET /api/timeline/strategy
// Data pipeline: universities.js (CI/CD) → derived deadlines → merged with Supabase rows
export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const fieldFilter = searchParams.get('field') || null;
    const savedSlugs = searchParams.get('savedOnly')?.split(',').filter(Boolean) || null;
    const useProjected = searchParams.get('projected') !== 'false';

    // 1. Get user profile (optional — works without auth too)
    let profile = null;
    try {
        const supabase = createAuthClient(req);
        if (supabase) {
            const user = await getUser(supabase);
            if (user) {
                const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                profile = data;
            }
        }
    } catch { /* unauthenticated is fine */ }

    // 2. Build deadlines from universities.js (CI/CD updated)
    let deadlinesMap = buildDeadlinesFromUniversities();

    // 3. Merge with Supabase (authoritative for merit_list, fee_submission, etc.)
    try {
        const pub = createPublicClient();
        const { data: supabaseRows } = await pub
            .from('university_deadlines')
            .select('*')
            .eq('is_active', true)
            .order('deadline_date', { ascending: true });

        if (supabaseRows && supabaseRows.length > 0) {
            deadlinesMap = mergeSupabaseDeadlines(deadlinesMap, supabaseRows);
        }
    } catch { /* Supabase unavailable — use derived */ }

    // 4. Student effective percentage
    let studentPct = null;
    let isProjected = false;

    if (profile) {
        if (profile.education_system === 'cambridge') {
            studentPct = profile.ibcc_equivalent_inter;
        } else if (['part1_only', 'appearing'].includes(profile.inter_status)) {
            const p1 = Number(profile.fsc_part1_marks) || 0;
            const p1t = Number(profile.fsc_part1_total) || 0;
            studentPct = profile.fsc_projected_percentage ||
                (p1 > 0 && p1t > 0 ? (p1 / p1t) * 100 : null);
            isProjected = true;
        } else {
            studentPct = profile.fsc_percentage;
        }
    }

    if (!useProjected && isProjected) {
        studentPct = null;
        isProjected = false;
    }

    const studentField = profile?.preferred_field || fieldFilter || null;
    const testScore = profile?.net_score || null;

    // 5. Build timeline entries
    const entries = [];

    for (const [slug, deadlineData] of Object.entries(deadlinesMap)) {
        if (savedSlugs && !savedSlugs.includes(slug)) continue;

        const uni = universities.find(u => {
            const s = u.shortName.toLowerCase().replace(/\s+/g, '-');
            return s === slug || u.shortName === deadlineData.shortName;
        });
        const shortName = uni?.shortName || deadlineData.shortName;

        if (fieldFilter && uni) {
            if (!uni.fields.includes(fieldFilter)) continue;
        }

        const { score, tier } = computeMatchScore(
            shortName, studentPct, isProjected, studentField, testScore
        );

        entries.push({
            slug,
            name: deadlineData.name,
            shortName,
            events: deadlineData.events,
            matchScore: score,
            tier,
        });
    }

    entries.sort((a, b) => b.matchScore - a.matchScore);

    // 6. Detect real conflicts (excludes same-system campuses)
    const conflicts = detectRealConflicts(entries);

    // 7. Build strategy
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const strategyItems = entries.map(entry => {
        const { action, daysRemaining } = getNextAction(entry.events);

        const urgencyFactor = daysRemaining != null
            ? Math.max(0.1, 1 - (daysRemaining / 365))
            : 0;
        const priorityScore = entry.matchScore * 0.6 + urgencyFactor * 40;

        return {
            order: 0,
            slug: entry.slug,
            university: entry.name,
            shortName: entry.shortName,
            matchScore: entry.matchScore,
            tier: entry.tier,
            reason: `${entry.tier === 'safe' ? 'High' : entry.tier === 'match' ? 'Good' : 'Low'} match (${entry.matchScore}%)${daysRemaining != null ? `, deadline in ${daysRemaining}d` : ''}`,
            nextAction: action,
            daysRemaining,
            _priority: priorityScore,
        };
    });

    strategyItems.sort((a, b) => b._priority - a._priority);
    strategyItems.forEach((item, i) => { item.order = i + 1; });

    const strategy = strategyItems.map(({ _priority, ...rest }) => rest);

    return Response.json({ timeline: entries, conflicts, strategy });
}
