import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Shared profile hook for components that need access to the student profile.
 * Used by AdmissionPredictor, SavedList, SwipeCard, etc.
 */
export function useProfile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) { setLoading(false); return; }
            supabase.from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()
                .then(({ data }) => { setProfile(data); setLoading(false); });
        });
    }, []);

    const updateProfile = async (updates) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await supabase.from('profiles').upsert({ id: user.id, ...updates }, { onConflict: 'id' });
        setProfile(prev => ({ ...prev, ...updates }));
    };

    /**
     * Get effective intermediate data based on education system and status.
     * Used by AdmissionPredictor for merit calculations.
     */
    function getEffectiveInterData() {
        if (!profile) return { percentage: null, cannotCalculate: true };

        // Cambridge: use IBCC %
        if (profile.education_system === 'cambridge') {
            return {
                percentage: profile.ibcc_equivalent_inter,
                marks: null,
                total: 100,
                label: 'IBCC Equivalence',
                isProjected: false,
                warning: !profile.ibcc_equivalent_inter
                    ? 'Enter your IBCC equivalence % to calculate merit'
                    : null,
            };
        }

        // Not started: can't calculate
        if (profile.inter_status === 'not_started') {
            return {
                percentage: null,
                label: 'No intermediate marks',
                warning: 'You need at least FSc Part-I marks to estimate merit.',
                cannotCalculate: true,
            };
        }

        // Part-I / Appearing: use projected
        if (['part1_only', 'appearing'].includes(profile.inter_status)) {
            const projected = profile.fsc_projected_percentage ||
                (profile.fsc_part1_marks && profile.fsc_part1_total
                    ? ((profile.fsc_part1_marks / profile.fsc_part1_total) * 100)
                    : null);
            return {
                percentage: projected ? parseFloat(projected).toFixed(2) : null,
                marks: profile.fsc_projected_marks,
                total: profile.fsc_total || 1100,
                label: 'FSc (Projected from Part-I)',
                isProjected: true,
                warning: 'Merit is estimated using projected marks. Actual merit may change after Part-II result.',
            };
        }

        // Complete / Result awaited: use actual
        return {
            percentage: profile.fsc_percentage,
            marks: profile.fsc_marks,
            total: profile.fsc_total || 1100,
            label: profile.inter_status === 'result_awaited' ? 'FSc (Result Awaited)' : 'FSc',
            isProjected: false,
            warning: profile.inter_status === 'result_awaited'
                ? 'Using marks entered before result. Update when official result arrives.'
                : null,
        };
    }

    return { profile, loading, updateProfile, getEffectiveInterData };
}
